use regex::Regex;

use crate::parser::types::{ParsedItem, ParsedTransaction};

use super::types::OcrResult;

/// Parse OCR text from a receipt photo and extract transaction data
pub fn parse_receipt_text(ocr: &OcrResult) -> Result<ParsedTransaction, String> {
    let text = &ocr.full_text;
    let lines = &ocr.lines;

    if lines.is_empty() {
        return Err("No text detected in image".to_string());
    }

    let merchant = extract_merchant(lines);
    let amount = extract_total_amount(text, lines)?;
    let date = extract_date(text);
    let items = extract_items(lines);

    // Confidence is lower for OCR (0.6-0.8 based on OCR confidence)
    let confidence = (ocr.confidence * 0.8).clamp(0.4, 0.8);

    let mut transaction = ParsedTransaction {
        merchant,
        amount,
        transaction_date: date,
        provider: "receipt_photo".to_string(),
        items,
        raw_text: Some(text.clone()),
        confidence,
    };

    // If we found items but no merchant, use first item as merchant hint
    if transaction.merchant == "Unknown Merchant" && !transaction.items.is_empty() {
        transaction.merchant = format!("Receipt ({})", transaction.items[0].name);
    }

    Ok(transaction)
}

/// Extract the merchant name from the first few lines of the receipt
fn extract_merchant(lines: &[String]) -> String {
    // The merchant name is typically in the first 1-3 lines, often the largest text
    // Heuristic: first non-trivial line that isn't a date, phone number, or address
    let skip_patterns = Regex::new(
        r"(?i)^(\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}|tel|phone|fax|\d{3}[.\-\s]\d{3}[.\-\s]\d{4}|\d+ [a-z]+ (st|ave|blvd|rd|dr|ln)|receipt|order|invoice|#\d)"
    ).unwrap();

    for line in lines.iter().take(5) {
        let trimmed = line.trim();
        if trimmed.len() >= 2 && trimmed.len() <= 50 && !skip_patterns.is_match(trimmed) {
            // Likely the merchant name
            return trimmed.to_string();
        }
    }

    "Unknown Merchant".to_string()
}

/// Extract the total amount from receipt text
fn extract_total_amount(text: &str, lines: &[String]) -> Result<i64, String> {
    // Look for "total" followed by a dollar amount (most reliable)
    let total_pattern =
        Regex::new(r"(?i)(?:grand\s*)?total[:\s]*\$?\s*(\d+[,.]?\d*\.?\d{0,2})").unwrap();

    // Search from bottom up since total is usually near the end
    for line in lines.iter().rev() {
        if let Some(caps) = total_pattern.captures(line) {
            if let Some(amount) = parse_dollar_amount(&caps[1]) {
                return Ok(amount);
            }
        }
    }

    // Fallback: look for the largest dollar amount on the receipt
    let amount_pattern = Regex::new(r"\$\s*(\d+[,.]?\d*\.?\d{0,2})").unwrap();
    let mut largest: Option<i64> = None;

    for cap in amount_pattern.captures_iter(text) {
        if let Some(amount) = parse_dollar_amount(&cap[1]) {
            if largest.is_none() || amount > largest.unwrap() {
                largest = Some(amount);
            }
        }
    }

    largest.ok_or_else(|| "Could not find a total amount on the receipt".to_string())
}

/// Parse a dollar amount string into cents
fn parse_dollar_amount(s: &str) -> Option<i64> {
    let cleaned = s.replace(',', "");
    let val: f64 = cleaned.parse().ok()?;
    if val > 0.0 && val < 100_000.0 {
        Some((val * 100.0).round() as i64)
    } else {
        None
    }
}

/// Extract a date from receipt text
fn extract_date(text: &str) -> String {
    // MM/DD/YYYY or MM-DD-YYYY
    let full_year = Regex::new(r"(\d{1,2})[/\-](\d{1,2})[/\-](20\d{2})").unwrap();
    if let Some(caps) = full_year.captures(text) {
        return format!(
            "{}-{:02}-{:02}",
            &caps[3],
            caps[1].parse::<u32>().unwrap_or(1),
            caps[2].parse::<u32>().unwrap_or(1)
        );
    }

    // MM/DD/YY
    let short_year = Regex::new(r"(\d{1,2})[/\-](\d{1,2})[/\-](\d{2})\b").unwrap();
    if let Some(caps) = short_year.captures(text) {
        let year = 2000 + caps[3].parse::<u32>().unwrap_or(0);
        return format!(
            "{}-{:02}-{:02}",
            year,
            caps[1].parse::<u32>().unwrap_or(1),
            caps[2].parse::<u32>().unwrap_or(1)
        );
    }

    // Default to today
    chrono::Local::now().format("%Y-%m-%d").to_string()
}

/// Extract line items from receipt text
fn extract_items(lines: &[String]) -> Vec<ParsedItem> {
    let item_pattern = Regex::new(
        r"(?i)^(.{3,40}?)\s+\$?\s*(\d+\.?\d{0,2})\s*$"
    ).unwrap();

    let mut items = Vec::new();

    for line in lines {
        // Skip lines with "total", "subtotal", "tax", "tip"
        let lower = line.to_lowercase();
        if lower.contains("total")
            || lower.contains("subtotal")
            || lower.contains("tax")
            || lower.contains("tip")
            || lower.contains("change")
            || lower.contains("balance")
            || lower.contains("payment")
        {
            continue;
        }

        if let Some(caps) = item_pattern.captures(line) {
            let name = caps[1].trim().to_string();
            if let Some(price) = parse_dollar_amount(&caps[2]) {
                items.push(ParsedItem::new(name, 1, price));
            }
        }
    }

    items
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_dollar_amount() {
        assert_eq!(parse_dollar_amount("12.99"), Some(1299));
        assert_eq!(parse_dollar_amount("1,234.56"), Some(123456));
        assert_eq!(parse_dollar_amount("5"), Some(500));
    }

    #[test]
    fn test_extract_date() {
        let text = "Date: 01/15/2024\nSome other text";
        assert_eq!(extract_date(text), "2024-01-15");

        let text2 = "12/25/23 Store";
        assert_eq!(extract_date(text2), "2023-12-25");
    }

    #[test]
    fn test_extract_total_amount() {
        let text = "Subtotal $10.00\nTax $0.80\nTotal $10.80";
        let lines: Vec<String> = text.lines().map(|l| l.to_string()).collect();
        assert_eq!(extract_total_amount(text, &lines).unwrap(), 1080);
    }

    #[test]
    fn test_extract_merchant() {
        let lines = vec![
            "STARBUCKS".to_string(),
            "123 Main St".to_string(),
            "01/15/2024".to_string(),
        ];
        assert_eq!(extract_merchant(&lines), "STARBUCKS");
    }
}
