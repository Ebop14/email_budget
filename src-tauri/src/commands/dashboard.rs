use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::db::{self, queries};

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_spent: i64,
    pub transaction_count: i64,
    pub category_count: i64,
    pub budget_health: String,
    pub category_spending: Vec<queries::CategorySpending>,
    pub recent_transactions: Vec<queries::TransactionWithCategory>,
    pub top_merchants: Vec<queries::MerchantTotal>,
}

/// Get dashboard statistics for a given month
#[tauri::command]
pub async fn get_dashboard_stats(
    app_handle: AppHandle,
    month: u32,
    year: i32,
) -> Result<DashboardStats, String> {
    let conn = db::get_connection(&app_handle).map_err(|e| e.to_string())?;
    let user_id = "local";

    // Calculate date range for the month
    let start_date = NaiveDate::from_ymd_opt(year, month, 1)
        .ok_or("Invalid month/year")?
        .format("%Y-%m-%d")
        .to_string();

    let end_date = if month == 12 {
        NaiveDate::from_ymd_opt(year + 1, 1, 1).unwrap()
    } else {
        NaiveDate::from_ymd_opt(year, month + 1, 1).unwrap()
    };
    let end_date = (end_date - chrono::Duration::days(1))
        .format("%Y-%m-%d")
        .to_string();

    // Get total spent
    let total_spent =
        queries::get_total_spent(&conn, user_id, &start_date, &end_date).map_err(|e| e.to_string())?;

    // Get transaction count
    let transaction_count =
        queries::get_transaction_count(&conn, user_id, &start_date, &end_date).map_err(|e| e.to_string())?;

    // Get category count (categories with spending)
    let category_spending =
        queries::get_category_spending(&conn, user_id, &start_date, &end_date).map_err(|e| e.to_string())?;
    let category_count = category_spending.len() as i64;

    // Get budgets to calculate health
    let budgets = queries::get_all_budgets(&conn, user_id).map_err(|e| e.to_string())?;
    let budget_health = calculate_budget_health(&budgets);

    // Get recent transactions (last 5)
    let recent_filters = queries::TransactionFilters {
        start_date: Some(start_date.clone()),
        end_date: Some(end_date.clone()),
        ..Default::default()
    };
    let all_transactions =
        queries::get_transactions(&conn, user_id, &recent_filters).map_err(|e| e.to_string())?;
    let recent_transactions: Vec<_> = all_transactions.into_iter().take(5).collect();

    // Get top merchants
    let top_merchants =
        queries::get_top_merchants(&conn, user_id, &start_date, &end_date, 5).map_err(|e| e.to_string())?;

    Ok(DashboardStats {
        total_spent,
        transaction_count,
        category_count,
        budget_health,
        category_spending,
        recent_transactions,
        top_merchants,
    })
}

fn calculate_budget_health(budgets: &[queries::BudgetWithProgress]) -> String {
    if budgets.is_empty() {
        return "good".to_string();
    }

    let over_budget_count = budgets.iter().filter(|b| b.is_over_budget).count();
    let warning_count = budgets
        .iter()
        .filter(|b| !b.is_over_budget && b.percentage > 0.8)
        .count();

    if over_budget_count > 0 {
        "over".to_string()
    } else if warning_count > 0 {
        "warning".to_string()
    } else {
        "good".to_string()
    }
}
