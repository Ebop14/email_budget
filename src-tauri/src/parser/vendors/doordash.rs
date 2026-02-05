use regex::Regex;
use scraper::Html;

use super::{parse_amount, parse_date, VendorParser};
use crate::parser::types::{ParseResult, ParsedItem, ParsedTransaction};

pub struct DoorDashParser;

impl VendorParser for DoorDashParser {
    fn vendor_id(&self) -> &'static str {
        "doordash"
    }

    fn can_parse(&self, html: &str) -> bool {
        html.contains("doordash")
    }

    fn parse(&self, html: &str) -> ParseResult {
        let _document = Html::parse_document(html);
        let text = super::extract_text(html);

        // Extract restaurant name
        let restaurant = extract_restaurant(&text, html);

        // Extract total
        let total = extract_total(&text, html);

        // Extract date
        let date = extract_date(&text, html);

        // Extract items
        let items = extract_items(&text);

        match (total, date) {
            (Some(amount), Some(transaction_date)) => {
                let merchant = restaurant.unwrap_or_else(|| "DoorDash".to_string());
                let mut transaction =
                    ParsedTransaction::new(merchant, amount, transaction_date, "doordash".to_string());

                transaction.items = items;
                ParseResult::Success(transaction)
            }
            (None, _) => ParseResult::Failed("Could not extract order total".to_string()),
            (_, None) => ParseResult::Failed("Could not extract order date".to_string()),
        }
    }
}

fn extract_restaurant(text: &str, _html: &str) -> Option<String> {
    // DoorDash emails typically have restaurant name prominently
    let patterns = [
        r"(?i)your order from\s+([A-Za-z0-9\s&'-]+)",
        r"(?i)order from\s+([A-Za-z0-9\s&'-]+)",
        r"(?i)delivered from\s+([A-Za-z0-9\s&'-]+)",
    ];

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(name) = caps.get(1) {
                    let restaurant = name.as_str().trim().to_string();
                    if !restaurant.is_empty() && restaurant.len() < 100 {
                        return Some(restaurant);
                    }
                }
            }
        }
    }

    None
}

fn extract_total(text: &str, html: &str) -> Option<i64> {
    let patterns = [
        r"(?i)total[:\s]*\$?([\d,]+\.?\d*)",
        r"(?i)charged[:\s]*\$?([\d,]+\.?\d*)",
        r"(?i)order total[:\s]*\$?([\d,]+\.?\d*)",
    ];

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            // Search in text first, then HTML
            for search_in in &[text, html] {
                if let Some(caps) = re.captures(search_in) {
                    if let Some(amount_match) = caps.get(1) {
                        let amount_str = amount_match.as_str().replace(',', "");
                        if let Some(amount) = parse_amount(&amount_str) {
                            if amount > 0 && amount < 100000 {
                                // Reasonable amount
                                return Some(amount);
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

fn extract_date(text: &str, html: &str) -> Option<String> {
    let patterns = [
        r"(\w+ \d{1,2}, \d{4})",
        r"(\d{1,2}/\d{1,2}/\d{2,4})",
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

fn extract_items(text: &str) -> Vec<ParsedItem> {
    let mut items = Vec::new();

    // Look for item patterns like "1x Item Name $9.99"
    if let Ok(re) = Regex::new(r"(\d+)\s*x?\s+([A-Za-z][A-Za-z0-9\s&'-]*?)\s+\$?([\d,]+\.?\d*)") {
        for caps in re.captures_iter(text) {
            if let (Some(qty), Some(name), Some(price)) = (caps.get(1), caps.get(2), caps.get(3)) {
                let quantity: i32 = qty.as_str().parse().unwrap_or(1);
                let item_name = name.as_str().trim().to_string();
                let price_str = price.as_str().replace(',', "");

                if let Some(unit_price) = parse_amount(&price_str) {
                    if !item_name.is_empty() && unit_price > 0 {
                        items.push(ParsedItem::new(item_name, quantity, unit_price));
                    }
                }
            }
        }
    }

    items
}
