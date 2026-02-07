export interface GmailConnectionStatus {
  is_connected: boolean;
  email: string | null;
  is_polling: boolean;
  last_sync_at: string | null;
  sync_status: GmailSyncStatus;
}

export type GmailSyncStatus =
  | 'idle'
  | 'syncing'
  | { error: string }
  | 'rate_limited'
  | 'auth_required';

export interface SenderFilter {
  id: string;
  email: string;
  label: string;
  enabled: boolean;
}

export interface GmailSyncResult {
  new_transactions: number;
  duplicates_skipped: number;
  emails_processed: number;
  errors: string[];
}
