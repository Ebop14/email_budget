use tauri::AppHandle;

use crate::db::{self, queries};

/// Initialize the database (called on app startup)
#[tauri::command]
pub async fn initialize_database(app_handle: AppHandle) -> Result<(), String> {
    db::initialize(&app_handle).await.map_err(|e| e.to_string())
}

/// Set a merchant category rule
#[tauri::command]
pub async fn set_merchant_category_rule(
    app_handle: AppHandle,
    merchant_pattern: String,
    category_id: String,
    is_exact_match: bool,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    queries::set_merchant_category_rule(&conn, user_id, &merchant_pattern, &category_id, is_exact_match)
        .map_err(|e| e.to_string())
}
