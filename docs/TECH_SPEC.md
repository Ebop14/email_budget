# Technical Specification: Email Budget

## Overview

This document describes the technical architecture, data models, and implementation details for Email Budget — a Tauri-based desktop application for tracking expenses via email receipt parsing.

---

## Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Desktop Application (Tauri)                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Frontend (React + TypeScript)                   │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │ │
│  │  │Dashboard │ │Transactions│ │ Upload  │ │ Budgets │ │ Settings │ │ │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │ │
│  └────────────────────────────────┬───────────────────────────────────┘ │
│                                   │ IPC (invoke)                        │
│  ┌────────────────────────────────▼───────────────────────────────────┐ │
│  │                      Backend (Rust)                                 │ │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │ │
│  │  │ Parser Engine│ │ Categorizer  │ │  Sync Manager │                │ │
│  │  │  (per-vendor)│ │  (rules +    │ │  (Supabase)   │                │ │
│  │  │              │ │   learning)  │ │               │                │ │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │ │
│  │                          │                   │                      │ │
│  │                          ▼                   ▼                      │ │
│  │                   ┌─────────────────────────────┐                   │ │
│  │                   │      SQLite Database        │                   │ │
│  │                   │      (Local, encrypted)     │                   │ │
│  │                   └─────────────────────────────┘                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (sync)
                                      ▼
                          ┌─────────────────────┐
                          │      Supabase       │
                          │  ┌───────────────┐  │
                          │  │  PostgreSQL   │  │
                          │  │  (backup)     │  │
                          │  └───────────────┘  │
                          │  ┌───────────────┐  │
                          │  │     Auth      │  │
                          │  │  (future)     │  │
                          │  └───────────────┘  │
                          └─────────────────────┘
```

### Design Principles

1. **Local-first**: SQLite is the source of truth. App works fully offline.
2. **Privacy-preserving**: Raw email content is never persisted. Parsed in memory, discarded.
3. **Sync as backup**: Cloud sync is for backup/restore, not real-time collaboration.
4. **Parser modularity**: Each vendor has an isolated parser. Easy to add/update.

---

## Tech Stack

| Component | Technology | Version | Rationale |
|-----------|------------|---------|-----------|
| Desktop Framework | Tauri | 2.x | Lightweight (~15MB), secure, Rust backend |
| Frontend Framework | React | 18.x | Ecosystem, component model, hooks |
| Frontend Language | TypeScript | 5.x | Type safety, better DX |
| Styling | Tailwind CSS | 3.x | Utility-first, rapid iteration |
| UI Components | shadcn/ui | latest | Accessible, customizable, not a dependency |
| Charts | Recharts | 2.x | React-native, good API |
| State Management | Zustand | 4.x | Simple, lightweight, no boilerplate |
| Backend Language | Rust | 1.75+ | Tauri requirement, performance, safety |
| Local Database | SQLite | 3.x | Via `tauri-plugin-sql` |
| Cloud Database | Supabase (PostgreSQL) | - | Free tier, auth, real-time capable |
| HTML Parsing | scraper (Rust) | 0.18+ | CSS selector based, fast |
| Build Tool | Vite | 5.x | Fast HMR, ESM native |
| Package Manager | pnpm | 8.x | Fast, disk efficient |

---

## Project Structure

```
email_budget/
├── docs/
│   ├── PRD.md
│   └── TECH_SPEC.md
├── src-tauri/                    # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs               # Tauri entry point
│   │   ├── lib.rs                # Module exports
│   │   ├── commands/             # IPC command handlers
│   │   │   ├── mod.rs
│   │   │   ├── transactions.rs
│   │   │   ├── categories.rs
│   │   │   ├── budgets.rs
│   │   │   ├── import.rs
│   │   │   └── sync.rs
│   │   ├── parser/               # Receipt parsing engine
│   │   │   ├── mod.rs
│   │   │   ├── engine.rs         # Parser orchestration
│   │   │   ├── types.rs          # ParsedTransaction, etc.
│   │   │   └── vendors/          # Per-vendor parsers
│   │   │       ├── mod.rs
│   │   │       ├── amazon.rs
│   │   │       ├── doordash.rs
│   │   │       ├── uber_eats.rs
│   │   │       ├── uber.rs
│   │   │       ├── lyft.rs
│   │   │       ├── venmo.rs
│   │   │       ├── spotify.rs
│   │   │       ├── netflix.rs
│   │   │       ├── instacart.rs
│   │   │       ├── grubhub.rs
│   │   │       ├── target.rs
│   │   │       ├── walmart.rs
│   │   │       ├── apple.rs
│   │   │       ├── google_play.rs
│   │   │       ├── paypal.rs
│   │   │       └── generic.rs    # Fallback parser
│   │   ├── categorizer/          # Auto-categorization
│   │   │   ├── mod.rs
│   │   │   ├── rules.rs          # Rule matching
│   │   │   └── defaults.rs       # Default merchant mappings
│   │   ├── db/                   # Database layer
│   │   │   ├── mod.rs
│   │   │   ├── schema.rs         # Table definitions
│   │   │   ├── migrations/       # SQL migrations
│   │   │   └── queries.rs        # Query helpers
│   │   └── sync/                 # Cloud sync
│   │       ├── mod.rs
│   │       └── supabase.rs
│   └── icons/                    # App icons
├── src/                          # React frontend
│   ├── main.tsx                  # React entry
│   ├── App.tsx                   # Root component + routing
│   ├── components/
│   │   ├── ui/                   # shadcn components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── dashboard/
│   │   │   ├── SummaryCard.tsx
│   │   │   ├── CategoryChart.tsx
│   │   │   ├── BudgetHealthBar.tsx
│   │   │   ├── TopMerchants.tsx
│   │   │   └── RecentTransactions.tsx
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionRow.tsx
│   │   │   ├── TransactionFilters.tsx
│   │   │   └── CategoryPicker.tsx
│   │   ├── import/
│   │   │   ├── DropZone.tsx
│   │   │   ├── ParsePreview.tsx
│   │   │   └── ImportProgress.tsx
│   │   ├── budgets/
│   │   │   ├── BudgetList.tsx
│   │   │   ├── BudgetEditor.tsx
│   │   │   └── BudgetProgress.tsx
│   │   ├── subscriptions/
│   │   │   ├── SubscriptionList.tsx
│   │   │   └── SubscriptionCard.tsx
│   │   ├── settings/
│   │   │   ├── ProviderSelector.tsx
│   │   │   ├── CategoryManager.tsx
│   │   │   ├── SyncStatus.tsx
│   │   │   └── ExportData.tsx
│   │   └── onboarding/
│   │       ├── Welcome.tsx
│   │       ├── ProviderPicker.tsx
│   │       └── QuickTour.tsx
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   ├── useCategories.ts
│   │   ├── useBudgets.ts
│   │   ├── useImport.ts
│   │   └── useSync.ts
│   ├── stores/
│   │   ├── transactionStore.ts
│   │   ├── categoryStore.ts
│   │   ├── budgetStore.ts
│   │   ├── settingsStore.ts
│   │   └── onboardingStore.ts
│   ├── lib/
│   │   ├── tauri.ts              # Tauri invoke wrappers
│   │   ├── format.ts             # Currency, date formatting
│   │   ├── constants.ts          # Default categories, etc.
│   │   └── utils.ts
│   ├── types/
│   │   ├── transaction.ts
│   │   ├── category.ts
│   │   ├── budget.ts
│   │   └── provider.ts
│   └── styles/
│       └── globals.css
├── public/
│   └── (static assets)
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tailwind.config.js
├── vite.config.ts
└── README.md
```

---

## Data Models

### SQLite Schema

```sql
-- Users (for future multi-device, currently single user)
CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync_at TIMESTAMP
);

-- Categories
CREATE TABLE categories (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    name TEXT NOT NULL,
    icon TEXT,                    -- emoji or icon name
    color TEXT,                   -- hex color
    is_system BOOLEAN DEFAULT 0,  -- true for defaults
    is_income BOOLEAN DEFAULT 0,  -- true for income category
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transactions
CREATE TABLE transactions (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    category_id TEXT REFERENCES categories(id),
    merchant_raw TEXT NOT NULL,       -- original merchant string
    merchant_normalized TEXT NOT NULL, -- cleaned for matching
    amount INTEGER NOT NULL,          -- cents (avoid float issues)
    currency TEXT DEFAULT 'USD',
    transaction_date DATE NOT NULL,
    description TEXT,                 -- optional notes
    source_provider TEXT,             -- 'amazon', 'doordash', etc.
    source_hash TEXT UNIQUE,          -- SHA256(merchant+amount+date) for dedup
    is_recurring BOOLEAN DEFAULT 0,
    recurring_pattern_id TEXT REFERENCES recurring_patterns(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_date ON transactions(transaction_date);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_transactions_merchant ON transactions(merchant_normalized);

-- Transaction line items (for multi-item receipts like Amazon)
CREATE TABLE transaction_items (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    transaction_id TEXT REFERENCES transactions(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount INTEGER NOT NULL,          -- cents
    quantity INTEGER DEFAULT 1,
    category_id TEXT REFERENCES categories(id)  -- for split categorization
);

-- Budgets
CREATE TABLE budgets (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    category_id TEXT REFERENCES categories(id),
    amount INTEGER NOT NULL,          -- cents
    period TEXT DEFAULT 'monthly',    -- 'monthly' only for v1
    rollover BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, category_id, period)
);

-- Recurring patterns (detected subscriptions)
CREATE TABLE recurring_patterns (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    merchant_normalized TEXT NOT NULL,
    typical_amount INTEGER,           -- cents
    frequency_days INTEGER,           -- average days between charges
    last_seen_date DATE,
    next_expected_date DATE,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Merchant category overrides (user corrections)
CREATE TABLE merchant_category_rules (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT REFERENCES users(id),
    merchant_pattern TEXT NOT NULL,   -- normalized merchant or pattern
    category_id TEXT REFERENCES categories(id),
    priority INTEGER DEFAULT 0,       -- higher = checked first
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, merchant_pattern)
);

-- User settings
CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Selected providers (for onboarding)
CREATE TABLE selected_providers (
    provider_id TEXT PRIMARY KEY,     -- 'amazon', 'doordash', etc.
    enabled BOOLEAN DEFAULT 1,
    selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync metadata
CREATE TABLE sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,        -- 'transaction', 'category', etc.
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,             -- 'create', 'update', 'delete'
    synced BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### TypeScript Types

```typescript
// src/types/transaction.ts
export interface Transaction {
  id: string;
  categoryId: string;
  merchantRaw: string;
  merchantNormalized: string;
  amount: number;            // cents
  currency: string;
  transactionDate: string;   // ISO date
  description?: string;
  sourceProvider?: string;
  isRecurring: boolean;
  items?: TransactionItem[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  quantity: number;
  categoryId?: string;
}

export interface ParsedTransaction {
  merchantRaw: string;
  merchantNormalized: string;
  amount: number;
  transactionDate: string;
  items?: ParsedItem[];
  sourceProvider: string;
  confidence: number;        // 0-1, parser confidence
  suggestedCategoryId?: string;
}

// src/types/category.ts
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isSystem: boolean;
  isIncome: boolean;
  sortOrder: number;
}

// src/types/budget.ts
export interface Budget {
  id: string;
  categoryId: string;
  amount: number;            // cents
  period: 'monthly';
  rollover: boolean;
  spent?: number;            // calculated field
  remaining?: number;        // calculated field
}

// src/types/provider.ts
export interface Provider {
  id: string;
  name: string;
  icon: string;
  category: 'food_delivery' | 'rideshare' | 'shopping' | 'subscription' | 'payment';
  supported: boolean;
  parseComplexity: 'low' | 'medium' | 'high';
}

export const SUPPORTED_PROVIDERS: Provider[] = [
  { id: 'amazon', name: 'Amazon', icon: '📦', category: 'shopping', supported: true, parseComplexity: 'high' },
  { id: 'doordash', name: 'DoorDash', icon: '🍔', category: 'food_delivery', supported: true, parseComplexity: 'medium' },
  // ... etc
];
```

---

## Parser Engine

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Parser Engine                            │
│                                                              │
│   Input: Raw HTML string                                     │
│                                                              │
│   ┌─────────────┐     ┌─────────────────────────────────┐   │
│   │  Detector   │────▶│  Which vendor is this email?    │   │
│   │             │     │  (check sender, HTML patterns)  │   │
│   └─────────────┘     └──────────────┬──────────────────┘   │
│                                      │                       │
│                                      ▼                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              Vendor Router                           │   │
│   │  amazon.rs | doordash.rs | uber.rs | ... | generic  │   │
│   └─────────────────────────────────┬───────────────────┘   │
│                                      │                       │
│                                      ▼                       │
│   ┌─────────────────────────────────────────────────────┐   │
│   │              ParsedTransaction                       │   │
│   │  { merchant, amount, date, items[], confidence }     │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   Output: ParsedTransaction (raw HTML discarded)             │
└─────────────────────────────────────────────────────────────┘
```

### Vendor Detection

```rust
// src-tauri/src/parser/engine.rs

pub fn detect_vendor(html: &str) -> Option<&'static str> {
    // Check for vendor-specific patterns in order of specificity
    let checks: Vec<(&str, &[&str])> = vec![
        ("amazon", &["amazon.com", "Your Amazon.com order", "ship-track"]),
        ("doordash", &["doordash.com", "DoorDash", "Your order from"]),
        ("uber_eats", &["uber.com", "Uber Eats", "Your Uber Eats order"]),
        ("uber", &["uber.com", "Thanks for riding", "Trip with Uber"]),
        ("lyft", &["lyft.com", "Lyft", "Your ride with"]),
        ("venmo", &["venmo.com", "Venmo", "paid you", "You paid"]),
        ("spotify", &["spotify.com", "Spotify", "Premium"]),
        ("netflix", &["netflix.com", "Netflix", "membership"]),
        ("instacart", &["instacart.com", "Instacart"]),
        ("grubhub", &["grubhub.com", "Grubhub"]),
        ("target", &["target.com", "Target"]),
        ("walmart", &["walmart.com", "Walmart"]),
        ("apple", &["apple.com", "App Store", "Apple"]),
        ("google_play", &["google.com", "Google Play"]),
        ("paypal", &["paypal.com", "PayPal"]),
    ];

    for (vendor, patterns) in checks {
        if patterns.iter().any(|p| html.contains(p)) {
            return Some(vendor);
        }
    }
    None
}
```

### Parser Trait

```rust
// src-tauri/src/parser/types.rs

use chrono::NaiveDate;

#[derive(Debug, Clone, Serialize)]
pub struct ParsedTransaction {
    pub merchant_raw: String,
    pub merchant_normalized: String,
    pub amount: i64,                    // cents
    pub transaction_date: NaiveDate,
    pub items: Vec<ParsedItem>,
    pub source_provider: String,
    pub confidence: f32,                // 0.0 - 1.0
}

#[derive(Debug, Clone, Serialize)]
pub struct ParsedItem {
    pub description: String,
    pub amount: i64,
    pub quantity: i32,
}

pub trait VendorParser: Send + Sync {
    fn vendor_id(&self) -> &'static str;
    fn parse(&self, html: &str) -> Result<ParsedTransaction, ParseError>;
    fn can_parse(&self, html: &str) -> bool;
}
```

### Example: DoorDash Parser

```rust
// src-tauri/src/parser/vendors/doordash.rs

use scraper::{Html, Selector};
use super::{VendorParser, ParsedTransaction, ParsedItem, ParseError};

pub struct DoorDashParser;

impl VendorParser for DoorDashParser {
    fn vendor_id(&self) -> &'static str {
        "doordash"
    }

    fn can_parse(&self, html: &str) -> bool {
        html.contains("doordash.com") || html.contains("DoorDash")
    }

    fn parse(&self, html: &str) -> Result<ParsedTransaction, ParseError> {
        let document = Html::parse_document(html);

        // Extract restaurant name
        let restaurant_selector = Selector::parse(r#"[class*="restaurant"], [class*="merchant"]"#).unwrap();
        let merchant_raw = document
            .select(&restaurant_selector)
            .next()
            .map(|el| el.text().collect::<String>().trim().to_string())
            .unwrap_or_else(|| "DoorDash Order".to_string());

        // Extract total amount
        let total_selector = Selector::parse(r#"[class*="total"], [class*="Total"]"#).unwrap();
        let amount = extract_amount(&document, &total_selector)?;

        // Extract date
        let date_selector = Selector::parse(r#"[class*="date"], [class*="Date"]"#).unwrap();
        let transaction_date = extract_date(&document, &date_selector)?;

        // Extract items
        let items = extract_items(&document)?;

        Ok(ParsedTransaction {
            merchant_raw: merchant_raw.clone(),
            merchant_normalized: normalize_merchant(&merchant_raw),
            amount,
            transaction_date,
            items,
            source_provider: "doordash".to_string(),
            confidence: 0.9,
        })
    }
}
```

---

## Auto-Categorization

### Rule Priority

1. **User overrides** — `merchant_category_rules` table, highest priority
2. **Exact merchant match** — Previous transaction from same merchant
3. **Pattern match** — Merchant contains known substring
4. **Provider default** — DoorDash → Food Delivery, Uber → Transportation
5. **Uncategorized** — Fallback

### Implementation

```rust
// src-tauri/src/categorizer/rules.rs

pub struct Categorizer {
    user_rules: Vec<MerchantRule>,
    default_rules: Vec<MerchantRule>,
}

impl Categorizer {
    pub fn categorize(&self, merchant_normalized: &str, provider: &str) -> Option<String> {
        // 1. Check user rules first
        for rule in &self.user_rules {
            if merchant_normalized.contains(&rule.pattern) {
                return Some(rule.category_id.clone());
            }
        }

        // 2. Check default merchant mappings
        for rule in &self.default_rules {
            if merchant_normalized.contains(&rule.pattern) {
                return Some(rule.category_id.clone());
            }
        }

        // 3. Fall back to provider-based categorization
        match provider {
            "doordash" | "uber_eats" | "grubhub" | "instacart" => Some(FOOD_DELIVERY_ID),
            "uber" | "lyft" => Some(TRANSPORTATION_ID),
            "spotify" | "netflix" | "apple" | "google_play" => Some(SUBSCRIPTIONS_ID),
            "amazon" | "target" | "walmart" => Some(SHOPPING_ID),
            "venmo" | "paypal" => None,  // Could be anything
            _ => None,
        }
    }

    pub fn learn_from_correction(&mut self, merchant_normalized: &str, category_id: &str) {
        // Add to user rules for future matches
        self.user_rules.insert(0, MerchantRule {
            pattern: merchant_normalized.to_string(),
            category_id: category_id.to_string(),
            priority: 100,
        });
    }
}
```

---

## Cloud Sync

### Strategy

- **Direction**: Local → Cloud (push), Cloud → Local (pull on new device)
- **Conflict resolution**: Last-write-wins based on `updated_at`
- **Sync scope**: transactions, categories, budgets, merchant_rules, settings
- **Not synced**: Raw HTML, sync_log (local bookkeeping)

### Supabase Schema

```sql
-- Mirrors local schema with user auth
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE transactions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    -- ... same fields as local
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own transactions"
    ON transactions FOR ALL
    USING (auth.uid() = user_id);
```

### Sync Flow

```
┌─────────────┐                              ┌─────────────┐
│   Local DB  │                              │  Supabase   │
└──────┬──────┘                              └──────┬──────┘
       │                                            │
       │  1. On change, write to sync_log           │
       │  2. Background job checks sync_log         │
       │  3. Push pending changes ─────────────────▶│
       │                                            │
       │  4. On app start or manual refresh         │
       │◀─────────────────── Pull latest ───────────│
       │                                            │
       │  5. Merge with last-write-wins             │
       │                                            │
```

---

## IPC Commands (Tauri)

```rust
// src-tauri/src/commands/mod.rs

#[tauri::command]
async fn import_receipts(html_contents: Vec<String>) -> Result<Vec<ParsedTransaction>, String>;

#[tauri::command]
async fn confirm_import(transactions: Vec<ParsedTransaction>) -> Result<Vec<Transaction>, String>;

#[tauri::command]
async fn get_transactions(filters: TransactionFilters) -> Result<Vec<Transaction>, String>;

#[tauri::command]
async fn update_transaction_category(id: String, category_id: String) -> Result<(), String>;

#[tauri::command]
async fn get_categories() -> Result<Vec<Category>, String>;

#[tauri::command]
async fn create_category(category: NewCategory) -> Result<Category, String>;

#[tauri::command]
async fn get_budgets() -> Result<Vec<Budget>, String>;

#[tauri::command]
async fn set_budget(category_id: String, amount: i64, rollover: bool) -> Result<Budget, String>;

#[tauri::command]
async fn get_dashboard_stats(month: String) -> Result<DashboardStats, String>;

#[tauri::command]
async fn get_subscriptions() -> Result<Vec<Subscription>, String>;

#[tauri::command]
async fn sync_to_cloud() -> Result<SyncResult, String>;

#[tauri::command]
async fn get_selected_providers() -> Result<Vec<String>, String>;

#[tauri::command]
async fn set_selected_providers(provider_ids: Vec<String>) -> Result<(), String>;

#[tauri::command]
async fn export_data(format: ExportFormat) -> Result<String, String>;
```

---

## Security Considerations

1. **No raw email storage**: HTML is parsed in memory, only extracted fields persisted
2. **Local encryption**: SQLite database encrypted at rest (sqlcipher or Tauri secure storage)
3. **Supabase RLS**: Row-level security ensures users only access own data
4. **No secrets in code**: Supabase keys stored in environment / secure config
5. **Input sanitization**: HTML parsing uses safe libraries, no eval/innerHTML
6. **Source hash**: Uses SHA-256, not reversible to original content

---

## Performance Considerations

1. **Parser execution**: Run in Rust, not JS — handles large emails quickly
2. **Batch imports**: Process multiple files in parallel with `rayon`
3. **Lazy loading**: Transaction list uses virtual scrolling for large datasets
4. **Indexed queries**: SQLite indexes on date, category, merchant
5. **Debounced sync**: Don't sync on every change, batch with 5s debounce

---

## Testing Strategy

| Layer | Approach |
|-------|----------|
| Parsers | Unit tests with fixture HTML files per vendor |
| Categorizer | Unit tests with known merchant → category mappings |
| Database | Integration tests with in-memory SQLite |
| Commands | Integration tests via Tauri test harness |
| Frontend | Component tests with React Testing Library |
| E2E | Playwright for critical flows (import, categorize, budget) |

### Parser Test Fixtures

```
src-tauri/tests/fixtures/
├── amazon/
│   ├── single_item.html
│   ├── multiple_items.html
│   └── with_refund.html
├── doordash/
│   ├── standard_order.html
│   └── with_tip.html
├── uber/
│   └── ride_receipt.html
└── ...
```

---

## Deployment

### Desktop Builds

```bash
# Development
pnpm tauri dev

# Production builds
pnpm tauri build --target universal-apple-darwin  # macOS
pnpm tauri build --target x86_64-pc-windows-msvc  # Windows
pnpm tauri build --target x86_64-unknown-linux-gnu # Linux
```

### Auto-update

Tauri supports auto-update via signed releases. Configure in `tauri.conf.json`:

```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": ["https://releases.emailbudget.app/{{target}}/{{current_version}}"],
      "dialog": true,
      "pubkey": "..."
    }
  }
}
```

---

## Milestones

### M1: Foundation (Week 1-2)
- [ ] Tauri project setup with React frontend
- [ ] SQLite database with migrations
- [ ] Basic UI shell (layout, navigation)
- [ ] Provider selection onboarding

### M2: Parsing (Week 3-4)
- [ ] Parser engine architecture
- [ ] Top 5 vendor parsers (Amazon, DoorDash, Uber Eats, Uber, Venmo)
- [ ] Generic fallback parser
- [ ] Import flow UI (drag-drop, preview, confirm)

### M3: Core Features (Week 5-6)
- [ ] Transaction list with filtering
- [ ] Category management
- [ ] Auto-categorization engine
- [ ] Dashboard with charts

### M4: Budgeting (Week 7)
- [ ] Budget CRUD
- [ ] Budget progress visualization
- [ ] Subscription detection

### M5: Polish & Sync (Week 8)
- [ ] Supabase integration
- [ ] Sync implementation
- [ ] Data export
- [ ] Testing & bug fixes

---

## Appendix: Default Categories

```typescript
export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Housing', icon: '🏠', color: '#6366f1', isSystem: true, isIncome: false, sortOrder: 0 },
  { name: 'Groceries', icon: '🛒', color: '#22c55e', isSystem: true, isIncome: false, sortOrder: 1 },
  { name: 'Food Delivery', icon: '🍔', color: '#f97316', isSystem: true, isIncome: false, sortOrder: 2 },
  { name: 'Dining Out', icon: '🍽️', color: '#eab308', isSystem: true, isIncome: false, sortOrder: 3 },
  { name: 'Transportation', icon: '🚗', color: '#3b82f6', isSystem: true, isIncome: false, sortOrder: 4 },
  { name: 'Subscriptions', icon: '🔄', color: '#8b5cf6', isSystem: true, isIncome: false, sortOrder: 5 },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899', isSystem: true, isIncome: false, sortOrder: 6 },
  { name: 'Entertainment', icon: '🎮', color: '#14b8a6', isSystem: true, isIncome: false, sortOrder: 7 },
  { name: 'Health', icon: '💊', color: '#ef4444', isSystem: true, isIncome: false, sortOrder: 8 },
  { name: 'Income', icon: '💰', color: '#10b981', isSystem: true, isIncome: true, sortOrder: 9 },
  { name: 'Uncategorized', icon: '❓', color: '#6b7280', isSystem: true, isIncome: false, sortOrder: 10 },
];
```
