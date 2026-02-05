use chrono::NaiveDate;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

use super::DbResult;

// ============================================================================
// Models
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Category {
    pub id: String,
    pub user_id: String,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub is_system: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub id: String,
    pub user_id: String,
    pub category_id: Option<String>,
    pub merchant: String,
    pub merchant_normalized: String,
    pub amount: i64,
    pub transaction_date: String,
    pub provider: String,
    pub source_hash: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionWithCategory {
    pub id: String,
    pub user_id: String,
    pub category_id: Option<String>,
    pub merchant: String,
    pub merchant_normalized: String,
    pub amount: i64,
    pub transaction_date: String,
    pub provider: String,
    pub source_hash: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub category_name: Option<String>,
    pub category_color: Option<String>,
    pub category_icon: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TransactionItem {
    pub id: String,
    pub transaction_id: String,
    pub name: String,
    pub quantity: i32,
    pub unit_price: i64,
    pub total_price: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Budget {
    pub id: String,
    pub user_id: String,
    pub category_id: String,
    pub amount: i64,
    pub period: String,
    pub start_date: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BudgetWithProgress {
    pub id: String,
    pub user_id: String,
    pub category_id: String,
    pub amount: i64,
    pub period: String,
    pub start_date: String,
    pub created_at: String,
    pub updated_at: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub spent: i64,
    pub remaining: i64,
    pub percentage: f64,
    pub is_over_budget: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CategorySpending {
    pub category_id: String,
    pub category_name: String,
    pub category_color: String,
    pub category_icon: String,
    pub total: i64,
    pub transaction_count: i64,
    pub percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MerchantTotal {
    pub merchant: String,
    pub total: i64,
    pub count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TransactionFilters {
    pub search: Option<String>,
    pub category_id: Option<String>,
    pub provider: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub min_amount: Option<i64>,
    pub max_amount: Option<i64>,
}

// ============================================================================
// Category Queries
// ============================================================================

pub fn get_all_categories(conn: &Connection, user_id: &str) -> DbResult<Vec<Category>> {
    let mut stmt = conn.prepare(
        "SELECT id, user_id, name, icon, color, is_system, created_at, updated_at
         FROM categories WHERE user_id = ?1 ORDER BY is_system DESC, name ASC",
    )?;

    let categories = stmt
        .query_map([user_id], |row| {
            Ok(Category {
                id: row.get(0)?,
                user_id: row.get(1)?,
                name: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                is_system: row.get::<_, i32>(5)? != 0,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(categories)
}

pub fn get_category_by_id(conn: &Connection, id: &str) -> DbResult<Option<Category>> {
    let result = conn
        .query_row(
            "SELECT id, user_id, name, icon, color, is_system, created_at, updated_at
             FROM categories WHERE id = ?1",
            [id],
            |row| {
                Ok(Category {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    name: row.get(2)?,
                    icon: row.get(3)?,
                    color: row.get(4)?,
                    is_system: row.get::<_, i32>(5)? != 0,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            },
        )
        .optional()?;

    Ok(result)
}

pub fn create_category(
    conn: &Connection,
    user_id: &str,
    name: &str,
    icon: &str,
    color: &str,
) -> DbResult<Category> {
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO categories (id, user_id, name, icon, color, is_system) VALUES (?1, ?2, ?3, ?4, ?5, 0)",
        params![&id, user_id, name, icon, color],
    )?;

    get_category_by_id(conn, &id)?.ok_or_else(|| super::DbError::NotFound)
}

pub fn update_category(
    conn: &Connection,
    id: &str,
    name: &str,
    icon: &str,
    color: &str,
) -> DbResult<()> {
    conn.execute(
        "UPDATE categories SET name = ?2, icon = ?3, color = ?4, updated_at = datetime('now')
         WHERE id = ?1 AND is_system = 0",
        params![id, name, icon, color],
    )?;
    Ok(())
}

pub fn delete_category(conn: &Connection, id: &str) -> DbResult<()> {
    conn.execute(
        "DELETE FROM categories WHERE id = ?1 AND is_system = 0",
        [id],
    )?;
    Ok(())
}

// ============================================================================
// Transaction Queries
// ============================================================================

pub fn get_transactions(
    conn: &Connection,
    user_id: &str,
    filters: &TransactionFilters,
) -> DbResult<Vec<TransactionWithCategory>> {
    let mut sql = String::from(
        "SELECT t.id, t.user_id, t.category_id, t.merchant, t.merchant_normalized,
                t.amount, t.transaction_date, t.provider, t.source_hash, t.notes,
                t.created_at, t.updated_at,
                c.name as category_name, c.color as category_color, c.icon as category_icon
         FROM transactions t
         LEFT JOIN categories c ON t.category_id = c.id
         WHERE t.user_id = ?",
    );

    let mut params: Vec<Box<dyn rusqlite::ToSql>> = vec![Box::new(user_id.to_string())];

    if let Some(ref search) = filters.search {
        if !search.is_empty() {
            sql.push_str(" AND (t.merchant LIKE ? OR t.merchant_normalized LIKE ?)");
            let pattern = format!("%{}%", search);
            params.push(Box::new(pattern.clone()));
            params.push(Box::new(pattern));
        }
    }

    if let Some(ref category_id) = filters.category_id {
        sql.push_str(" AND t.category_id = ?");
        params.push(Box::new(category_id.clone()));
    }

    if let Some(ref provider) = filters.provider {
        sql.push_str(" AND t.provider = ?");
        params.push(Box::new(provider.clone()));
    }

    if let Some(ref start_date) = filters.start_date {
        sql.push_str(" AND t.transaction_date >= ?");
        params.push(Box::new(start_date.clone()));
    }

    if let Some(ref end_date) = filters.end_date {
        sql.push_str(" AND t.transaction_date <= ?");
        params.push(Box::new(end_date.clone()));
    }

    if let Some(min_amount) = filters.min_amount {
        sql.push_str(" AND t.amount >= ?");
        params.push(Box::new(min_amount));
    }

    if let Some(max_amount) = filters.max_amount {
        sql.push_str(" AND t.amount <= ?");
        params.push(Box::new(max_amount));
    }

    sql.push_str(" ORDER BY t.transaction_date DESC, t.created_at DESC");

    let mut stmt = conn.prepare(&sql)?;
    let param_refs: Vec<&dyn rusqlite::ToSql> = params.iter().map(|p| p.as_ref()).collect();

    let transactions = stmt
        .query_map(param_refs.as_slice(), |row| {
            Ok(TransactionWithCategory {
                id: row.get(0)?,
                user_id: row.get(1)?,
                category_id: row.get(2)?,
                merchant: row.get(3)?,
                merchant_normalized: row.get(4)?,
                amount: row.get(5)?,
                transaction_date: row.get(6)?,
                provider: row.get(7)?,
                source_hash: row.get(8)?,
                notes: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                category_name: row.get(12)?,
                category_color: row.get(13)?,
                category_icon: row.get(14)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(transactions)
}

pub fn transaction_exists(conn: &Connection, source_hash: &str) -> DbResult<bool> {
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM transactions WHERE source_hash = ?1",
        [source_hash],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn insert_transaction(
    conn: &Connection,
    user_id: &str,
    category_id: Option<&str>,
    merchant: &str,
    merchant_normalized: &str,
    amount: i64,
    transaction_date: &str,
    provider: &str,
    source_hash: &str,
) -> DbResult<String> {
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO transactions (id, user_id, category_id, merchant, merchant_normalized, amount, transaction_date, provider, source_hash)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![&id, user_id, category_id, merchant, merchant_normalized, amount, transaction_date, provider, source_hash],
    )?;

    Ok(id)
}

pub fn insert_transaction_item(
    conn: &Connection,
    transaction_id: &str,
    name: &str,
    quantity: i32,
    unit_price: i64,
    total_price: i64,
) -> DbResult<String> {
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO transaction_items (id, transaction_id, name, quantity, unit_price, total_price)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![&id, transaction_id, name, quantity, unit_price, total_price],
    )?;

    Ok(id)
}

pub fn update_transaction_category(
    conn: &Connection,
    transaction_id: &str,
    category_id: Option<&str>,
) -> DbResult<()> {
    conn.execute(
        "UPDATE transactions SET category_id = ?2, updated_at = datetime('now') WHERE id = ?1",
        params![transaction_id, category_id],
    )?;
    Ok(())
}

pub fn delete_transaction(conn: &Connection, transaction_id: &str) -> DbResult<()> {
    conn.execute("DELETE FROM transactions WHERE id = ?1", [transaction_id])?;
    Ok(())
}

// ============================================================================
// Budget Queries
// ============================================================================

pub fn get_all_budgets(conn: &Connection, user_id: &str) -> DbResult<Vec<BudgetWithProgress>> {
    let mut stmt = conn.prepare(
        "SELECT b.id, b.user_id, b.category_id, b.amount, b.period, b.start_date,
                b.created_at, b.updated_at,
                c.name, c.color, c.icon
         FROM budgets b
         JOIN categories c ON b.category_id = c.id
         WHERE b.user_id = ?1
         ORDER BY c.name",
    )?;

    let budgets = stmt
        .query_map([user_id], |row| {
            Ok((
                Budget {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    category_id: row.get(2)?,
                    amount: row.get(3)?,
                    period: row.get(4)?,
                    start_date: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                },
                row.get::<_, String>(8)?,
                row.get::<_, String>(9)?,
                row.get::<_, String>(10)?,
            ))
        })?
        .collect::<Result<Vec<_>, _>>()?;

    // Calculate spent amount for each budget
    let mut result = Vec::new();
    for (budget, name, color, icon) in budgets {
        let (start, end) = get_budget_period_dates(&budget.period, &budget.start_date);
        let spent = get_category_spent(conn, user_id, &budget.category_id, &start, &end)?;
        let remaining = budget.amount - spent;
        let percentage = if budget.amount > 0 {
            spent as f64 / budget.amount as f64
        } else {
            0.0
        };

        result.push(BudgetWithProgress {
            id: budget.id,
            user_id: budget.user_id,
            category_id: budget.category_id,
            amount: budget.amount,
            period: budget.period,
            start_date: budget.start_date,
            created_at: budget.created_at,
            updated_at: budget.updated_at,
            category_name: name,
            category_color: color,
            category_icon: icon,
            spent,
            remaining,
            percentage,
            is_over_budget: spent > budget.amount,
        });
    }

    Ok(result)
}

fn get_budget_period_dates(period: &str, start_date: &str) -> (String, String) {
    let today = chrono::Local::now().date_naive();

    match period {
        "weekly" => {
            let start = today - chrono::Duration::days(today.weekday().num_days_from_monday() as i64);
            let end = start + chrono::Duration::days(6);
            (start.format("%Y-%m-%d").to_string(), end.format("%Y-%m-%d").to_string())
        }
        "monthly" => {
            let start = NaiveDate::from_ymd_opt(today.year(), today.month(), 1).unwrap();
            let end = if today.month() == 12 {
                NaiveDate::from_ymd_opt(today.year() + 1, 1, 1).unwrap()
            } else {
                NaiveDate::from_ymd_opt(today.year(), today.month() + 1, 1).unwrap()
            } - chrono::Duration::days(1);
            (start.format("%Y-%m-%d").to_string(), end.format("%Y-%m-%d").to_string())
        }
        "yearly" => {
            let start = NaiveDate::from_ymd_opt(today.year(), 1, 1).unwrap();
            let end = NaiveDate::from_ymd_opt(today.year(), 12, 31).unwrap();
            (start.format("%Y-%m-%d").to_string(), end.format("%Y-%m-%d").to_string())
        }
        _ => (start_date.to_string(), today.format("%Y-%m-%d").to_string()),
    }
}

fn get_category_spent(
    conn: &Connection,
    user_id: &str,
    category_id: &str,
    start_date: &str,
    end_date: &str,
) -> DbResult<i64> {
    let spent: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions
             WHERE user_id = ?1 AND category_id = ?2
             AND transaction_date >= ?3 AND transaction_date <= ?4",
            params![user_id, category_id, start_date, end_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(spent)
}

pub fn set_budget(
    conn: &Connection,
    user_id: &str,
    category_id: &str,
    amount: i64,
    period: &str,
) -> DbResult<Budget> {
    let id = uuid::Uuid::new_v4().to_string();
    let today = chrono::Local::now().date_naive().format("%Y-%m-%d").to_string();

    conn.execute(
        "INSERT OR REPLACE INTO budgets (id, user_id, category_id, amount, period, start_date)
         VALUES (
             COALESCE((SELECT id FROM budgets WHERE user_id = ?2 AND category_id = ?3 AND period = ?5), ?1),
             ?2, ?3, ?4, ?5, ?6
         )",
        params![&id, user_id, category_id, amount, period, &today],
    )?;

    let budget = conn.query_row(
        "SELECT id, user_id, category_id, amount, period, start_date, created_at, updated_at
         FROM budgets WHERE user_id = ?1 AND category_id = ?2 AND period = ?3",
        params![user_id, category_id, period],
        |row| {
            Ok(Budget {
                id: row.get(0)?,
                user_id: row.get(1)?,
                category_id: row.get(2)?,
                amount: row.get(3)?,
                period: row.get(4)?,
                start_date: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            })
        },
    )?;

    Ok(budget)
}

pub fn delete_budget(conn: &Connection, budget_id: &str) -> DbResult<()> {
    conn.execute("DELETE FROM budgets WHERE id = ?1", [budget_id])?;
    Ok(())
}

// ============================================================================
// Dashboard/Reporting Queries
// ============================================================================

pub fn get_category_spending(
    conn: &Connection,
    user_id: &str,
    start_date: &str,
    end_date: &str,
) -> DbResult<Vec<CategorySpending>> {
    let total_spent: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions
             WHERE user_id = ?1 AND transaction_date >= ?2 AND transaction_date <= ?3",
            params![user_id, start_date, end_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let mut stmt = conn.prepare(
        "SELECT c.id, c.name, c.color, c.icon,
                COALESCE(SUM(t.amount), 0) as total,
                COUNT(t.id) as count
         FROM categories c
         LEFT JOIN transactions t ON c.id = t.category_id
             AND t.user_id = ?1
             AND t.transaction_date >= ?2
             AND t.transaction_date <= ?3
         WHERE c.user_id = ?1
         GROUP BY c.id
         HAVING total > 0
         ORDER BY total DESC",
    )?;

    let spending = stmt
        .query_map(params![user_id, start_date, end_date], |row| {
            let total: i64 = row.get(4)?;
            Ok(CategorySpending {
                category_id: row.get(0)?,
                category_name: row.get(1)?,
                category_color: row.get(2)?,
                category_icon: row.get(3)?,
                total,
                transaction_count: row.get(5)?,
                percentage: if total_spent > 0 {
                    total as f64 / total_spent as f64
                } else {
                    0.0
                },
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(spending)
}

pub fn get_top_merchants(
    conn: &Connection,
    user_id: &str,
    start_date: &str,
    end_date: &str,
    limit: i32,
) -> DbResult<Vec<MerchantTotal>> {
    let mut stmt = conn.prepare(
        "SELECT merchant, SUM(amount) as total, COUNT(*) as count
         FROM transactions
         WHERE user_id = ?1 AND transaction_date >= ?2 AND transaction_date <= ?3
         GROUP BY merchant_normalized
         ORDER BY total DESC
         LIMIT ?4",
    )?;

    let merchants = stmt
        .query_map(params![user_id, start_date, end_date, limit], |row| {
            Ok(MerchantTotal {
                merchant: row.get(0)?,
                total: row.get(1)?,
                count: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(merchants)
}

pub fn get_total_spent(
    conn: &Connection,
    user_id: &str,
    start_date: &str,
    end_date: &str,
) -> DbResult<i64> {
    let total: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(amount), 0) FROM transactions
             WHERE user_id = ?1 AND transaction_date >= ?2 AND transaction_date <= ?3",
            params![user_id, start_date, end_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(total)
}

pub fn get_transaction_count(
    conn: &Connection,
    user_id: &str,
    start_date: &str,
    end_date: &str,
) -> DbResult<i64> {
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM transactions
             WHERE user_id = ?1 AND transaction_date >= ?2 AND transaction_date <= ?3",
            params![user_id, start_date, end_date],
            |row| row.get(0),
        )
        .unwrap_or(0);

    Ok(count)
}

// ============================================================================
// Merchant Category Rules
// ============================================================================

pub fn get_merchant_category_rule(
    conn: &Connection,
    user_id: &str,
    merchant_normalized: &str,
) -> DbResult<Option<String>> {
    // First try exact match
    let exact: Option<String> = conn
        .query_row(
            "SELECT category_id FROM merchant_category_rules
             WHERE user_id = ?1 AND merchant_pattern = ?2 AND is_exact_match = 1",
            params![user_id, merchant_normalized],
            |row| row.get(0),
        )
        .optional()?;

    if exact.is_some() {
        return Ok(exact);
    }

    // Then try pattern match
    let pattern: Option<String> = conn
        .query_row(
            "SELECT category_id FROM merchant_category_rules
             WHERE user_id = ?1 AND is_exact_match = 0 AND ?2 LIKE '%' || merchant_pattern || '%'
             ORDER BY LENGTH(merchant_pattern) DESC
             LIMIT 1",
            params![user_id, merchant_normalized],
            |row| row.get(0),
        )
        .optional()?;

    Ok(pattern)
}

pub fn set_merchant_category_rule(
    conn: &Connection,
    user_id: &str,
    merchant_pattern: &str,
    category_id: &str,
    is_exact_match: bool,
) -> DbResult<()> {
    let id = uuid::Uuid::new_v4().to_string();

    conn.execute(
        "INSERT OR REPLACE INTO merchant_category_rules (id, user_id, merchant_pattern, category_id, is_exact_match)
         VALUES (
             COALESCE((SELECT id FROM merchant_category_rules WHERE user_id = ?2 AND merchant_pattern = ?3), ?1),
             ?2, ?3, ?4, ?5
         )",
        params![&id, user_id, merchant_pattern, category_id, is_exact_match],
    )?;

    Ok(())
}

/// Get the category for a merchant based on previous transactions
pub fn get_category_from_previous_transaction(
    conn: &Connection,
    user_id: &str,
    merchant_normalized: &str,
) -> DbResult<Option<String>> {
    let category_id: Option<String> = conn
        .query_row(
            "SELECT category_id FROM transactions
             WHERE user_id = ?1 AND merchant_normalized = ?2 AND category_id IS NOT NULL
             ORDER BY created_at DESC
             LIMIT 1",
            params![user_id, merchant_normalized],
            |row| row.get(0),
        )
        .optional()?;

    Ok(category_id)
}

use chrono::Datelike;
