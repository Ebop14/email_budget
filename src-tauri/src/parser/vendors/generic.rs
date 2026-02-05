use regex::Regex;
use scraper::{Html, Selector};

use super::{parse_amount, parse_date, VendorParser};
use crate::parser::types::{ParseResult, ParsedTransaction};

/// Generic fallback parser that attempts to extract transaction data from any email
pub struct GenericParser;

impl VendorParser for GenericParser {
    fn vendor_id(&self) -> &'static str {
        "generic"
    }

    fn can_parse(&self, html: &str) -> bool {
        // Always attempt generic parsing as a fallback
        // Look for common receipt indicators
        html.contains("total")
            || html.contains("receipt")
            || html.contains("order")
            || html.contains("payment")
            || html.contains("invoice")
    }

    fn parse(&self, html: &str) -> ParseResult {
        let document = Html::parse_document(html);
        let text = super::extract_text(html);

        // Try to extract merchant from email
        let merchant = extract_merchant(&document, &text, html);

        // Try to extract total
        let total = extract_total(&text, html);

        // Try to extract date
        let date = extract_date(&text, html);

        match (merchant, total, date) {
            (Some(merchant_name), Some(amount), Some(transaction_date)) => {
                let mut transaction =
                    ParsedTransaction::new(merchant_name, amount, transaction_date, "generic".to_string());

                // Lower confidence for generic parsing
                transaction.confidence = 0.5;

                ParseResult::Success(transaction)
            }
            (None, Some(_), _) => ParseResult::Failed("Could not identify merchant".to_string()),
            (_, None, _) => ParseResult::Failed("Could not extract amount".to_string()),
            (_, _, None) => ParseResult::Failed("Could not extract date".to_string()),
        }
    }
}

fn extract_merchant(document: &Html, text: &str, html: &str) -> Option<String> {
    // Try to find merchant from email subject or prominent text
    // Look for "from" patterns
    let from_patterns = [
        r"(?i)(?:from|order from|receipt from|payment to)\s+([A-Za-z][A-Za-z0-9\s&'-]{1,50})",
        r"(?i)([A-Za-z][A-Za-z0-9\s&'-]{1,30})\s+(?:receipt|order|invoice)",
    ];

    for pattern in &from_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(name) = caps.get(1) {
                    let merchant = name.as_str().trim().to_string();
                    if is_valid_merchant_name(&merchant) {
                        return Some(merchant);
                    }
                }
            }
        }
    }

    // Try to extract from title tag
    if let Ok(selector) = Selector::parse("title") {
        if let Some(title_element) = document.select(&selector).next() {
            let title = title_element.text().collect::<String>();
            if let Some(merchant) = extract_merchant_from_title(&title) {
                return Some(merchant);
            }
        }
    }

    // Try meta tags
    if let Ok(selector) = Selector::parse(r#"meta[property="og:site_name"]"#) {
        if let Some(meta) = document.select(&selector).next() {
            if let Some(content) = meta.value().attr("content") {
                if is_valid_merchant_name(content) {
                    return Some(content.to_string());
                }
            }
        }
    }

    None
}

fn extract_merchant_from_title(title: &str) -> Option<String> {
    // Remove common suffixes
    let cleaned = title
        .replace("Receipt", "")
        .replace("Order", "")
        .replace("Confirmation", "")
        .replace("Invoice", "")
        .trim()
        .to_string();

    if is_valid_merchant_name(&cleaned) {
        Some(cleaned)
    } else {
        None
    }
}

fn is_valid_merchant_name(name: &str) -> bool {
    let trimmed = name.trim();
    !trimmed.is_empty()
        && trimmed.len() >= 2
        && trimmed.len() <= 50
        && trimmed.chars().any(|c| c.is_alphabetic())
        && !trimmed.to_lowercase().contains("receipt")
        && !trimmed.to_lowercase().contains("order confirmation")
}

fn extract_total(text: &str, html: &str) -> Option<i64> {
    // Look for total amount patterns
    let patterns = [
        r"(?i)(?:grand |order |)total[:\s]*\$?\s*([\d,]+\.?\d*)",
        r"(?i)amount[:\s]*\$?\s*([\d,]+\.?\d*)",
        r"(?i)you (?:paid|charged)[:\s]*\$?\s*([\d,]+\.?\d*)",
        r"(?i)payment[:\s]*\$?\s*([\d,]+\.?\d*)",
    ];

    // Collect all potential amounts
    let mut amounts: Vec<i64> = Vec::new();

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for search_in in &[text, html] {
                for caps in re.captures_iter(search_in) {
                    if let Some(amount_match) = caps.get(1) {
                        let amount_str = amount_match.as_str().replace(',', "");
                        if let Some(amount) = parse_amount(&amount_str) {
                            if amount > 0 && amount < 1000000 {
                                amounts.push(amount);
                            }
                        }
                    }
                }
            }
        }
    }

    // Return the largest reasonable amount (likely the total)
    amounts.into_iter().max()
}

fn extract_date(text: &str, html: &str) -> Option<String> {
    let patterns = [
        r"(\w+ \d{1,2}, \d{4})",
        r"(\d{1,2}/\d{1,2}/\d{2,4})",
        r"(\d{4}-\d{2}-\d{2})",
    ];

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for search_in in &[text, html] {
                if let Some(caps) = re.captures(search_in) {
                    if let Some(date_match) = caps.get(1) {
                        if let Some(date) = parse_date(date_match.as_str()) {
                            return Some(date);
                        }
                    }
                }
            }
        }
    }

    // Default to today
    Some(chrono::Local::now().format("%Y-%m-%d").to_string())
}
