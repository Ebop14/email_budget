use reqwest::Client;
use serde::Deserialize;

use super::oauth::OAuthTokens;

const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const REDIRECT_URI: &str = "emailbudget://oauth-callback";
const SCOPES: &str = "https://www.googleapis.com/auth/gmail.readonly";

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
    #[allow(dead_code)]
    token_type: String,
}

/// Build the OAuth authorization URL for mobile (uses custom URL scheme)
pub fn build_auth_url(client_id: &str) -> String {
    format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        AUTH_URL,
        urlencoding::encode(client_id),
        urlencoding::encode(REDIRECT_URI),
        urlencoding::encode(SCOPES),
    )
}

/// Exchange an authorization code for tokens (mobile redirect URI)
pub async fn exchange_code_mobile(
    client_id: &str,
    client_secret: &str,
    code: &str,
) -> Result<OAuthTokens, String> {
    let client = Client::new();

    let response = client
        .post(TOKEN_URL)
        .form(&[
            ("code", code),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("redirect_uri", REDIRECT_URI),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| format!("Token exchange request failed: {}", e))?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", body));
    }

    let token_resp: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse token response: {}", e))?;

    let refresh_token = token_resp
        .refresh_token
        .ok_or("No refresh token received. Try revoking app access and reconnecting.")?;

    let expires_at = chrono::Utc::now()
        + chrono::Duration::seconds(token_resp.expires_in as i64);

    Ok(OAuthTokens {
        access_token: token_resp.access_token,
        refresh_token,
        expires_at: expires_at.to_rfc3339(),
    })
}
