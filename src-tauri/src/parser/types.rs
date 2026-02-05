use serde::{Deserialize, Serialize};

/// A parsed transaction from an email receipt
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedTransaction {
    /// The merchant name as displayed
    pub merchant: String,
    /// Total amount in cents
    pub amount: i64,
    /// Transaction date in YYYY-MM-DD format
    pub transaction_date: String,
    /// Provider ID (e.g., "amazon", "doordash")
    pub provider: String,
    /// Individual items in the transaction
    pub items: Vec<ParsedItem>,
    /// Raw text extracted (for debugging)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub raw_text: Option<String>,
    /// Confidence score from 0.0 to 1.0
    pub confidence: f64,
}

/// A single item in a transaction
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedItem {
    /// Item name
    pub name: String,
    /// Quantity
    pub quantity: i32,
    /// Unit price in cents
    pub unit_price: i64,
    /// Total price in cents (quantity * unit_price)
    pub total_price: i64,
}

impl ParsedTransaction {
    /// Create a new parsed transaction
    pub fn new(merchant: String, amount: i64, transaction_date: String, provider: String) -> Self {
        Self {
            merchant,
            amount,
            transaction_date,
            provider,
            items: Vec::new(),
            raw_text: None,
            confidence: 1.0,
        }
    }

    /// Add an item to the transaction
    pub fn add_item(&mut self, item: ParsedItem) {
        self.items.push(item);
    }

    /// Generate a source hash for deduplication
    pub fn source_hash(&self) -> String {
        use sha2::{Digest, Sha256};

        let normalized_merchant = self.merchant.to_lowercase().trim().to_string();
        let input = format!("{}|{}|{}", normalized_merchant, self.amount, self.transaction_date);

        let mut hasher = Sha256::new();
        hasher.update(input.as_bytes());
        let result = hasher.finalize();

        hex::encode(result)
    }

    /// Get normalized merchant name for categorization
    pub fn merchant_normalized(&self) -> String {
        self.merchant
            .to_lowercase()
            .trim()
            .chars()
            .filter(|c| c.is_alphanumeric() || c.is_whitespace())
            .collect::<String>()
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
    }
}

impl ParsedItem {
    pub fn new(name: String, quantity: i32, unit_price: i64) -> Self {
        Self {
            name,
            quantity,
            unit_price,
            total_price: quantity as i64 * unit_price,
        }
    }
}

/// Result of parsing an HTML receipt
#[derive(Debug)]
pub enum ParseResult {
    /// Successfully parsed a transaction
    Success(ParsedTransaction),
    /// Failed to parse
    Failed(String),
    /// Not a recognized receipt format
    NotRecognized,
}
