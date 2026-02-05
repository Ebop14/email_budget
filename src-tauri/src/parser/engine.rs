use super::types::ParseResult;
use super::vendors::{
    amazon::AmazonParser, doordash::DoorDashParser, generic::GenericParser, uber::UberParser,
    uber_eats::UberEatsParser, venmo::VenmoParser, VendorParser,
};

/// Parse HTML content and extract transaction data
pub fn parse_html(html: &str) -> ParseResult {
    // List of vendor parsers in priority order
    let parsers: Vec<Box<dyn VendorParser>> = vec![
        Box::new(AmazonParser),
        Box::new(DoorDashParser),
        Box::new(UberEatsParser),
        Box::new(UberParser),
        Box::new(VenmoParser),
        Box::new(GenericParser), // Fallback
    ];

    let html_lower = html.to_lowercase();

    for parser in parsers {
        if parser.can_parse(&html_lower) {
            log::info!("Detected vendor: {}", parser.vendor_id());
            match parser.parse(html) {
                ParseResult::Success(transaction) => {
                    log::info!(
                        "Successfully parsed {} transaction: {} for ${:.2}",
                        parser.vendor_id(),
                        transaction.merchant,
                        transaction.amount as f64 / 100.0
                    );
                    return ParseResult::Success(transaction);
                }
                ParseResult::Failed(err) => {
                    log::warn!("Failed to parse {} receipt: {}", parser.vendor_id(), err);
                    // Continue to try other parsers
                }
                ParseResult::NotRecognized => {
                    // Continue to next parser
                }
            }
        }
    }

    ParseResult::NotRecognized
}

#[allow(dead_code)]
/// Detect which vendor an HTML receipt is from
pub fn detect_vendor(html: &str) -> Option<&'static str> {
    let html_lower = html.to_lowercase();

    if html_lower.contains("amazon.com") || html_lower.contains("amazon order") {
        Some("amazon")
    } else if html_lower.contains("doordash") {
        Some("doordash")
    } else if html_lower.contains("uber eats") || html_lower.contains("ubereats") {
        Some("uber_eats")
    } else if html_lower.contains("uber.com") && !html_lower.contains("uber eats") {
        Some("uber")
    } else if html_lower.contains("venmo") {
        Some("venmo")
    } else {
        None
    }
}
