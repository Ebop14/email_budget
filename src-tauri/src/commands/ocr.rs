use tauri::AppHandle;

use crate::db;
use crate::ocr;
use crate::parser::types::ParsedTransaction;
use crate::categorizer::categorize_transaction;

/// Import a receipt from OCR text, returning parsed transaction for preview
#[tauri::command]
pub async fn import_receipt_from_ocr(
    app_handle: AppHandle,
    ocr_text: String,
    confidence: f64,
) -> Result<ParsedTransaction, String> {
    let ocr_result = ocr::OcrResult::new(ocr_text, confidence);

    let transaction = ocr::parse_receipt_text(&ocr_result)
        .map_err(|e| format!("Failed to parse receipt text: {}", e))?;

    // Try auto-categorization (best-effort, don't fail if it doesn't work)
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let merchant_normalized = transaction.merchant_normalized();
    if let Ok(Some(category_id)) =
        categorize_transaction(&conn, "local", &merchant_normalized, &transaction.provider)
    {
        log::info!(
            "Auto-categorized OCR receipt '{}' -> {}",
            transaction.merchant,
            category_id
        );
    }

    Ok(transaction)
}
