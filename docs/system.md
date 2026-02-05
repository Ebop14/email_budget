# System Architecture: Email Budget

This document describes the implemented system architecture, runtime behavior, and data flow of the Email Budget desktop application. It reflects the actual codebase — not aspirational features.

---

## Runtime Overview

Email Budget is a single-process desktop application built on Tauri 2.x. A native webview renders the React frontend, which communicates with a Rust backend over Tauri's IPC (`invoke`) mechanism. All state is persisted to a local SQLite database. There is no network dependency — the app works fully offline.

```
┌───────────────────────────────────────────────────────────┐
│  Native Window (Tauri)                                    │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Webview (React 19 + TypeScript)                    │  │
│  │                                                     │  │
│  │  Pages ──► Hooks ──► Stores (Zustand)               │  │
│  │                │                                    │  │
│  │                ▼                                    │  │
│  │          lib/tauri.ts                               │  │
│  │          invoke("command", {args})                  │  │
│  └────────────────┬────────────────────────────────────┘  │
│                   │ IPC (JSON serialization)               │
│  ┌────────────────▼────────────────────────────────────┐  │
│  │  Rust Backend                                       │  │
│  │                                                     │  │
│  │  commands/ ──► parser/   ──► db/queries.rs           │  │
│  │            ──► categorizer/                          │  │
│  │                     │                               │  │
│  │                     ▼                               │  │
│  │              SQLite (rusqlite)                       │  │
│  │              ~/.local/share/com.emailbudget.desktop/ │  │
│  └─────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### Process Lifecycle

1. `main.rs` calls `lib::run()`.
2. `run()` initializes the Tauri builder with the `tauri-plugin-sql` and `tauri-plugin-log` plugins.
3. During `setup`, the database is initialized asynchronously — migrations run and default categories are seeded if the `categories` table is empty.
4. The `invoke_handler` registers 16 commands spanning import, transactions, categories, budgets, dashboard, and settings.
5. The webview loads the React app from Vite's dev server (`:3000`) or the bundled `dist/` directory.

---

## Module Map

### Rust Backend (`src-tauri/src/`)

| Module | Purpose |
|--------|---------|
| `lib.rs` | Tauri builder setup, plugin registration, command handler |
| `commands/import.rs` | `import_receipts`, `confirm_import` |
| `commands/transactions.rs` | `get_transactions`, `update_transaction_category`, `delete_transaction` |
| `commands/categories.rs` | `get_categories`, `create_category`, `update_category`, `delete_category`, `get_category_spending` |
| `commands/budgets.rs` | `get_budgets`, `set_budget`, `delete_budget` |
| `commands/dashboard.rs` | `get_dashboard_stats` |
| `commands/settings.rs` | `initialize_database`, `set_merchant_category_rule` |
| `parser/engine.rs` | `parse_html` — routes HTML to vendor parsers in priority order |
| `parser/types.rs` | `ParsedTransaction`, `ParsedItem`, `ParseResult` enum |
| `parser/vendors/mod.rs` | `VendorParser` trait, shared helpers (`parse_amount`, `parse_date`, `extract_text`) |
| `parser/vendors/{vendor}.rs` | Amazon, DoorDash, Uber Eats, Uber, Venmo, Generic (fallback) |
| `categorizer/rules.rs` | `categorize_transaction` — 5-level priority cascade |
| `categorizer/defaults.rs` | `PROVIDER_CATEGORIES`, `MERCHANT_PATTERNS` static maps |
| `db/mod.rs` | `initialize`, `get_connection`, `DbError` |
| `db/schema.rs` | `run_migrations`, `seed_default_categories` |
| `db/queries.rs` | All SQL query functions, Rust model structs |

### React Frontend (`src/`)

| Module | Purpose |
|--------|---------|
| `App.tsx` | BrowserRouter with 5 routes under `Layout` |
| `pages/Dashboard.tsx` | Monthly summary, charts, top merchants |
| `pages/Transactions.tsx` | Filterable transaction list with category reassignment |
| `pages/Import.tsx` | Step-based import workflow (select → preview → done) |
| `pages/Budgets.tsx` | Budget management with progress indicators |
| `pages/Settings.tsx` | Theme toggle |
| `hooks/useTransactions.ts` | Fetch, update, delete transactions |
| `hooks/useCategories.ts` | Fetch, create, update, delete categories and spending |
| `hooks/useBudgets.ts` | Fetch, set, delete budgets |
| `hooks/useDashboard.ts` | Monthly stats with month navigation |
| `hooks/useImport.ts` | File reading, parse preview, confirm workflow |
| `stores/transactionStore.ts` | Transactions + filters (Zustand) |
| `stores/categoryStore.ts` | Categories + spending (Zustand) |
| `stores/budgetStore.ts` | Budgets (Zustand) |
| `stores/settingsStore.ts` | Theme (light/dark) |
| `lib/tauri.ts` | Typed wrappers around all 16 `invoke` calls |
| `lib/format.ts` | `formatCurrency`, `formatDate`, `formatDateRelative`, etc. |
| `lib/constants.ts` | Default providers, month names |

---

## Data Flow: Receipt Import

The import pipeline is the core of the system. It spans 3 Rust modules and 2 frontend components.

```
User drops HTML files
        │
        ▼
DropZone.tsx (reads file contents as strings)
        │
        ▼
useImport.parseFiles()
        │  invoke("import_receipts", { htmlContents: string[] })
        ▼
┌─ commands/import.rs::import_receipts ─────────────────────┐
│                                                            │
│  for each HTML string:                                     │
│    parser::parse_html(html)                                │
│      ├── AmazonParser.can_parse() / .parse()               │
│      ├── DoorDashParser.can_parse() / .parse()             │
│      ├── UberEatsParser.can_parse() / .parse()             │
│      ├── UberParser.can_parse() / .parse()                 │
│      ├── VenmoParser.can_parse() / .parse()                │
│      └── GenericParser.can_parse() / .parse()  (fallback)  │
│                                                            │
│    if Success → check source_hash for duplicates           │
│    if duplicate → increment counter                        │
│    else → add to transactions vec                          │
│                                                            │
│  return ImportPreview { transactions, duplicates, errors }  │
└────────────────────────────────────────────────────────────┘
        │
        ▼
ParsePreview.tsx (user reviews, assigns categories)
        │
        ▼
useImport.confirmImport()
        │  invoke("confirm_import", { transactions, categoryAssignments })
        ▼
┌─ commands/import.rs::confirm_import ──────────────────────┐
│                                                            │
│  for each transaction:                                     │
│    1. Compute source_hash, skip if exists                  │
│    2. Use category_assignments[index] if user specified    │
│    3. Else auto-categorize via categorizer::categorize_transaction │
│    4. Insert into transactions table                       │
│    5. Insert each ParsedItem into transaction_items table  │
│                                                            │
│  return ImportResult { imported, skipped, errors }          │
└────────────────────────────────────────────────────────────┘
```

### Parser Architecture

Each vendor parser implements the `VendorParser` trait:

```rust
pub trait VendorParser {
    fn vendor_id(&self) -> &'static str;
    fn can_parse(&self, html: &str) -> bool;  // receives lowercased HTML
    fn parse(&self, html: &str) -> ParseResult;  // receives original HTML
}
```

The engine tries parsers in fixed priority order. When `can_parse` matches, `parse` is called. If `parse` returns `Failed`, the engine continues to the next parser. `NotRecognized` also falls through. The `GenericParser` is always last and matches any HTML containing "total", "receipt", "order", "payment", or "invoice".

**Parsing strategy**: All parsers follow the same pattern:
1. Extract plain text from HTML using `scraper` crate
2. Apply regex patterns against text for amounts, dates, and merchant names
3. Fall back to HTML regex search if text extraction fails
4. Return amounts as **i64 cents** (e.g., `$18.47` → `1847`)

### Deduplication

```
source_hash = SHA256( lowercase(merchant) + "|" + amount_cents + "|" + YYYY-MM-DD )
```

Checked at two points:
1. **Preview stage** — duplicates are counted but not shown to the user
2. **Confirm stage** — re-checked before INSERT as a race condition guard

The `transactions.source_hash` column has a UNIQUE constraint.

---

## Data Flow: Auto-Categorization

The categorizer implements a 5-level priority cascade in `categorizer/rules.rs::categorize_transaction`:

```
Input: (connection, user_id, merchant_normalized, provider)

1. merchant_category_rules table (user-defined, exact match first, then pattern)
   └── found? → return category_id

2. Previous transaction with same merchant_normalized
   └── SELECT category_id FROM transactions WHERE merchant_normalized = ?
   └── found? → return category_id

3. MERCHANT_PATTERNS static map (substring match)
   └── e.g., "starbucks" ⊂ merchant → "Food & Dining"
   └── found? → look up category ID by name → return

4. PROVIDER_CATEGORIES static map
   └── e.g., "doordash" → "Food Delivery"
   └── found? → look up category ID by name → return

5. Falls back to "Uncategorized" category
```

The `MERCHANT_PATTERNS` map contains ~70 patterns covering food, shopping, entertainment, utilities, healthcare, travel, education, and peer payments.

---

## Data Flow: Dashboard

```
Dashboard.tsx
    │  useDashboard(month, year)
    │  invoke("get_dashboard_stats", { month, year })
    ▼
commands/dashboard.rs::get_dashboard_stats
    │
    ├── NaiveDate arithmetic → start_date, end_date for the month
    ├── queries::get_total_spent(start..end) → total_spent
    ├── queries::get_transaction_count(start..end) → transaction_count
    ├── queries::get_category_spending(start..end) → [{category, total, %}]
    ├── queries::get_all_budgets() → calculate_budget_health() → "good"|"warning"|"over"
    ├── queries::get_transactions(start..end, limit 5) → recent_transactions
    └── queries::get_top_merchants(start..end, limit 5) → top_merchants
    │
    ▼
DashboardStats { total_spent, transaction_count, category_count,
                 budget_health, category_spending, recent_transactions,
                 top_merchants }
```

Budget health is computed as:
- `"over"` if any budget has `spent > amount`
- `"warning"` if any budget has `percentage > 0.8` without being over
- `"good"` otherwise

---

## Database

### Engine

SQLite via `rusqlite` (bundled). The database file lives at `{app_data_dir}/email_budget.db`. Foreign keys are enabled on every connection (`PRAGMA foreign_keys = ON`).

### Schema (v1)

9 tables, 6 indexes:

```
users                     (id, email, created_at, updated_at)
categories                (id, user_id, name, icon, color, is_system, ...)
transactions              (id, user_id, category_id, merchant, merchant_normalized,
                           amount, transaction_date, provider, source_hash, notes, ...)
transaction_items         (id, transaction_id, name, quantity, unit_price, total_price)
budgets                   (id, user_id, category_id, amount, period, start_date, ...)
recurring_patterns        (id, user_id, merchant_normalized, typical_amount,
                           frequency_days, confidence, ...)  [unused]
merchant_category_rules   (id, user_id, merchant_pattern, category_id, is_exact_match, ...)
settings                  (id, user_id, key, value, ...)
selected_providers        (id, user_id, provider_id, ...)
```

**Indexes:**
- `idx_transactions_user_date` — primary query path (monthly views)
- `idx_transactions_category` — filtering by category
- `idx_transactions_source_hash` — deduplication lookups
- `idx_transactions_merchant_normalized` — categorization lookups
- `idx_budgets_user_category` — budget lookups
- `idx_merchant_rules_user` — rule lookups

### Migrations

Version-tracked via a `migrations` table. `schema.rs::run_migrations` checks current version and applies pending migrations. Currently at v1. Default user is `'local'`.

### Seed Data

15 system categories are seeded on first run: Food & Dining, Food Delivery, Transportation, Rideshare, Shopping, Entertainment, Subscriptions, Utilities, Healthcare, Personal Care, Travel, Gifts & Donations, Education, Peer Payment, Uncategorized. Each has a Lucide icon name and a distinct hex color.

---

## IPC Contract

All commands are registered in `lib.rs` and exposed through typed wrappers in `src/lib/tauri.ts`. All Rust commands return `Result<T, String>` — errors are serialized as plain strings.

| Command | Input | Output | Module |
|---------|-------|--------|--------|
| `import_receipts` | `html_contents: Vec<String>` | `ImportPreview` | import.rs |
| `confirm_import` | `transactions: Vec<ParsedTransaction>, category_assignments: HashMap<usize, String>` | `ImportResult` | import.rs |
| `get_transactions` | `filters?: TransactionFilters` | `Vec<TransactionWithCategory>` | transactions.rs |
| `update_transaction_category` | `transaction_id, category_id` | `()` | transactions.rs |
| `delete_transaction` | `transaction_id` | `()` | transactions.rs |
| `get_categories` | — | `Vec<Category>` | categories.rs |
| `create_category` | `name, icon, color` | `Category` | categories.rs |
| `update_category` | `category_id, name, icon, color` | `()` | categories.rs |
| `delete_category` | `category_id` | `()` | categories.rs |
| `get_category_spending` | `start_date, end_date` | `Vec<CategorySpending>` | categories.rs |
| `get_budgets` | — | `Vec<BudgetWithProgress>` | budgets.rs |
| `set_budget` | `category_id, amount, period` | `Budget` | budgets.rs |
| `delete_budget` | `budget_id` | `()` | budgets.rs |
| `get_dashboard_stats` | `month, year` | `DashboardStats` | dashboard.rs |
| `initialize_database` | — | `()` | settings.rs |
| `set_merchant_category_rule` | `pattern, category_id, is_exact_match` | `()` | settings.rs |

---

## Frontend State Architecture

The frontend uses a **hooks + stores** pattern. Zustand stores hold cached data; hooks wrap IPC calls and store updates.

```
Page Component
    │
    ├── useXxx() hook  ← encapsulates invoke() + store updates
    │       │
    │       ├── tauri.ts  ← typed invoke() wrapper
    │       │
    │       └── xxxStore  ← Zustand (transactions, categories, budgets, settings)
    │
    └── Renders from store state
```

### Store Shapes

**transactionStore**: `{ transactions[], filters, isLoading, error }`
**categoryStore**: `{ categories[], spending[], isLoading, error }`
**budgetStore**: `{ budgets[], isLoading, error }`
**settingsStore**: `{ theme: 'light' | 'dark' }` — persisted to `localStorage`

### Routing

React Router v7, 5 routes nested under a `Layout` component (sidebar + outlet):

| Path | Page | Description |
|------|------|-------------|
| `/` | Dashboard | Monthly overview with charts |
| `/transactions` | Transactions | Filterable list with category editing |
| `/import` | Import | Drag-and-drop receipt import workflow |
| `/budgets` | Budgets | Budget management with progress bars |
| `/settings` | Settings | Theme toggle |

---

## Key Data Types

### Rust (backend)

```rust
// parser/types.rs
struct ParsedTransaction {
    merchant: String,
    amount: i64,               // cents
    transaction_date: String,  // YYYY-MM-DD
    provider: String,
    items: Vec<ParsedItem>,
    raw_text: Option<String>,
    confidence: f64,           // 0.0–1.0
}

struct ParsedItem {
    name: String,
    quantity: i32,
    unit_price: i64,           // cents
    total_price: i64,          // cents
}

// db/queries.rs
struct TransactionWithCategory {
    // all Transaction fields plus:
    category_name: Option<String>,
    category_color: Option<String>,
    category_icon: Option<String>,
}

struct BudgetWithProgress {
    // all Budget fields plus:
    category_name: String,
    spent: i64,
    remaining: i64,
    percentage: f64,
    is_over_budget: bool,
}

struct CategorySpending {
    category_id: String,
    category_name: String,
    total: i64,
    transaction_count: i64,
    percentage: f64,
}
```

### TypeScript (frontend)

Types in `src/types/` mirror the Rust structs with camelCase naming. The `DashboardStats` interface is defined directly in `lib/tauri.ts`.

---

## Amount Handling

All monetary values are stored and transmitted as **i64 cents**. There are no floating-point dollars anywhere in the data path.

| Layer | Representation | Example |
|-------|---------------|---------|
| HTML receipt | `"$18.47"` | string |
| Parser | `1847_i64` | cents |
| Database | `1847` INTEGER | cents |
| IPC (JSON) | `1847` | number |
| Zustand store | `1847` | number |
| UI display | `formatCurrency(1847)` → `"$18.47"` | formatted string |

`parse_amount` in `parser/vendors/mod.rs` strips non-numeric characters, parses as `f64`, multiplies by 100, and rounds.

---

## Date Handling

All dates are stored as `YYYY-MM-DD` text strings. `chrono::NaiveDate` is used for arithmetic in Rust (budget period calculation, month boundaries). The parser supports 9 date formats via `parse_date`.

Frontend formatting is handled by `lib/format.ts` utilities: `formatDate` → `"Jan 15, 2024"`, `formatDateRelative` → `"Today"` / `"Yesterday"` / `"3 days ago"`.

---

## Error Handling

- Rust commands return `Result<T, String>`. Internal errors (`DbError`, `ParseResult::Failed`) are `.map_err(|e| e.to_string())` converted.
- `DbError` is a `thiserror` enum with `Sqlite`, `Io`, `NotFound`, and `Migration` variants.
- Parser failures don't halt the import — each file is processed independently, and errors are collected in `ImportPreview.errors`.
- Frontend hooks set `store.error` on failure and `store.isLoading` during async operations.

---

## Security Model

1. **No raw email storage** — HTML is parsed in memory by the Rust backend; only extracted fields are persisted.
2. **No network calls** — The app has no cloud sync implemented. All data stays on disk.
3. **Source hash is one-way** — `SHA256(merchant|amount|date)` cannot be reversed to reconstruct the original receipt.
4. **CSP is permissive** — `tauri.conf.json` sets CSP to `null` (development convenience; should be tightened for production).
5. **Foreign keys enforced** — `PRAGMA foreign_keys = ON` on every connection prevents orphaned records.

---

## What's Not Implemented

The following are scaffolded in the schema or docs but have no runtime behavior:

| Feature | Status |
|---------|--------|
| Cloud sync (Supabase) | Not implemented. No `sync/` module exists. |
| Subscription detection | `recurring_patterns` table exists but is never written to. |
| Merchant rules UI | Backend command exists (`set_merchant_category_rule`), no frontend UI. |
| Multi-user | Schema supports `user_id` on all tables, but hardcoded to `"local"` everywhere. |
| Onboarding flow | No onboarding pages implemented. |
| Data export | No export command implemented. |
| Tests | No test files exist. `vitest` is a dev dependency but unconfigured. |

---

## Dependencies

### Rust (key crates)

| Crate | Version | Purpose |
|-------|---------|---------|
| tauri | 2.10 | Desktop framework |
| rusqlite | 0.32 | SQLite driver (bundled) |
| scraper | 0.22 | HTML parsing (CSS selectors) |
| regex | 1.11 | Pattern extraction from receipt text |
| chrono | 0.4 | Date arithmetic |
| sha2 | 0.10 | Deduplication hashing |
| serde / serde_json | 1.0 | Serialization for IPC |
| uuid | 1.11 | Primary key generation |
| thiserror | 2.0 | Error type derivation |

### TypeScript (key packages)

| Package | Version | Purpose |
|---------|---------|---------|
| react | 19.2 | UI framework |
| react-router-dom | 7.3 | Client-side routing |
| zustand | 5.0 | State management |
| recharts | 2.15 | Charts (pie chart on dashboard) |
| @tauri-apps/api | 2.2 | IPC invoke |
| tailwindcss | 3.4 | Utility-first CSS |
| lucide-react | — | Icon library |
