use reqwest::Client;
use serde::Deserialize;

use super::config;
use super::oauth::{self, OAuthTokens};

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

/// Build the OAuth authorization URL for mobile (uses custom URL scheme) with PKCE.
/// Returns (auth_url, code_verifier) — the verifier must be sent back when exchanging the code.
pub fn build_auth_url() -> (String, String) {
    let code_verifier = oauth::generate_code_verifier();
    let code_challenge = oauth::compute_code_challenge(&code_verifier);

    let url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent&code_challenge={}&code_challenge_method=S256",
        AUTH_URL,
        urlencoding::encode(config::GOOGLE_CLIENT_ID),
        urlencoding::encode(REDIRECT_URI),
        urlencoding::encode(SCOPES),
        urlencoding::encode(&code_challenge),
    );

    (url, code_verifier)
}

/// Exchange an authorization code for tokens (mobile redirect URI) with PKCE
pub async fn exchange_code_mobile(
    code: &str,
    code_verifier: &str,
) -> Result<OAuthTokens, String> {
    let client = Client::new();

    let response = client
        .post(TOKEN_URL)
        .form(&[
            ("code", code),
            ("client_id", config::GOOGLE_CLIENT_ID),
            ("client_secret", config::GOOGLE_CLIENT_SECRET),
            ("redirect_uri", REDIRECT_URI),
            ("grant_type", "authorization_code"),
            ("code_verifier", code_verifier),
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
