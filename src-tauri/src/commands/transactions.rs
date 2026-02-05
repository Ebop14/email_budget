use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db::{self, queries};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TransactionFilters {
    pub search: Option<String>,
    #[serde(rename = "categoryId")]
    pub category_id: Option<String>,
    pub provider: Option<String>,
    #[serde(rename = "startDate")]
    pub start_date: Option<String>,
    #[serde(rename = "endDate")]
    pub end_date: Option<String>,
    #[serde(rename = "minAmount")]
    pub min_amount: Option<i64>,
    #[serde(rename = "maxAmount")]
    pub max_amount: Option<i64>,
}

impl From<TransactionFilters> for queries::TransactionFilters {
    fn from(f: TransactionFilters) -> Self {
        queries::TransactionFilters {
            search: f.search,
            category_id: f.category_id,
            provider: f.provider,
            start_date: f.start_date,
            end_date: f.end_date,
            min_amount: f.min_amount,
            max_amount: f.max_amount,
        }
    }
}

/// Get all transactions with optional filters
#[tauri::command]
pub async fn get_transactions(
    app_handle: AppHandle,
    filters: Option<TransactionFilters>,
) -> Result<Vec<queries::TransactionWithCategory>, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    let db_filters = filters.unwrap_or_default().into();
    queries::get_transactions(&conn, user_id, &db_filters).map_err(|e| e.to_string())
}

/// Update a transaction's category
#[tauri::command]
pub async fn update_transaction_category(
    app_handle: AppHandle,
    transaction_id: String,
    category_id: Option<String>,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    queries::update_transaction_category(&conn, &transaction_id, category_id.as_deref())
        .map_err(|e| e.to_string())
}

/// Delete a transaction
#[tauri::command]
pub async fn delete_transaction(
    app_handle: AppHandle,
    transaction_id: String,
) -> Result<(), String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;

    queries::delete_transaction(&conn, &transaction_id).map_err(|e| e.to_string())
}
