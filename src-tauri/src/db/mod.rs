pub mod schema;
pub mod queries;

use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use rusqlite::Connection;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Database not found")]
    NotFound,
    #[error("Migration failed: {0}")]
    #[allow(dead_code)]
    Migration(String),
}

pub type DbResult<T> = Result<T, DbError>;

/// Get the database path for the app
pub fn get_db_path(app_handle: &AppHandle) -> DbResult<PathBuf> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| DbError::NotFound)?;

    std::fs::create_dir_all(&app_dir)?;
    Ok(app_dir.join("email_budget.db"))
}

/// Initialize the database with schema
pub async fn initialize(app_handle: &AppHandle) -> DbResult<()> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;

    // Run migrations
    schema::run_migrations(&conn)?;

    // Seed default categories if needed
    schema::seed_default_categories(&conn)?;

    log::info!("Database initialized at {:?}", db_path);
    Ok(())
}

/// Get a database connection
pub fn get_connection(app_handle: &AppHandle) -> DbResult<Connection> {
    let db_path = get_db_path(app_handle)?;
    let conn = Connection::open(&db_path)?;
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    Ok(conn)
}
