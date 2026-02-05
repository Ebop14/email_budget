use regex::Regex;
use scraper::Html;

use super::{parse_amount, parse_date, VendorParser};
use crate::parser::types::{ParseResult, ParsedTransaction};

pub struct UberParser;

impl VendorParser for UberParser {
    fn vendor_id(&self) -> &'static str {
        "uber"
    }

    fn can_parse(&self, html: &str) -> bool {
        // Uber rides, not Uber Eats
        html.contains("uber.com") && !html.contains("uber eats") && !html.contains("ubereats")
    }

    fn parse(&self, html: &str) -> ParseResult {
        let document = Html::parse_document(html);
        let text = super::extract_text(html);

        // Extract trip total
        let total = extract_total(&text, html);

        // Extract date
        let date = extract_date(&text, html);

        // Extract trip details for merchant name
        let trip_details = extract_trip_details(&text);

        match (total, date) {
            (Some(amount), Some(transaction_date)) => {
                let merchant = if let Some(details) = trip_details {
                    format!("Uber - {}", details)
                } else {
                    "Uber".to_string()
                };

                let transaction =
                    ParsedTransaction::new(merchant, amount, transaction_date, "uber".to_string());

                ParseResult::Success(transaction)
            }
            (None, _) => ParseResult::Failed("Could not extract trip total".to_string()),
            (_, None) => ParseResult::Failed("Could not extract trip date".to_string()),
        }
    }
}

fn extract_total(text: &str, html: &str) -> Option<i64> {
    let patterns = [
        r"(?i)total[:\s]*\$?([\d,]+\.?\d*)",
        r"(?i)trip total[:\s]*\$?([\d,]+\.?\d*)",
        r"(?i)you paid[:\s]*\$?([\d,]+\.?\d*)",
        r"(?i)fare[:\s]*\$?([\d,]+\.?\d*)",
    ];

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for search_in in &[text, html] {
                if let Some(caps) = re.captures(search_in) {
                    if let Some(amount_match) = caps.get(1) {
                        let amount_str = amount_match.as_str().replace(',', "");
                        if let Some(amount) = parse_amount(&amount_str) {
                            if amount > 0 && amount < 50000 {
                                // Reasonable Uber fare
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

    Some(chrono::Local::now().format("%Y-%m-%d").to_string())
}

fn extract_trip_details(text: &str) -> Option<String> {
    // Try to extract origin -> destination
    if let Ok(re) = Regex::new(r"(?i)from\s+([A-Za-z0-9\s,]+?)\s+to\s+([A-Za-z0-9\s,]+)") {
        if let Some(caps) = re.captures(text) {
            if let (Some(from), Some(to)) = (caps.get(1), caps.get(2)) {
                let origin = from.as_str().trim();
                let dest = to.as_str().trim();
                if origin.len() < 50 && dest.len() < 50 {
                    return Some(format!("{} to {}", origin, dest));
                }
            }
        }
    }

    None
}
