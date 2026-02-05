use std::collections::HashMap;
use once_cell::sync::Lazy;

/// Default category mappings for known providers
pub static PROVIDER_CATEGORIES: Lazy<HashMap<&'static str, &'static str>> = Lazy::new(|| {
    let mut m = HashMap::new();
    m.insert("amazon", "Shopping");
    m.insert("doordash", "Food Delivery");
    m.insert("uber_eats", "Food Delivery");
    m.insert("uber", "Rideshare");
    m.insert("venmo", "Peer Payment");
    m
});

/// Default category mappings for common merchants
pub static MERCHANT_PATTERNS: Lazy<Vec<(&'static str, &'static str)>> = Lazy::new(|| {
    vec![
        // Food Delivery
        ("doordash", "Food Delivery"),
        ("uber eats", "Food Delivery"),
        ("grubhub", "Food Delivery"),
        ("postmates", "Food Delivery"),
        ("instacart", "Food Delivery"),

        // Rideshare
        ("uber", "Rideshare"),
        ("lyft", "Rideshare"),

        // Shopping
        ("amazon", "Shopping"),
        ("walmart", "Shopping"),
        ("target", "Shopping"),
        ("costco", "Shopping"),
        ("best buy", "Shopping"),
        ("home depot", "Shopping"),
        ("lowes", "Shopping"),
        ("ikea", "Shopping"),

        // Food & Dining
        ("starbucks", "Food & Dining"),
        ("mcdonald", "Food & Dining"),
        ("chipotle", "Food & Dining"),
        ("subway", "Food & Dining"),
        ("dunkin", "Food & Dining"),
        ("restaurant", "Food & Dining"),
        ("cafe", "Food & Dining"),
        ("coffee", "Food & Dining"),
        ("pizza", "Food & Dining"),
        ("burger", "Food & Dining"),
        ("taco", "Food & Dining"),
        ("sushi", "Food & Dining"),

        // Entertainment
        ("netflix", "Subscriptions"),
        ("spotify", "Subscriptions"),
        ("hulu", "Subscriptions"),
        ("disney", "Subscriptions"),
        ("hbo", "Subscriptions"),
        ("apple music", "Subscriptions"),
        ("youtube premium", "Subscriptions"),
        ("amc", "Entertainment"),
        ("regal", "Entertainment"),
        ("cinemark", "Entertainment"),
        ("movie", "Entertainment"),
        ("theater", "Entertainment"),
        ("concert", "Entertainment"),
        ("tickets", "Entertainment"),

        // Utilities
        ("electric", "Utilities"),
        ("water", "Utilities"),
        ("gas", "Utilities"),
        ("internet", "Utilities"),
        ("phone", "Utilities"),
        ("verizon", "Utilities"),
        ("att", "Utilities"),
        ("t-mobile", "Utilities"),
        ("comcast", "Utilities"),
        ("spectrum", "Utilities"),

        // Transportation
        ("gas station", "Transportation"),
        ("shell", "Transportation"),
        ("chevron", "Transportation"),
        ("exxon", "Transportation"),
        ("bp", "Transportation"),
        ("parking", "Transportation"),

        // Healthcare
        ("pharmacy", "Healthcare"),
        ("cvs", "Healthcare"),
        ("walgreens", "Healthcare"),
        ("doctor", "Healthcare"),
        ("hospital", "Healthcare"),
        ("dental", "Healthcare"),
        ("medical", "Healthcare"),

        // Personal Care
        ("salon", "Personal Care"),
        ("barber", "Personal Care"),
        ("spa", "Personal Care"),
        ("gym", "Personal Care"),
        ("fitness", "Personal Care"),

        // Travel
        ("airline", "Travel"),
        ("hotel", "Travel"),
        ("airbnb", "Travel"),
        ("booking.com", "Travel"),
        ("expedia", "Travel"),
        ("marriott", "Travel"),
        ("hilton", "Travel"),

        // Education
        ("university", "Education"),
        ("college", "Education"),
        ("school", "Education"),
        ("tuition", "Education"),
        ("textbook", "Education"),
        ("coursera", "Education"),
        ("udemy", "Education"),

        // Peer Payments
        ("venmo", "Peer Payment"),
        ("paypal", "Peer Payment"),
        ("zelle", "Peer Payment"),
        ("cash app", "Peer Payment"),
    ]
});

/// Get the default category for a provider
pub fn get_provider_category(provider: &str) -> Option<&'static str> {
    PROVIDER_CATEGORIES.get(provider).copied()
}

/// Get the default category based on merchant name patterns
pub fn get_merchant_category(merchant_normalized: &str) -> Option<&'static str> {
    for (pattern, category) in MERCHANT_PATTERNS.iter() {
        if merchant_normalized.contains(pattern) {
            return Some(category);
        }
    }
    None
}
