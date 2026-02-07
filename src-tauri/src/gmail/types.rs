use serde::{Deserialize, Serialize};

// ============================================================================
// Gmail API response types
// ============================================================================

#[derive(Debug, Deserialize)]
pub struct GmailMessageList {
    pub messages: Option<Vec<GmailMessageRef>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
    #[allow(dead_code)]
    #[serde(rename = "resultSizeEstimate")]
    pub result_size_estimate: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct GmailMessageRef {
    pub id: String,
    #[allow(dead_code)]
    #[serde(rename = "threadId")]
    pub thread_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GmailMessage {
    #[allow(dead_code)]
    pub id: String,
    pub payload: Option<GmailPayload>,
    #[allow(dead_code)]
    #[serde(rename = "internalDate")]
    pub internal_date: Option<String>,
    #[allow(dead_code)]
    #[serde(rename = "historyId")]
    pub history_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GmailPayload {
    pub headers: Option<Vec<GmailHeader>>,
    pub body: Option<GmailBody>,
    pub parts: Option<Vec<GmailPart>>,
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Deserialize)]
pub struct GmailBody {
    pub data: Option<String>,
    #[allow(dead_code)]
    pub size: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct GmailPart {
    #[serde(rename = "mimeType")]
    pub mime_type: Option<String>,
    pub body: Option<GmailBody>,
    pub parts: Option<Vec<GmailPart>>,
}

#[derive(Debug, Deserialize)]
pub struct GmailHistoryList {
    pub history: Option<Vec<GmailHistoryRecord>>,
    #[serde(rename = "historyId")]
    pub history_id: Option<String>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct GmailHistoryRecord {
    #[allow(dead_code)]
    pub id: String,
    #[serde(rename = "messagesAdded")]
    pub messages_added: Option<Vec<GmailHistoryMessage>>,
}

#[derive(Debug, Deserialize)]
pub struct GmailHistoryMessage {
    pub message: GmailMessageRef,
}

#[derive(Debug, Deserialize)]
pub struct GmailProfile {
    #[serde(rename = "emailAddress")]
    pub email_address: String,
    #[serde(rename = "historyId")]
    pub history_id: Option<String>,
}

// ============================================================================
// App-level types
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailConnectionStatus {
    pub is_connected: bool,
    pub email: Option<String>,
    pub is_polling: bool,
    pub last_sync_at: Option<String>,
    pub sync_status: GmailSyncStatus,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum GmailSyncStatus {
    Idle,
    Syncing,
    Error(String),
    RateLimited,
    AuthRequired,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SenderFilter {
    pub id: String,
    pub email: String,
    pub label: String,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncCycleResult {
    pub new_transactions: i32,
    pub duplicates_skipped: i32,
    pub emails_processed: i32,
    pub errors: Vec<String>,
}

impl SyncCycleResult {
    pub fn empty() -> Self {
        Self {
            new_transactions: 0,
            duplicates_skipped: 0,
            emails_processed: 0,
            errors: Vec::new(),
        }
    }
}
