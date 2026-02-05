use regex::Regex;
use scraper::Html;

use super::{parse_amount, parse_date, VendorParser};
use crate::parser::types::{ParseResult, ParsedTransaction};

pub struct VenmoParser;

impl VendorParser for VenmoParser {
    fn vendor_id(&self) -> &'static str {
        "venmo"
    }

    fn can_parse(&self, html: &str) -> bool {
        html.contains("venmo")
    }

    fn parse(&self, html: &str) -> ParseResult {
        let _document = Html::parse_document(html);
        let text = super::extract_text(html);

        // Determine if this is a payment sent or received
        let (is_payment_out, counterparty) = extract_payment_direction(&text);

        // Extract amount
        let total = extract_total(&text, html);

        // Extract date
        let date = extract_date(&text, html);

        // Extract note/description
        let note = extract_note(&text);

        match (total, date) {
            (Some(mut amount), Some(transaction_date)) => {
                // If payment received, make it negative (income)
                // For expense tracking, we typically only care about outgoing payments
                if !is_payment_out {
                    // Mark received payments as negative for now
                    // The UI can decide how to display this
                    amount = -amount;
                }

                let merchant = if let Some(person) = counterparty {
                    if let Some(ref note_text) = note {
                        format!("Venmo - {} ({})", person, note_text)
                    } else {
                        format!("Venmo - {}", person)
                    }
                } else {
                    "Venmo".to_string()
                };

                let mut transaction =
                    ParsedTransaction::new(merchant, amount.abs(), transaction_date, "venmo".to_string());

                // Store if it's an outgoing payment
                if !is_payment_out {
                    transaction.confidence = 0.8; // Lower confidence for received payments
                }

                ParseResult::Success(transaction)
            }
            (None, _) => ParseResult::Failed("Could not extract payment amount".to_string()),
            (_, None) => ParseResult::Failed("Could not extract payment date".to_string()),
        }
    }
}

fn extract_payment_direction(text: &str) -> (bool, Option<String>) {
    // Check if this is a payment sent or received
    let sent_patterns = [
        r"(?i)you paid\s+([A-Za-z][A-Za-z\s]+)",
        r"(?i)you sent\s+([A-Za-z][A-Za-z\s]+)",
        r"(?i)payment to\s+([A-Za-z][A-Za-z\s]+)",
    ];

    for pattern in &sent_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(name) = caps.get(1) {
                    let person = name.as_str().trim().to_string();
                    if !person.is_empty() && person.len() < 50 {
                        return (true, Some(person));
                    }
                }
            }
        }
    }

    let received_patterns = [
        r"(?i)([A-Za-z][A-Za-z\s]+)\s+paid you",
        r"(?i)([A-Za-z][A-Za-z\s]+)\s+sent you",
        r"(?i)payment from\s+([A-Za-z][A-Za-z\s]+)",
    ];

    for pattern in &received_patterns {
        if let Ok(re) = Regex::new(pattern) {
            if let Some(caps) = re.captures(text) {
                if let Some(name) = caps.get(1) {
                    let person = name.as_str().trim().to_string();
                    if !person.is_empty() && person.len() < 50 {
                        return (false, Some(person));
                    }
                }
            }
        }
    }

    // Default to outgoing payment
    (true, None)
}

fn extract_total(text: &str, html: &str) -> Option<i64> {
    let patterns = [
        r"(?i)\$\s*([\d,]+\.?\d*)",
        r"(?i)amount[:\s]*\$?([\d,]+\.?\d*)",
    ];

    for pattern in &patterns {
        if let Ok(re) = Regex::new(pattern) {
            for search_in in &[text, html] {
                if let Some(caps) = re.captures(search_in) {
                    if let Some(amount_match) = caps.get(1) {
                        let amount_str = amount_match.as_str().replace(',', "");
                        if let Some(amount) = parse_amount(&amount_str) {
                            if amount > 0 && amount < 1000000 {
                                // Reasonable Venmo amount
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

fn extract_note(text: &str) -> Option<String> {
    // Venmo payments often have a note
    if let Ok(re) = Regex::new(r#"(?i)(?:for|note)[:\s]*["']?([^"'\n]{1,100})["']?"#) {
        if let Some(caps) = re.captures(text) {
            if let Some(note) = caps.get(1) {
                let note_text = note.as_str().trim().to_string();
                if !note_text.is_empty() {
                    return Some(note_text);
                }
            }
        }
    }

    None
}
