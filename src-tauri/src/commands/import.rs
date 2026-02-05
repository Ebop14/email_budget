use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, State};

use crate::categorizer::categorize_transaction;
use crate::db::{self, queries};
use crate::parser::{self, ParsedTransaction};

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportPreview {
    pub transactions: Vec<ParsedTransaction>,
    pub duplicates: i32,
    pub errors: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: i32,
    pub skipped: i32,
    pub errors: Vec<String>,
}

/// Parse HTML receipts and return preview of transactions
#[tauri::command]
pub async fn import_receipts(
    app_handle: AppHandle,
    html_contents: Vec<String>,
) -> Result<ImportPreview, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    let mut transactions = Vec::new();
    let mut duplicates = 0;
    let mut errors = Vec::new();

    for (i, html) in html_contents.iter().enumerate() {
        match parser::parse_html(html) {
            parser::types::ParseResult::Success(transaction) => {
                // Check for duplicates
                let hash = transaction.source_hash();
                if queries::transaction_exists(&conn, &hash).unwrap_or(false) {
                    duplicates += 1;
                    log::info!("Skipping duplicate transaction: {}", transaction.merchant);
                } else {
                    transactions.push(transaction);
                }
            }
            parser::types::ParseResult::Failed(err) => {
                errors.push(format!("File {}: {}", i + 1, err));
            }
            parser::types::ParseResult::NotRecognized => {
                errors.push(format!("File {}: Not recognized as a receipt", i + 1));
            }
        }
    }

    Ok(ImportPreview {
        transactions,
        duplicates,
        errors,
    })
}

/// Confirm and save imported transactions
#[tauri::command]
pub async fn confirm_import(
    app_handle: AppHandle,
    transactions: Vec<ParsedTransaction>,
    category_assignments: HashMap<usize, String>,
) -> Result<ImportResult, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    let mut imported = 0;
    let mut skipped = 0;
    let mut errors = Vec::new();

    for (i, transaction) in transactions.iter().enumerate() {
        let source_hash = transaction.source_hash();

        // Skip if already exists
        if queries::transaction_exists(&conn, &source_hash).unwrap_or(false) {
            skipped += 1;
            continue;
        }

        // Determine category
        let category_id = if let Some(assigned_id) = category_assignments.get(&i) {
            Some(assigned_id.clone())
        } else {
            // Auto-categorize
            categorize_transaction(
                &conn,
                user_id,
                &transaction.merchant_normalized(),
                &transaction.provider,
            )
            .ok()
            .flatten()
        };

        // Insert transaction
        match queries::insert_transaction(
            &conn,
            user_id,
            category_id.as_deref(),
            &transaction.merchant,
            &transaction.merchant_normalized(),
            transaction.amount,
            &transaction.transaction_date,
            &transaction.provider,
            &source_hash,
        ) {
            Ok(transaction_id) => {
                // Insert items
                for item in &transaction.items {
                    if let Err(e) = queries::insert_transaction_item(
                        &conn,
                        &transaction_id,
                        &item.name,
                        item.quantity,
                        item.unit_price,
                        item.total_price,
                    ) {
                        log::warn!("Failed to insert item: {}", e);
                    }
                }
                imported += 1;
            }
            Err(e) => {
                errors.push(format!("{}: {}", transaction.merchant, e));
            }
        }
    }

    Ok(ImportResult {
        imported,
        skipped,
        errors,
    })
}
