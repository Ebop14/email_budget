pub mod amazon;
pub mod doordash;
pub mod generic;
pub mod uber;
pub mod uber_eats;
pub mod venmo;

use super::types::ParseResult;

/// Trait for vendor-specific parsers
pub trait VendorParser {
    /// Unique identifier for this vendor
    fn vendor_id(&self) -> &'static str;

    /// Check if this parser can handle the given HTML
    fn can_parse(&self, html: &str) -> bool;

    /// Parse the HTML and extract transaction data
    fn parse(&self, html: &str) -> ParseResult;
}

/// Helper to parse a dollar amount string to cents
pub fn parse_amount(amount_str: &str) -> Option<i64> {
    // Remove currency symbols and whitespace
    let cleaned: String = amount_str
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '.' || *c == '-')
        .collect();

    // Parse as float and convert to cents
    cleaned.parse::<f64>().ok().map(|f| (f * 100.0).round() as i64)
}

/// Helper to parse a date string into YYYY-MM-DD format
pub fn parse_date(date_str: &str) -> Option<String> {
    use chrono::NaiveDate;

    // Try various date formats
    let formats = [
        "%B %d, %Y",       // January 15, 2024
        "%b %d, %Y",       // Jan 15, 2024
        "%m/%d/%Y",        // 01/15/2024
        "%m/%d/%y",        // 01/15/24
        "%Y-%m-%d",        // 2024-01-15
        "%d %B %Y",        // 15 January 2024
        "%d %b %Y",        // 15 Jan 2024
        "%B %d %Y",        // January 15 2024
        "%b %d %Y",        // Jan 15 2024
    ];

    let cleaned = date_str.trim();

    for format in &formats {
        if let Ok(date) = NaiveDate::parse_from_str(cleaned, format) {
            return Some(date.format("%Y-%m-%d").to_string());
        }
    }

    None
}

/// Extract text content from HTML, removing tags
pub fn extract_text(html: &str) -> String {
    use scraper::{Html, Selector};

    let document = Html::parse_document(html);
    let body_selector = Selector::parse("body").unwrap();

    if let Some(body) = document.select(&body_selector).next() {
        body.text().collect::<Vec<_>>().join(" ")
    } else {
        html.to_string()
    }
}
