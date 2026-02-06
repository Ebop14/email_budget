use std::sync::Arc;
use std::time::Duration;
use tokio::sync::watch;
use tauri::{AppHandle, Emitter};

use super::sync::run_sync_cycle;
use super::types::GmailSyncStatus;

const POLL_INTERVAL_SECS: u64 = 30;

/// Managed state for the Gmail background poller
pub struct GmailPollerState {
    /// Send `true` to start polling, `false` to stop
    control_tx: watch::Sender<bool>,
    /// Current polling status
    is_running: Arc<std::sync::atomic::AtomicBool>,
}

impl GmailPollerState {
    pub fn new() -> Self {
        let (control_tx, _) = watch::channel(false);
        Self {
            control_tx,
            is_running: Arc::new(std::sync::atomic::AtomicBool::new(false)),
        }
    }

    pub fn start(&self) {
        let _ = self.control_tx.send(true);
    }

    pub fn stop(&self) {
        let _ = self.control_tx.send(false);
    }

    pub fn is_running(&self) -> bool {
        self.is_running.load(std::sync::atomic::Ordering::Relaxed)
    }

    pub fn subscribe(&self) -> watch::Receiver<bool> {
        self.control_tx.subscribe()
    }

    pub fn running_flag(&self) -> Arc<std::sync::atomic::AtomicBool> {
        self.is_running.clone()
    }
}

/// Spawn the background polling task. This runs for the lifetime of the app.
pub fn spawn_poller(app_handle: AppHandle, poller_state: &GmailPollerState) {
    let mut rx = poller_state.subscribe();
    let is_running = poller_state.running_flag();
    let app = app_handle.clone();

    tauri::async_runtime::spawn(async move {
        loop {
            // Wait until we're told to start
            loop {
                if *rx.borrow() {
                    break;
                }
                if rx.changed().await.is_err() {
                    return; // channel closed, app shutting down
                }
            }

            is_running.store(true, std::sync::atomic::Ordering::Relaxed);
            let _ = app.emit("gmail:status-changed", GmailSyncStatus::Idle);
            log::info!("Gmail poller started");

            // Polling loop
            loop {
                // Check if we should stop
                if !*rx.borrow() {
                    break;
                }

                // Run sync cycle
                let _ = app.emit("gmail:status-changed", GmailSyncStatus::Syncing);

                match run_sync_cycle(&app).await {
                    Ok(result) => {
                        if result.new_transactions > 0 {
                            log::info!(
                                "Sync cycle imported {} new transactions",
                                result.new_transactions
                            );
                        }
                        let _ = app.emit("gmail:status-changed", GmailSyncStatus::Idle);
                    }
                    Err(e) if e == "RATE_LIMITED" => {
                        log::warn!("Gmail API rate limited, will retry next cycle");
                        let _ = app.emit("gmail:status-changed", GmailSyncStatus::RateLimited);
                    }
                    Err(e) if e == "AUTH_EXPIRED" => {
                        log::error!("Gmail auth expired, stopping poller");
                        let _ = app.emit("gmail:status-changed", GmailSyncStatus::AuthRequired);
                        break;
                    }
                    Err(e) => {
                        log::error!("Sync cycle error: {}", e);
                        let _ = app.emit(
                            "gmail:status-changed",
                            GmailSyncStatus::Error(e),
                        );
                    }
                }

                // Sleep, but wake up if control signal changes
                tokio::select! {
                    _ = tokio::time::sleep(Duration::from_secs(POLL_INTERVAL_SECS)) => {}
                    _ = rx.changed() => {
                        if !*rx.borrow() {
                            break;
                        }
                    }
                }
            }

            is_running.store(false, std::sync::atomic::Ordering::Relaxed);
            let _ = app.emit("gmail:status-changed", GmailSyncStatus::Idle);
            log::info!("Gmail poller stopped");
        }
    });
}
