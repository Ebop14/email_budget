use rusqlite::Connection;
use super::DbResult;

#[allow(dead_code)]
const SCHEMA_VERSION: i32 = 2;

/// Run database migrations
pub fn run_migrations(conn: &Connection) -> DbResult<()> {
    // Create migrations table if it doesn't exist
    conn.execute(
        "CREATE TABLE IF NOT EXISTS migrations (
            version INTEGER PRIMARY KEY,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )",
        [],
    )?;

    let current_version: i32 = conn
        .query_row(
            "SELECT COALESCE(MAX(version), 0) FROM migrations",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    if current_version < 1 {
        log::info!("Running migration v1");
        migrate_v1(conn)?;
    }

    if current_version < 2 {
        log::info!("Running migration v2 (Gmail integration)");
        migrate_v2(conn)?;
    }

    Ok(())
}

fn migrate_v1(conn: &Connection) -> DbResult<()> {
    conn.execute_batch(
        r#"
        -- Users table (for future multi-user/sync support)
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Insert default local user
        INSERT OR IGNORE INTO users (id, email) VALUES ('local', NULL);

        -- Categories table
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            name TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Transactions table
        CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            category_id TEXT,
            merchant TEXT NOT NULL,
            merchant_normalized TEXT NOT NULL,
            amount INTEGER NOT NULL,
            transaction_date TEXT NOT NULL,
            provider TEXT NOT NULL,
            source_hash TEXT NOT NULL UNIQUE,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
        );

        -- Transaction items table
        CREATE TABLE IF NOT EXISTS transaction_items (
            id TEXT PRIMARY KEY,
            transaction_id TEXT NOT NULL,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            unit_price INTEGER NOT NULL,
            total_price INTEGER NOT NULL,
            FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
        );

        -- Budgets table
        CREATE TABLE IF NOT EXISTS budgets (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            category_id TEXT NOT NULL,
            amount INTEGER NOT NULL,
            period TEXT NOT NULL CHECK (period IN ('weekly', 'monthly', 'yearly')),
            start_date TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            UNIQUE (user_id, category_id, period)
        );

        -- Recurring patterns table (for subscription detection)
        CREATE TABLE IF NOT EXISTS recurring_patterns (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            merchant_normalized TEXT NOT NULL,
            typical_amount INTEGER NOT NULL,
            frequency_days INTEGER NOT NULL,
            last_transaction_date TEXT,
            confidence REAL NOT NULL DEFAULT 0.0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );

        -- Merchant category rules table
        CREATE TABLE IF NOT EXISTS merchant_category_rules (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            merchant_pattern TEXT NOT NULL,
            category_id TEXT NOT NULL,
            is_exact_match INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
            UNIQUE (user_id, merchant_pattern)
        );

        -- Settings table
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user_id, key)
        );

        -- Selected providers table
        CREATE TABLE IF NOT EXISTS selected_providers (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL DEFAULT 'local',
            provider_id TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE (user_id, provider_id)
        );

        -- Create indexes for common queries
        CREATE INDEX IF NOT EXISTS idx_transactions_user_date
            ON transactions(user_id, transaction_date DESC);
        CREATE INDEX IF NOT EXISTS idx_transactions_category
            ON transactions(category_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_source_hash
            ON transactions(source_hash);
        CREATE INDEX IF NOT EXISTS idx_transactions_merchant_normalized
            ON transactions(merchant_normalized);
        CREATE INDEX IF NOT EXISTS idx_budgets_user_category
            ON budgets(user_id, category_id);
        CREATE INDEX IF NOT EXISTS idx_merchant_rules_user
            ON merchant_category_rules(user_id);

        -- Record migration
        INSERT INTO migrations (version) VALUES (1);
        "#,
    )?;

    Ok(())
}

fn migrate_v2(conn: &Connection) -> DbResult<()> {
    conn.execute_batch(
        r#"
        -- Gmail OAuth credentials (singleton row)
        CREATE TABLE IF NOT EXISTS gmail_credentials (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            client_id TEXT NOT NULL,
            client_secret TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Gmail OAuth tokens (singleton row)
        CREATE TABLE IF NOT EXISTS gmail_tokens (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Gmail sync state (singleton row)
        CREATE TABLE IF NOT EXISTS gmail_sync_state (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            history_id TEXT,
            last_sync_at TEXT,
            is_initial_sync_complete INTEGER NOT NULL DEFAULT 0
        );

        -- Gmail sender filters
        CREATE TABLE IF NOT EXISTS gmail_sender_filters (
            id TEXT PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            label TEXT NOT NULL,
            enabled INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Gmail processed message IDs (prevents re-processing)
        CREATE TABLE IF NOT EXISTS gmail_processed_messages (
            gmail_message_id TEXT PRIMARY KEY,
            processed_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- Index for processed messages cleanup
        CREATE INDEX IF NOT EXISTS idx_gmail_processed_at
            ON gmail_processed_messages(processed_at);

        -- Seed default sender filters
        INSERT OR IGNORE INTO gmail_sender_filters (id, email, label, enabled) VALUES
            ('filter_amazon', 'auto-confirm@amazon.com', 'Amazon', 1),
            ('filter_doordash', 'no-reply@doordash.com', 'DoorDash', 1),
            ('filter_ubereats', 'uber.us@uber.com', 'Uber Eats', 1),
            ('filter_uber', 'noreply@uber.com', 'Uber', 1),
            ('filter_venmo', 'venmo@venmo.com', 'Venmo', 1);

        -- Record migration
        INSERT INTO migrations (version) VALUES (2);
        "#,
    )?;

    Ok(())
}

/// Seed default categories
pub fn seed_default_categories(conn: &Connection) -> DbResult<()> {
    let count: i32 = conn.query_row(
        "SELECT COUNT(*) FROM categories WHERE user_id = 'local'",
        [],
        |row| row.get(0),
    )?;

    if count > 0 {
        return Ok(());
    }

    let categories = [
        ("Food & Dining", "utensils", "#ef4444"),
        ("Food Delivery", "bike", "#f97316"),
        ("Transportation", "car", "#eab308"),
        ("Rideshare", "map-pin", "#84cc16"),
        ("Shopping", "shopping-bag", "#22c55e"),
        ("Entertainment", "film", "#14b8a6"),
        ("Subscriptions", "repeat", "#06b6d4"),
        ("Utilities", "zap", "#0ea5e9"),
        ("Healthcare", "heart-pulse", "#3b82f6"),
        ("Personal Care", "sparkles", "#6366f1"),
        ("Travel", "plane", "#8b5cf6"),
        ("Gifts & Donations", "gift", "#a855f7"),
        ("Education", "graduation-cap", "#d946ef"),
        ("Peer Payment", "users", "#ec4899"),
        ("Uncategorized", "help-circle", "#6b7280"),
    ];

    for (name, icon, color) in categories {
        let id = uuid::Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO categories (id, user_id, name, icon, color, is_system) VALUES (?1, 'local', ?2, ?3, ?4, 1)",
            [&id, name, icon, color],
        )?;
    }

    log::info!("Seeded {} default categories", categories.len());
    Ok(())
}
