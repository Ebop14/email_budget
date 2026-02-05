# CLAUDE.md - Email Budget

## Project Overview

Email Budget is a Tauri desktop application that helps recent college graduates track spending by parsing email receipts. It extracts transaction data from uploaded HTML files, auto-categorizes expenses, and provides budget visibility through a dashboard.

**Key docs:**
- `docs/PRD.md` — Product requirements, user stories, feature scope
- `docs/TECH_SPEC.md` — Architecture, data models, implementation details
- `docs/DESIGN.md` — Visual design system, UI patterns, components

## Tech Stack

- **Desktop Framework**: Tauri 2.x (Rust backend)
- **Frontend**: React 18 + TypeScript 5 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **State**: Zustand
- **Local DB**: SQLite (via tauri-plugin-sql)
- **Cloud**: Supabase (PostgreSQL, future auth)

## Project Structure

```
email_budget/
├── src-tauri/           # Rust backend
│   ├── src/
│   │   ├── commands/    # Tauri IPC handlers
│   │   ├── parser/      # Receipt parsing engine
│   │   │   └── vendors/ # Per-vendor parsers
│   │   ├── categorizer/ # Auto-categorization
│   │   ├── db/          # Database layer
│   │   └── sync/        # Cloud sync
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── hooks/           # Custom React hooks
│   ├── stores/          # Zustand stores
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
└── docs/                # Documentation
```

## Development Commands

```bash
# Install dependencies
pnpm install

# Run in development mode
pnpm tauri dev

# Build for production
pnpm tauri build

# Run frontend only (for UI development)
pnpm dev

# Run Rust tests
cd src-tauri && cargo test

# Run frontend tests
pnpm test
```

## Architecture Principles

1. **Local-first**: SQLite is source of truth. App works fully offline.
2. **Privacy-preserving**: Raw HTML emails are NEVER stored. Parse in memory, discard after extraction.
3. **Sync as backup**: Cloud sync is for backup/restore only, not real-time collaboration.
4. **Parser modularity**: Each vendor has isolated parser in `src-tauri/src/parser/vendors/`.

## Code Conventions

### Rust (src-tauri)

- Use `Result<T, E>` for fallible operations, never panic in command handlers
- Parsers implement the `VendorParser` trait
- Store amounts as `i64` cents (not floats) to avoid precision issues
- Use `chrono::NaiveDate` for dates
- SQL queries go in `db/queries.rs`, not inline in commands
- Run `cargo fmt` and `cargo clippy` before commits

### TypeScript/React (src)

- Functional components with hooks only
- Custom hooks in `src/hooks/` for data fetching and state
- Zustand stores in `src/stores/` — one store per domain (transactions, categories, budgets)
- Use `@tauri-apps/api` invoke wrapper in `src/lib/tauri.ts`
- Amounts come from backend as cents — format to dollars in UI only
- Date formatting via `src/lib/format.ts` utilities

### Styling

- Tailwind utility classes, avoid custom CSS
- shadcn/ui components in `src/components/ui/`
- Color tokens defined in `tailwind.config.js`
- Dark mode support from day one (use `dark:` variants)

## Key Implementation Details

### Parsing Flow

1. User drops HTML files in upload zone
2. Frontend reads file contents, sends to Rust via `import_receipts` command
3. Rust detects vendor, routes to appropriate parser
4. Parser extracts: merchant, amount, date, items
5. Returns `ParsedTransaction[]` to frontend for preview
6. User confirms, frontend calls `confirm_import`
7. Rust saves to SQLite, raw HTML is never written to disk

### Auto-Categorization Priority

1. User overrides (`merchant_category_rules` table)
2. Exact merchant match from previous transactions
3. Pattern match (merchant contains known substring)
4. Provider-based default (DoorDash → Food Delivery)
5. Falls back to "Uncategorized"

### Deduplication

Transactions are deduplicated via `source_hash`:
```
SHA256(merchant_normalized + amount + transaction_date)
```
This prevents re-importing the same receipt without storing the raw content.

## Adding a New Vendor Parser

1. Create `src-tauri/src/parser/vendors/{vendor}.rs`
2. Implement `VendorParser` trait with `vendor_id()`, `can_parse()`, `parse()`
3. Add to vendor registry in `src-tauri/src/parser/vendors/mod.rs`
4. Add detection patterns to `src-tauri/src/parser/engine.rs`
5. Add test fixtures in `src-tauri/tests/fixtures/{vendor}/`
6. Update `SUPPORTED_PROVIDERS` in `src/types/provider.ts`

## Testing

- **Parser tests**: Unit tests with HTML fixture files per vendor
- **DB tests**: Integration tests with in-memory SQLite
- **Component tests**: React Testing Library
- **E2E**: Playwright for critical flows

Fixture files live in `src-tauri/tests/fixtures/{vendor}/*.html`

## Common Tasks

### Add a new category
1. Add to `DEFAULT_CATEGORIES` in `src/lib/constants.ts`
2. Add migration in `src-tauri/src/db/migrations/`
3. Update categorizer defaults if needed

### Add a new dashboard widget
1. Create component in `src/components/dashboard/`
2. Add query to `get_dashboard_stats` command if new data needed
3. Add to dashboard layout in `src/pages/Dashboard.tsx`

### Modify sync schema
1. Update local SQLite schema + migration
2. Update Supabase schema to match
3. Update sync logic in `src-tauri/src/sync/supabase.rs`
4. Test with fresh database

## Environment Variables

```bash
# .env.local (frontend)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxx

# src-tauri/.env (backend, if needed)
SUPABASE_SERVICE_KEY=xxx  # Only for admin operations
```

## Gotchas

- Tauri commands are async — always `await` invoke calls
- SQLite doesn't have `RETURNING *` — fetch after insert if needed
- HTML parsers are vendor-specific — when vendors change email formats, parsers break
- Amounts are cents everywhere in backend — only format to `$X.XX` in UI display
- Zustand stores persist to localStorage — clear during development if schema changes
