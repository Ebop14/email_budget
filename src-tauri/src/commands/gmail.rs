use tauri::{AppHandle, Manager};

use crate::db;
use crate::gmail::{oauth, tokens, sync, poller::GmailPollerState};
use crate::gmail::types::*;

// ============================================================================
// Credentials
// ============================================================================

#[tauri::command]
pub async fn gmail_save_credentials(
    app_handle: AppHandle,
    client_id: String,
    client_secret: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::save_credentials(&conn, &client_id, &client_secret)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_has_credentials(app_handle: AppHandle) -> Result<bool, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::has_credentials(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_delete_credentials(app_handle: AppHandle) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Stop polling first
    let poller = app_handle.state::<GmailPollerState>();
    poller.stop();

    // Delete everything
    tokens::delete_tokens(&conn).map_err(|e| e.to_string())?;
    tokens::reset_sync_state(&conn).map_err(|e| e.to_string())?;
    tokens::clear_processed_messages(&conn).map_err(|e| e.to_string())?;
    tokens::delete_credentials(&conn).map_err(|e| e.to_string())
}

// ============================================================================
// OAuth
// ============================================================================

#[tauri::command]
pub async fn gmail_connect(app_handle: AppHandle) -> Result<String, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let (client_id, client_secret) = tokens::get_credentials(&conn)
        .map_err(|e| e.to_string())?
        .ok_or("No Gmail credentials configured. Please add your Google Cloud OAuth credentials first.")?;

    // Run OAuth flow
    let oauth_tokens = oauth::run_oauth_flow(&client_id, &client_secret).await?;

    // Get user email from profile
    let gmail_client = crate::gmail::client::GmailClient::new(&oauth_tokens.access_token);
    let profile = gmail_client.get_profile().await?;

    // Save tokens
    tokens::save_tokens(
        &conn,
        &oauth_tokens.access_token,
        &oauth_tokens.refresh_token,
        &oauth_tokens.expires_at,
        &profile.email_address,
    )
    .map_err(|e| e.to_string())?;

    // Start polling
    let poller = app_handle.state::<GmailPollerState>();
    poller.start();

    log::info!("Gmail connected for: {}", profile.email_address);
    Ok(profile.email_address)
}

#[tauri::command]
pub async fn gmail_disconnect(app_handle: AppHandle) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    // Stop polling
    let poller = app_handle.state::<GmailPollerState>();
    poller.stop();

    // Revoke token (best effort)
    if let Ok(Some((access_token, _, _, _))) = tokens::get_tokens(&conn) {
        oauth::revoke_token(&access_token).await;
    }

    // Clear tokens and sync state
    tokens::delete_tokens(&conn).map_err(|e| e.to_string())?;
    tokens::reset_sync_state(&conn).map_err(|e| e.to_string())?;
    tokens::clear_processed_messages(&conn).map_err(|e| e.to_string())?;

    log::info!("Gmail disconnected");
    Ok(())
}

// ============================================================================
// Status
// ============================================================================

#[tauri::command]
pub async fn gmail_get_status(app_handle: AppHandle) -> Result<GmailConnectionStatus, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let has_creds = tokens::has_credentials(&conn).map_err(|e| e.to_string())?;
    let token_info = tokens::get_tokens(&conn).map_err(|e| e.to_string())?;
    let sync_state = tokens::get_sync_state(&conn).map_err(|e| e.to_string())?;

    let poller = app_handle.state::<GmailPollerState>();

    Ok(GmailConnectionStatus {
        has_credentials: has_creds,
        is_connected: token_info.is_some(),
        email: token_info.map(|(_, _, _, email)| email),
        is_polling: poller.is_running(),
        last_sync_at: sync_state.and_then(|(_, last_sync, _)| last_sync),
        sync_status: if poller.is_running() {
            GmailSyncStatus::Idle
        } else {
            GmailSyncStatus::Idle
        },
    })
}

// ============================================================================
// Polling control
// ============================================================================

#[tauri::command]
pub async fn gmail_start_polling(app_handle: AppHandle) -> Result<(), String> {
    let poller = app_handle.state::<GmailPollerState>();
    poller.start();
    Ok(())
}

#[tauri::command]
pub async fn gmail_stop_polling(app_handle: AppHandle) -> Result<(), String> {
    let poller = app_handle.state::<GmailPollerState>();
    poller.stop();
    Ok(())
}

// ============================================================================
// Manual sync
// ============================================================================

#[tauri::command]
pub async fn gmail_sync_now(app_handle: AppHandle) -> Result<SyncCycleResult, String> {
    sync::run_sync_cycle(&app_handle).await
}

// ============================================================================
// Sender filters
// ============================================================================

#[tauri::command]
pub async fn gmail_get_sender_filters(app_handle: AppHandle) -> Result<Vec<SenderFilter>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::get_sender_filters(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_add_sender_filter(
    app_handle: AppHandle,
    email: String,
    label: String,
) -> Result<SenderFilter, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::add_sender_filter(&conn, &email, &label).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_remove_sender_filter(
    app_handle: AppHandle,
    filter_id: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::remove_sender_filter(&conn, &filter_id).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn gmail_toggle_sender_filter(
    app_handle: AppHandle,
    filter_id: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    tokens::toggle_sender_filter(&conn, &filter_id).map_err(|e| e.to_string())
}
