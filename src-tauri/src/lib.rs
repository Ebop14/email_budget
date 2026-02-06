mod commands;
mod db;
mod parser;
mod categorizer;
mod gmail;

use tauri::Manager;
use gmail::poller::{GmailPollerState, spawn_poller};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Initialize database on startup
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = db::initialize(&app_handle).await {
                    log::error!("Failed to initialize database: {}", e);
                }
            });

            // Set up Gmail poller
            let poller_state = GmailPollerState::new();
            spawn_poller(app.handle().clone(), &poller_state);

            // Auto-start polling if tokens exist
            let app_handle = app.handle().clone();
            let auto_start = {
                if let Ok(conn) = db::get_connection(&app_handle) {
                    gmail::tokens::has_tokens(&conn).unwrap_or(false)
                } else {
                    false
                }
            };

            app.manage(poller_state);

            if auto_start {
                let poller = app.state::<GmailPollerState>();
                poller.start();
                log::info!("Gmail poller auto-started (tokens found)");
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::import::import_receipts,
            commands::import::confirm_import,
            commands::transactions::get_transactions,
            commands::transactions::update_transaction_category,
            commands::transactions::delete_transaction,
            commands::categories::get_categories,
            commands::categories::create_category,
            commands::categories::update_category,
            commands::categories::delete_category,
            commands::categories::get_category_spending,
            commands::budgets::get_budgets,
            commands::budgets::set_budget,
            commands::budgets::delete_budget,
            commands::dashboard::get_dashboard_stats,
            commands::settings::initialize_database,
            commands::settings::set_merchant_category_rule,
            commands::gmail::gmail_save_credentials,
            commands::gmail::gmail_has_credentials,
            commands::gmail::gmail_delete_credentials,
            commands::gmail::gmail_connect,
            commands::gmail::gmail_disconnect,
            commands::gmail::gmail_get_status,
            commands::gmail::gmail_start_polling,
            commands::gmail::gmail_stop_polling,
            commands::gmail::gmail_sync_now,
            commands::gmail::gmail_get_sender_filters,
            commands::gmail::gmail_add_sender_filter,
            commands::gmail::gmail_remove_sender_filter,
            commands::gmail::gmail_toggle_sender_filter,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
