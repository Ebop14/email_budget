use rusqlite::{params, Connection, OptionalExtension};

use crate::db::DbResult;
use super::types::SenderFilter;

// ============================================================================
// Credentials CRUD
// ============================================================================

pub fn save_credentials(conn: &Connection, client_id: &str, client_secret: &str) -> DbResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO gmail_credentials (id, client_id, client_secret) VALUES (1, ?1, ?2)",
        params![client_id, client_secret],
    )?;
    Ok(())
}

pub fn get_credentials(conn: &Connection) -> DbResult<Option<(String, String)>> {
    let result = conn
        .query_row(
            "SELECT client_id, client_secret FROM gmail_credentials WHERE id = 1",
            [],
            |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)),
        )
        .optional()?;
    Ok(result)
}

pub fn delete_credentials(conn: &Connection) -> DbResult<()> {
    conn.execute("DELETE FROM gmail_credentials", [])?;
    Ok(())
}

pub fn has_credentials(conn: &Connection) -> DbResult<bool> {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM gmail_credentials", [], |row| row.get(0))
        .unwrap_or(0);
    Ok(count > 0)
}

// ============================================================================
// Token CRUD
// ============================================================================

pub fn save_tokens(
    conn: &Connection,
    access_token: &str,
    refresh_token: &str,
    expires_at: &str,
    email: &str,
) -> DbResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO gmail_tokens (id, access_token, refresh_token, expires_at, email, updated_at)
         VALUES (1, ?1, ?2, ?3, ?4, datetime('now'))",
        params![access_token, refresh_token, expires_at, email],
    )?;
    Ok(())
}

pub fn get_tokens(conn: &Connection) -> DbResult<Option<(String, String, String, String)>> {
    let result = conn
        .query_row(
            "SELECT access_token, refresh_token, expires_at, email FROM gmail_tokens WHERE id = 1",
            [],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, String>(2)?,
                    row.get::<_, String>(3)?,
                ))
            },
        )
        .optional()?;
    Ok(result)
}

pub fn update_access_token(conn: &Connection, access_token: &str, expires_at: &str) -> DbResult<()> {
    conn.execute(
        "UPDATE gmail_tokens SET access_token = ?1, expires_at = ?2, updated_at = datetime('now') WHERE id = 1",
        params![access_token, expires_at],
    )?;
    Ok(())
}

pub fn delete_tokens(conn: &Connection) -> DbResult<()> {
    conn.execute("DELETE FROM gmail_tokens", [])?;
    Ok(())
}

pub fn has_tokens(conn: &Connection) -> DbResult<bool> {
    let count: i32 = conn
        .query_row("SELECT COUNT(*) FROM gmail_tokens", [], |row| row.get(0))
        .unwrap_or(0);
    Ok(count > 0)
}

// ============================================================================
// Sync state CRUD
// ============================================================================

pub fn get_sync_state(conn: &Connection) -> DbResult<Option<(Option<String>, Option<String>, bool)>> {
    let result = conn
        .query_row(
            "SELECT history_id, last_sync_at, is_initial_sync_complete FROM gmail_sync_state WHERE id = 1",
            [],
            |row| {
                Ok((
                    row.get::<_, Option<String>>(0)?,
                    row.get::<_, Option<String>>(1)?,
                    row.get::<_, i32>(2)? != 0,
                ))
            },
        )
        .optional()?;
    Ok(result)
}

pub fn upsert_sync_state(
    conn: &Connection,
    history_id: Option<&str>,
    is_initial_sync_complete: bool,
) -> DbResult<()> {
    conn.execute(
        "INSERT OR REPLACE INTO gmail_sync_state (id, history_id, last_sync_at, is_initial_sync_complete)
         VALUES (1, ?1, datetime('now'), ?2)",
        params![history_id, is_initial_sync_complete as i32],
    )?;
    Ok(())
}

pub fn reset_sync_state(conn: &Connection) -> DbResult<()> {
    conn.execute("DELETE FROM gmail_sync_state", [])?;
    Ok(())
}

// ============================================================================
// Sender filters CRUD
// ============================================================================

pub fn get_sender_filters(conn: &Connection) -> DbResult<Vec<SenderFilter>> {
    let mut stmt = conn.prepare(
        "SELECT id, email, label, enabled FROM gmail_sender_filters ORDER BY label ASC",
    )?;

    let filters = stmt
        .query_map([], |row| {
            Ok(SenderFilter {
                id: row.get(0)?,
                email: row.get(1)?,
                label: row.get(2)?,
                enabled: row.get::<_, i32>(3)? != 0,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(filters)
}

pub fn add_sender_filter(conn: &Connection, email: &str, label: &str) -> DbResult<SenderFilter> {
    let id = uuid::Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO gmail_sender_filters (id, email, label, enabled) VALUES (?1, ?2, ?3, 1)",
        params![&id, email, label],
    )?;
    Ok(SenderFilter {
        id,
        email: email.to_string(),
        label: label.to_string(),
        enabled: true,
    })
}

pub fn remove_sender_filter(conn: &Connection, filter_id: &str) -> DbResult<()> {
    conn.execute(
        "DELETE FROM gmail_sender_filters WHERE id = ?1",
        [filter_id],
    )?;
    Ok(())
}

pub fn toggle_sender_filter(conn: &Connection, filter_id: &str) -> DbResult<()> {
    conn.execute(
        "UPDATE gmail_sender_filters SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?1",
        [filter_id],
    )?;
    Ok(())
}

pub fn get_enabled_sender_emails(conn: &Connection) -> DbResult<Vec<String>> {
    let mut stmt = conn.prepare(
        "SELECT email FROM gmail_sender_filters WHERE enabled = 1",
    )?;

    let emails = stmt
        .query_map([], |row| row.get::<_, String>(0))?
        .collect::<Result<Vec<_>, _>>()?;

    Ok(emails)
}

// ============================================================================
// Processed messages CRUD
// ============================================================================

pub fn is_message_processed(conn: &Connection, message_id: &str) -> DbResult<bool> {
    let count: i32 = conn
        .query_row(
            "SELECT COUNT(*) FROM gmail_processed_messages WHERE gmail_message_id = ?1",
            [message_id],
            |row| row.get(0),
        )
        .unwrap_or(0);
    Ok(count > 0)
}

pub fn mark_message_processed(conn: &Connection, message_id: &str) -> DbResult<()> {
    conn.execute(
        "INSERT OR IGNORE INTO gmail_processed_messages (gmail_message_id) VALUES (?1)",
        [message_id],
    )?;
    Ok(())
}

pub fn clear_processed_messages(conn: &Connection) -> DbResult<()> {
    conn.execute("DELETE FROM gmail_processed_messages", [])?;
    Ok(())
}
