use rusqlite::Connection;

use super::defaults::{get_merchant_category, get_provider_category};
use crate::db::queries::{
    get_category_from_previous_transaction, get_merchant_category_rule,
};
use crate::db::DbResult;

/// Categorize a transaction based on priority rules:
/// 1. User-defined merchant rules (merchant_category_rules table)
/// 2. Exact merchant match from previous transactions
/// 3. Pattern match from default merchant mappings
/// 4. Provider-based default
/// 5. Falls back to None (Uncategorized)
pub fn categorize_transaction(
    conn: &Connection,
    user_id: &str,
    merchant_normalized: &str,
    provider: &str,
) -> DbResult<Option<String>> {
    // 1. Check user-defined merchant rules
    if let Some(category_id) = get_merchant_category_rule(conn, user_id, merchant_normalized)? {
        log::debug!("Category from user rule: {}", category_id);
        return Ok(Some(category_id));
    }

    // 2. Check if we've categorized this merchant before
    if let Some(category_id) = get_category_from_previous_transaction(conn, user_id, merchant_normalized)? {
        log::debug!("Category from previous transaction: {}", category_id);
        return Ok(Some(category_id));
    }

    // 3. Check pattern match from default merchant mappings
    if let Some(category_name) = get_merchant_category(merchant_normalized) {
        if let Some(category_id) = find_category_by_name(conn, user_id, category_name)? {
            log::debug!("Category from merchant pattern: {} -> {}", category_name, category_id);
            return Ok(Some(category_id));
        }
    }

    // 4. Check provider-based default
    if let Some(category_name) = get_provider_category(provider) {
        if let Some(category_id) = find_category_by_name(conn, user_id, category_name)? {
            log::debug!("Category from provider: {} -> {}", category_name, category_id);
            return Ok(Some(category_id));
        }
    }

    // 5. Return uncategorized
    log::debug!("No category found for: {}", merchant_normalized);
    find_category_by_name(conn, user_id, "Uncategorized")
}

/// Find a category ID by its name
fn find_category_by_name(
    conn: &Connection,
    user_id: &str,
    name: &str,
) -> DbResult<Option<String>> {
    let result: Option<String> = conn
        .query_row(
            "SELECT id FROM categories WHERE user_id = ?1 AND name = ?2",
            [user_id, name],
            |row| row.get(0),
        )
        .ok();

    Ok(result)
}

#[allow(dead_code)]
/// Learn from a user's category assignment
/// When a user manually assigns a category, we can optionally create a rule
pub fn learn_from_assignment(
    conn: &Connection,
    user_id: &str,
    merchant_normalized: &str,
    category_id: &str,
    create_rule: bool,
) -> DbResult<()> {
    if create_rule {
        // Create an exact match rule
        crate::db::queries::set_merchant_category_rule(
            conn,
            user_id,
            merchant_normalized,
            category_id,
            true, // exact match
        )?;
    }
    Ok(())
}
