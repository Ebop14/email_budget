use tauri::{AppHandle, Emitter};

use crate::categorizer::categorize_transaction;
use crate::db::{self, queries};
use crate::parser;

use super::client::GmailClient;
use super::oauth;
use super::tokens;
use super::types::*;

/// Run one sync cycle: either initial sync (last 90 days) or incremental (history.list)
pub async fn run_sync_cycle(app_handle: &AppHandle) -> Result<SyncCycleResult, String> {
    // Get valid access token (refresh if needed) — connection is NOT held across await
    let access_token = get_valid_access_token(app_handle).await?;
    let gmail = GmailClient::new(&access_token);

    // Read state from DB (no await while conn is live)
    let (sender_emails, sync_state) = {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
        let emails = tokens::get_enabled_sender_emails(&conn).map_err(|e| e.to_string())?;
        let state = tokens::get_sync_state(&conn).map_err(|e| e.to_string())?;
        (emails, state)
    };

    if sender_emails.is_empty() {
        return Ok(SyncCycleResult::empty());
    }

    let result = match sync_state {
        Some((Some(history_id), _, true)) => {
            // Incremental sync using history.list
            match incremental_sync(app_handle, &gmail, &history_id, &sender_emails).await {
                Ok(r) => r,
                Err(e) if e == "HISTORY_EXPIRED" => {
                    log::warn!("History ID expired, falling back to initial sync");
                    let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
                    tokens::reset_sync_state(&conn).map_err(|e| e.to_string())?;
                    drop(conn);
                    initial_sync(app_handle, &gmail, &sender_emails).await?
                }
                Err(e) => return Err(e),
            }
        }
        _ => {
            // Initial sync: fetch last 90 days
            initial_sync(app_handle, &gmail, &sender_emails).await?
        }
    };

    // Emit sync result event
    let _ = app_handle.emit("gmail:sync-result", &result);

    Ok(result)
}

/// Initial sync: fetch messages from the last 90 days matching sender filters
async fn initial_sync(
    app_handle: &AppHandle,
    gmail: &GmailClient,
    sender_emails: &[String],
) -> Result<SyncCycleResult, String> {
    log::info!("Starting initial Gmail sync (last 90 days)");

    let mut result = SyncCycleResult::empty();
    let ninety_days_ago = chrono::Utc::now() - chrono::Duration::days(90);
    let after_date = ninety_days_ago.format("%Y/%m/%d").to_string();

    // Build query for all sender emails
    let from_query: Vec<String> = sender_emails
        .iter()
        .map(|e| format!("from:{}", e))
        .collect();
    let query = format!("({}) after:{}", from_query.join(" OR "), after_date);

    let mut page_token: Option<String> = None;

    loop {
        let message_list = gmail
            .list_messages(&query, page_token.as_deref(), 50)
            .await?;

        if let Some(messages) = message_list.messages {
            for msg_ref in &messages {
                match process_message(app_handle, gmail, &msg_ref.id, sender_emails).await {
                    Ok(ProcessResult::Imported) => result.new_transactions += 1,
                    Ok(ProcessResult::Duplicate) => result.duplicates_skipped += 1,
                    Ok(ProcessResult::Skipped) => {}
                    Err(e) => result.errors.push(e),
                }
                result.emails_processed += 1;
            }
        }

        page_token = message_list.next_page_token;
        if page_token.is_none() {
            break;
        }
    }

    // Get current history ID to use for future incremental syncs
    let profile = gmail.get_profile().await?;
    if let Some(history_id) = profile.history_id {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
        tokens::upsert_sync_state(&conn, Some(&history_id), true)
            .map_err(|e| e.to_string())?;
    }

    log::info!(
        "Initial sync complete: {} imported, {} duplicates, {} errors",
        result.new_transactions,
        result.duplicates_skipped,
        result.errors.len()
    );

    Ok(result)
}

/// Incremental sync: use history.list to only fetch new messages since last sync
async fn incremental_sync(
    app_handle: &AppHandle,
    gmail: &GmailClient,
    history_id: &str,
    sender_emails: &[String],
) -> Result<SyncCycleResult, String> {
    log::debug!("Starting incremental Gmail sync from history_id={}", history_id);

    let mut result = SyncCycleResult::empty();
    let mut page_token: Option<String> = None;
    let mut new_history_id: Option<String> = None;

    loop {
        let history_list = gmail
            .list_history(history_id, page_token.as_deref())
            .await?;

        // Track the latest history ID
        if let Some(ref hid) = history_list.history_id {
            new_history_id = Some(hid.clone());
        }

        if let Some(records) = history_list.history {
            for record in &records {
                if let Some(ref added) = record.messages_added {
                    for msg in added {
                        match process_message(app_handle, gmail, &msg.message.id, sender_emails).await {
                            Ok(ProcessResult::Imported) => result.new_transactions += 1,
                            Ok(ProcessResult::Duplicate) => result.duplicates_skipped += 1,
                            Ok(ProcessResult::Skipped) => {}
                            Err(e) => result.errors.push(e),
                        }
                        result.emails_processed += 1;
                    }
                }
            }
        }

        page_token = history_list.next_page_token;
        if page_token.is_none() {
            break;
        }
    }

    // Update sync state with new history ID
    if let Some(hid) = new_history_id {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
        tokens::upsert_sync_state(&conn, Some(&hid), true)
            .map_err(|e| e.to_string())?;
    }

    if result.new_transactions > 0 {
        log::info!(
            "Incremental sync: {} new transactions, {} duplicates",
            result.new_transactions,
            result.duplicates_skipped
        );
    }

    Ok(result)
}

enum ProcessResult {
    Imported,
    Duplicate,
    Skipped,
}

/// Process a single Gmail message: fetch, check sender, parse HTML, save transaction
async fn process_message(
    app_handle: &AppHandle,
    gmail: &GmailClient,
    message_id: &str,
    sender_emails: &[String],
) -> Result<ProcessResult, String> {
    // Check if already processed (short-lived connection)
    {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
        if tokens::is_message_processed(&conn, message_id).map_err(|e| e.to_string())? {
            return Ok(ProcessResult::Skipped);
        }
    }

    // Fetch full message (async, no connection held)
    let message = gmail.get_message(message_id).await?;

    // Check sender matches our filters
    let from_header = GmailClient::get_from_header(&message).unwrap_or_default();
    let from_lower = from_header.to_lowercase();

    let sender_match = sender_emails
        .iter()
        .any(|email| from_lower.contains(&email.to_lowercase()));

    if !sender_match {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
        tokens::mark_message_processed(&conn, message_id).map_err(|e| e.to_string())?;
        return Ok(ProcessResult::Skipped);
    }

    // Extract HTML body
    let html = match GmailClient::extract_html_body(&message) {
        Some(h) => h,
        None => {
            let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
            tokens::mark_message_processed(&conn, message_id).map_err(|e| e.to_string())?;
            return Ok(ProcessResult::Skipped);
        }
    };

    // Parse through existing parser engine (sync, no await)
    let parse_result = parser::parse_html(&html);

    // All DB operations below are sync — open one connection for the block
    let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;

    match parse_result {
        parser::types::ParseResult::Success(transaction) => {
            let source_hash = transaction.source_hash();

            // Check for duplicate via source_hash (covers both Gmail + manual import)
            if queries::transaction_exists(&conn, &source_hash).unwrap_or(false) {
                tokens::mark_message_processed(&conn, message_id).map_err(|e| e.to_string())?;
                return Ok(ProcessResult::Duplicate);
            }

            let user_id = "local";
            let merchant_normalized = transaction.merchant_normalized();

            // Auto-categorize
            let category_id = categorize_transaction(
                &conn,
                user_id,
                &merchant_normalized,
                &transaction.provider,
            )
            .ok()
            .flatten();

            // Insert transaction
            match queries::insert_transaction(
                &conn,
                user_id,
                category_id.as_deref(),
                &transaction.merchant,
                &merchant_normalized,
                transaction.amount,
                &transaction.transaction_date,
                &transaction.provider,
                &source_hash,
            ) {
                Ok(transaction_id) => {
                    for item in &transaction.items {
                        let _ = queries::insert_transaction_item(
                            &conn,
                            &transaction_id,
                            &item.name,
                            item.quantity,
                            item.unit_price,
                            item.total_price,
                        );
                    }
                    tokens::mark_message_processed(&conn, message_id)
                        .map_err(|e| e.to_string())?;
                    Ok(ProcessResult::Imported)
                }
                Err(e) => {
                    tokens::mark_message_processed(&conn, message_id)
                        .map_err(|e2| e2.to_string())?;
                    Err(format!("Failed to insert transaction: {}", e))
                }
            }
        }
        parser::types::ParseResult::Failed(err) => {
            tokens::mark_message_processed(&conn, message_id).map_err(|e| e.to_string())?;
            log::debug!("Failed to parse Gmail message {}: {}", message_id, err);
            Ok(ProcessResult::Skipped)
        }
        parser::types::ParseResult::NotRecognized => {
            tokens::mark_message_processed(&conn, message_id).map_err(|e| e.to_string())?;
            Ok(ProcessResult::Skipped)
        }
    }
}

/// Get a valid access token, refreshing if expired.
/// Opens and drops the DB connection before any async work to avoid Send issues.
async fn get_valid_access_token(app_handle: &AppHandle) -> Result<String, String> {
    // Read tokens from DB (sync block, connection dropped before await)
    let (access_token, refresh_token, expires_at) = {
        let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;

        let (access_token, refresh_token, expires_at, _email) = tokens::get_tokens(&conn)
            .map_err(|e| e.to_string())?
            .ok_or("Not connected to Gmail")?;

        // Check if token is expired (with 60s buffer)
        let expires = chrono::DateTime::parse_from_rfc3339(&expires_at)
            .map_err(|e| format!("Invalid expires_at: {}", e))?;

        let buffer = chrono::Duration::seconds(60);
        if chrono::Utc::now() + buffer < expires {
            return Ok(access_token);
        }

        (access_token, refresh_token, expires_at)
    };
    // conn is dropped here

    let _ = (access_token, expires_at); // explicitly mark as consumed

    // Now do the async refresh using hardcoded credentials (no Connection held)
    match oauth::refresh_access_token(&refresh_token).await {
        Ok((new_access_token, new_expires_at)) => {
            let conn = db::get_connection(app_handle).map_err(|e| e.to_string())?;
            tokens::update_access_token(&conn, &new_access_token, &new_expires_at)
                .map_err(|e| e.to_string())?;
            Ok(new_access_token)
        }
        Err(e) => {
            log::error!("Token refresh failed: {}", e);
            let _ = app_handle.emit("gmail:auth-required", ());
            Err("AUTH_EXPIRED".to_string())
        }
    }
}
