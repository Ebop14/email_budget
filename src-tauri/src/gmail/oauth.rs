use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::oneshot;

use http_body_util::Full;
use hyper::body::Bytes;
use hyper::server::conn::http1;
use hyper::service::service_fn;
use hyper::{Request, Response, StatusCode};
use hyper_util::rt::TokioIo;

use reqwest::Client;
use serde::Deserialize;

const AUTH_URL: &str = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL: &str = "https://oauth2.googleapis.com/token";
const REVOKE_URL: &str = "https://oauth2.googleapis.com/revoke";
const REDIRECT_PORT: u16 = 8249;
const REDIRECT_URI: &str = "http://localhost:8249/callback";
const SCOPES: &str = "https://www.googleapis.com/auth/gmail.readonly";

#[derive(Debug, Deserialize)]
struct TokenResponse {
    access_token: String,
    refresh_token: Option<String>,
    expires_in: u64,
    #[allow(dead_code)]
    token_type: String,
}

#[derive(Debug)]
pub struct OAuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_at: String,
}

/// Run the full OAuth 2.0 desktop flow:
/// 1. Open browser to Google consent page
/// 2. Listen on localhost for the redirect callback
/// 3. Exchange authorization code for tokens
pub async fn run_oauth_flow(
    client_id: &str,
    client_secret: &str,
) -> Result<OAuthTokens, String> {
    // Build the authorization URL
    let auth_url = format!(
        "{}?client_id={}&redirect_uri={}&response_type=code&scope={}&access_type=offline&prompt=consent",
        AUTH_URL,
        urlencoding::encode(client_id),
        urlencoding::encode(REDIRECT_URI),
        urlencoding::encode(SCOPES),
    );

    // Open browser
    open::that(&auth_url).map_err(|e| format!("Failed to open browser: {}", e))?;

    // Start localhost callback server and wait for the authorization code
    let code = wait_for_callback().await?;

    // Exchange authorization code for tokens
    exchange_code(client_id, client_secret, &code).await
}

/// Start a temporary HTTP server on localhost to receive the OAuth callback
async fn wait_for_callback() -> Result<String, String> {
    let (tx, rx) = oneshot::channel::<String>();
    let tx = Arc::new(tokio::sync::Mutex::new(Some(tx)));

    let addr = SocketAddr::from(([127, 0, 0, 1], REDIRECT_PORT));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| format!("Failed to bind callback server on port {}: {}", REDIRECT_PORT, e))?;

    log::info!("OAuth callback server listening on {}", addr);

    // Accept exactly one connection
    let (stream, _) = listener
        .accept()
        .await
        .map_err(|e| format!("Failed to accept connection: {}", e))?;

    let io = TokioIo::new(stream);
    let tx_clone = tx.clone();

    let service = service_fn(move |req: Request<hyper::body::Incoming>| {
        let tx = tx_clone.clone();
        async move {
            let query = req.uri().query().unwrap_or("");
            let params: Vec<(&str, &str)> = query
                .split('&')
                .filter_map(|p| p.split_once('='))
                .collect();

            let code = params.iter().find(|(k, _)| *k == "code").map(|(_, v)| *v);
            let error = params.iter().find(|(k, _)| *k == "error").map(|(_, v)| *v);

            if let Some(error) = error {
                let body = format!(
                    "<html><body><h1>Authorization Failed</h1><p>Error: {}</p><p>You can close this window.</p></body></html>",
                    error
                );
                let response = Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .header("Content-Type", "text/html")
                    .body(Full::new(Bytes::from(body)))
                    .unwrap();

                if let Some(sender) = tx.lock().await.take() {
                    let _ = sender.send(String::new());
                }
                Ok::<_, hyper::Error>(response)
            } else if let Some(code) = code {
                let body = "<html><body><h1>Authorization Successful!</h1><p>You can close this window and return to Email Budget.</p></body></html>";
                let response = Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", "text/html")
                    .body(Full::new(Bytes::from(body.to_string())))
                    .unwrap();

                if let Some(sender) = tx.lock().await.take() {
                    let _ = sender.send(urlencoding::decode(code).unwrap_or_default().to_string());
                }
                Ok(response)
            } else {
                let body = "<html><body><h1>Missing authorization code</h1></body></html>";
                let response = Response::builder()
                    .status(StatusCode::BAD_REQUEST)
                    .header("Content-Type", "text/html")
                    .body(Full::new(Bytes::from(body.to_string())))
                    .unwrap();
                Ok(response)
            }
        }
    });

    tokio::spawn(async move {
        if let Err(e) = http1::Builder::new().serve_connection(io, service).await {
            log::warn!("OAuth callback connection error: {}", e);
        }
    });

    let code = rx
        .await
        .map_err(|_| "OAuth callback channel closed unexpectedly".to_string())?;

    if code.is_empty() {
        return Err("OAuth authorization was denied or failed".to_string());
    }

    Ok(code)
}

/// Exchange an authorization code for access + refresh tokens
async fn exchange_code(
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
        .ok_or("No refresh token received. Try revoking app access at https://myaccount.google.com/permissions and reconnecting.")?;

    let expires_at = chrono::Utc::now()
        + chrono::Duration::seconds(token_resp.expires_in as i64);

    Ok(OAuthTokens {
        access_token: token_resp.access_token,
        refresh_token,
        expires_at: expires_at.to_rfc3339(),
    })
}

/// Refresh an expired access token using the refresh token
pub async fn refresh_access_token(
    client_id: &str,
    client_secret: &str,
    refresh_token: &str,
) -> Result<(String, String), String> {
    let client = Client::new();

    let response = client
        .post(TOKEN_URL)
        .form(&[
            ("refresh_token", refresh_token),
            ("client_id", client_id),
            ("client_secret", client_secret),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Token refresh request failed: {}", e))?;

    if !response.status().is_success() {
        let body = response.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", body));
    }

    let token_resp: TokenResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse refresh response: {}", e))?;

    let expires_at = chrono::Utc::now()
        + chrono::Duration::seconds(token_resp.expires_in as i64);

    Ok((token_resp.access_token, expires_at.to_rfc3339()))
}

/// Revoke a token (best-effort, don't fail if revocation fails)
pub async fn revoke_token(token: &str) {
    let client = Client::new();
    let _ = client
        .post(REVOKE_URL)
        .form(&[("token", token)])
        .send()
        .await;
}
