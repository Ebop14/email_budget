use tauri::AppHandle;

use crate::db::{self, queries};

/// Get all budgets with progress
#[tauri::command]
pub async fn get_budgets(
    app_handle: AppHandle,
) -> Result<Vec<queries::BudgetWithProgress>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    queries::get_all_budgets(&conn, user_id).map_err(|e| e.to_string())
}

/// Set a budget for a category
#[tauri::command]
pub async fn set_budget(
    app_handle: AppHandle,
    category_id: String,
    amount: i64,
    period: String,
) -> Result<queries::Budget, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    // Validate period
    if !["weekly", "monthly", "yearly"].contains(&period.as_str()) {
        return Err("Invalid budget period. Must be weekly, monthly, or yearly.".to_string());
    }

    queries::set_budget(&conn, user_id, &category_id, amount, &period).map_err(|e| e.to_string())
}

/// Delete a budget
#[tauri::command]
pub async fn delete_budget(
    app_handle: AppHandle,
    budget_id: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    queries::delete_budget(&conn, &budget_id).map_err(|e| e.to_string())
}
