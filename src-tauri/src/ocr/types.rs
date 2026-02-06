use serde::{Deserialize, Serialize};

/// Result from OCR text recognition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OcrResult {
    /// The full recognized text
    pub full_text: String,
    /// Individual lines of text
    pub lines: Vec<String>,
    /// Overall confidence score (0.0 to 1.0)
    pub confidence: f64,
}

impl OcrResult {
    pub fn new(full_text: String, confidence: f64) -> Self {
        let lines = full_text
            .lines()
            .map(|l| l.trim().to_string())
            .filter(|l| !l.is_empty())
            .collect();
        Self {
            full_text,
            lines,
            confidence,
        }
    }
}
