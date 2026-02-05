use tauri::AppHandle;

use crate::db::{self, queries};

/// Get all categories
#[tauri::command]
pub async fn get_categories(
    app_handle: AppHandle,
) -> Result<Vec<queries::Category>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    queries::get_all_categories(&conn, user_id).map_err(|e| e.to_string())
}

/// Create a new category
#[tauri::command]
pub async fn create_category(
    app_handle: AppHandle,
    name: String,
    icon: String,
    color: String,
) -> Result<queries::Category, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    queries::create_category(&conn, user_id, &name, &icon, &color).map_err(|e| e.to_string())
}

/// Update a category
#[tauri::command]
pub async fn update_category(
    app_handle: AppHandle,
    category_id: String,
    name: String,
    icon: String,
    color: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    queries::update_category(&conn, &category_id, &name, &icon, &color).map_err(|e| e.to_string())
}

/// Delete a category
#[tauri::command]
pub async fn delete_category(
    app_handle: AppHandle,
    category_id: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    queries::delete_category(&conn, &category_id).map_err(|e| e.to_string())
}

/// Get category spending for a date range
#[tauri::command]
pub async fn get_category_spending(
    app_handle: AppHandle,
    start_date: String,
    end_date: String,
) -> Result<Vec<queries::CategorySpending>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    queries::get_category_spending(&conn, user_id, &start_date, &end_date)
        .map_err(|e| e.to_string())
}
