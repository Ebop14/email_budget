mod commands;
mod db;
mod parser;
mod categorizer;

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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
