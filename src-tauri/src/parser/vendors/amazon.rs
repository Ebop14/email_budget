use regex::Regex;
use scraper::{Html, Selector};

use super::{parse_amount, parse_date, VendorParser};
use crate::parser::types::{ParseResult, ParsedItem, ParsedTransaction};

pub struct AmazonParser;

impl VendorParser for AmazonParser {
    fn vendor_id(&self) -> &'static str {
        "amazon"
    }

    fn can_parse(&self, html: &str) -> bool {
        html.contains("amazon.com") || html.contains("amazon order")
    }

    fn parse(&self, html: &str) -> ParseResult {
        let document = Html::parse_document(html);

        // Try to find the order total
        let total = extract_total(&document, html);
        let date = extract_date(&document, html);
        let items = extract_items(&document);

        match (total, date) {
            (Some(amount), Some(transaction_date)) => {
                let mut transaction =
                    ParsedTransaction::new("Amazon".to_string(), amount, transaction_date, "amazon".to_string());

                transaction.items = items;

                // Lower confidence if no items found for high total
                if transaction.items.is_empty() && amount > 10000 {
                    transaction.confidence = 0.7;
                }

                ParseResult::Success(transaction)
            }
            (None, _) => ParseResult::Failed("Could not extract order total".to_string()),
            (_, None) => ParseResult::Failed("Could not extract order date".to_string()),
        }
    }
}

fn extract_total(document: &Html, html: &str) -> Option<i64> {
    // Try different selectors for the total
    let selectors = [
        r#"[class*="total"]"#,
        r#"td:contains("Order Total")"#,
        r#"td:contains("Grand Total")"#,
    ];

    for selector_str in &selectors {
        if let Ok(selector) = Selector::parse(selector_str) {
            for element in document.select(&selector) {
                let text = element.text().collect::<String>();
                if let Some(amount) = extract_amount_from_text(&text) {
                    return Some(amount);
                }
            }
        }
    }

    // Fallback: regex search in HTML
    let total_patterns = [
        r"Order Total[:\s]*\$?([\d,]+\.?\d*)",
        r"Grand Total[:\s]*\$?([\d,]+\.?\d*)",
        r"Total[:\s]*\$?([\d,]+\.?\d*)",
    ];

    for pattern in &total_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(html) {
                if let Some(amount_match) = caps.get(1) {
                    let amount_str = amount_match.as_str().replace(',', "");
                    if let Some(amount) = parse_amount(&amount_str) {
                        return Some(amount);
                    }
                }
            }
        }
    }

    None
}

fn extract_amount_from_text(text: &str) -> Option<i64> {
    let re = Regex::new(r"\$?([\d,]+\.?\d*)").ok()?;
    if let Some(caps) = re.captures(text) {
        if let Some(amount_match) = caps.get(1) {
            let amount_str = amount_match.as_str().replace(',', "");
            return parse_amount(&amount_str);
        }
    }
    None
}

fn extract_date(_document: &Html, html: &str) -> Option<String> {
    // Try to find date in common locations
    let date_patterns = [
        r"Order Placed[:\s]*([A-Za-z]+ \d{1,2}, \d{4})",
        r"Ordered on[:\s]*([A-Za-z]+ \d{1,2}, \d{4})",
        r"(\w+ \d{1,2}, \d{4})",
    ];

    for pattern in &date_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(html) {
                if let Some(date_match) = caps.get(1) {
                    if let Some(date) = parse_date(date_match.as_str()) {
                        return Some(date);
                    }
                }
            }
        }
    }

    // Fallback to today's date
    Some(chrono::Local::now().format("%Y-%m-%d").to_string())
}

fn extract_items(document: &Html) -> Vec<ParsedItem> {
    let mut items = Vec::new();

    // Try to find item rows
    if let Ok(selector) = Selector::parse(r#"[class*="item"], tr[class*="product"]"#) {
        for element in document.select(&selector) {
            let text = element.text().collect::<String>();

            // Try to extract item name and price
            if let Some(item) = parse_item_text(&text) {
                items.push(item);
            }
        }
    }

    items
}

fn parse_item_text(text: &str) -> Option<ParsedItem> {
    // Look for price pattern
    let price_re = Regex::new(r"\$?([\d,]+\.?\d*)").ok()?;

    if let Some(caps) = price_re.captures(text) {
        if let Some(price_match) = caps.get(1) {
            let price_str = price_match.as_str().replace(',', "");
            if let Some(price) = parse_amount(&price_str) {
                // Use text before price as item name
                let name = text[..caps.get(0)?.start()]
                    .trim()
                    .to_string();

                if !name.is_empty() && price > 0 {
                    return Some(ParsedItem::new(name, 1, price));
                }
            }
        }
    }

    None
}
