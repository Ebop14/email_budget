use base64::engine::general_purpose::URL_SAFE_NO_PAD;
use base64::Engine;
use reqwest::Client;

use super::types::*;

const GMAIL_API_BASE: &str = "https://gmail.googleapis.com/gmail/v1/users/me";

pub struct GmailClient {
    http: Client,
    access_token: String,
}

impl GmailClient {
    pub fn new(access_token: &str) -> Self {
        Self {
            http: Client::new(),
            access_token: access_token.to_string(),
        }
    }

    /// Get the user's Gmail profile (email address + current history ID)
    pub async fn get_profile(&self) -> Result<GmailProfile, String> {
        let url = format!("{}/profile", GMAIL_API_BASE);

        let response = self
            .http
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("Profile request failed: {}", e))?;

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Profile request failed ({}): {}", status, body));
        }

        response
            .json()
            .await
            .map_err(|e| format!("Failed to parse profile: {}", e))
    }

    /// List messages matching a query (e.g., "from:auto-confirm@amazon.com after:2024/01/01")
    pub async fn list_messages(
        &self,
        query: &str,
        page_token: Option<&str>,
        max_results: u32,
    ) -> Result<GmailMessageList, String> {
        let mut url = format!(
            "{}/messages?q={}&maxResults={}",
            GMAIL_API_BASE,
            urlencoding::encode(query),
            max_results,
        );

        if let Some(token) = page_token {
            url.push_str(&format!("&pageToken={}", token));
        }

        let response = self
            .http
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("List messages failed: {}", e))?;

        if response.status() == 429 {
            return Err("RATE_LIMITED".to_string());
        }

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("List messages failed ({}): {}", status, body));
        }

        response
            .json()
            .await
            .map_err(|e| format!("Failed to parse message list: {}", e))
    }

    /// Get a single message by ID (full format to get HTML body)
    pub async fn get_message(&self, message_id: &str) -> Result<GmailMessage, String> {
        let url = format!(
            "{}/messages/{}?format=full",
            GMAIL_API_BASE, message_id
        );

        let response = self
            .http
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("Get message failed: {}", e))?;

        if response.status() == 429 {
            return Err("RATE_LIMITED".to_string());
        }

        if response.status() == 401 {
            return Err("AUTH_EXPIRED".to_string());
        }

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("Get message failed ({}): {}", status, body));
        }

        response
            .json()
            .await
            .map_err(|e| format!("Failed to parse message: {}", e))
    }

    /// List history changes since a given history ID
    pub async fn list_history(
        &self,
        start_history_id: &str,
        page_token: Option<&str>,
    ) -> Result<GmailHistoryList, String> {
        let mut url = format!(
            "{}/history?startHistoryId={}&historyTypes=messageAdded",
            GMAIL_API_BASE, start_history_id,
        );

        if let Some(token) = page_token {
            url.push_str(&format!("&pageToken={}", token));
        }

        let response = self
            .http
            .get(&url)
            .bearer_auth(&self.access_token)
            .send()
            .await
            .map_err(|e| format!("List history failed: {}", e))?;

        if response.status() == 429 {
            return Err("RATE_LIMITED".to_string());
        }

        if response.status() == 404 {
            // History ID expired — need to do full re-sync
            return Err("HISTORY_EXPIRED".to_string());
        }

        if !response.status().is_success() {
            let status = response.status();
            let body = response.text().await.unwrap_or_default();
            return Err(format!("List history failed ({}): {}", status, body));
        }

        response
            .json()
            .await
            .map_err(|e| format!("Failed to parse history: {}", e))
    }

    /// Extract the HTML body from a Gmail message, searching through MIME parts
    pub fn extract_html_body(message: &GmailMessage) -> Option<String> {
        if let Some(ref payload) = message.payload {
            // Check if the payload itself is HTML
            if let Some(ref mime) = payload.mime_type {
                if mime == "text/html" {
                    if let Some(ref body) = payload.body {
                        if let Some(ref data) = body.data {
                            return decode_base64_body(data);
                        }
                    }
                }
            }

            // Search through parts recursively
            if let Some(ref parts) = payload.parts {
                return find_html_in_parts(parts);
            }
        }
        None
    }

    /// Extract the "From" header from a message
    pub fn get_from_header(message: &GmailMessage) -> Option<String> {
        message
            .payload
            .as_ref()?
            .headers
            .as_ref()?
            .iter()
            .find(|h| h.name.eq_ignore_ascii_case("From"))
            .map(|h| h.value.clone())
    }
}

fn find_html_in_parts(parts: &[GmailPart]) -> Option<String> {
    for part in parts {
        if let Some(ref mime) = part.mime_type {
            if mime == "text/html" {
                if let Some(ref body) = part.body {
                    if let Some(ref data) = body.data {
                        return decode_base64_body(data);
                    }
                }
            }
        }
        // Recurse into nested parts
        if let Some(ref sub_parts) = part.parts {
            if let Some(html) = find_html_in_parts(sub_parts) {
                return Some(html);
            }
        }
    }
    None
}

fn decode_base64_body(data: &str) -> Option<String> {
    // Gmail uses URL-safe base64 without padding
    let decoded = URL_SAFE_NO_PAD.decode(data).ok()?;
    String::from_utf8(decoded).ok()
}
