# TODO — Email Budget

## Uncommitted Work

- [ ] Commit Gmail integration feature (13 commands, 6 Rust modules, 8 frontend files, 5 modified pages)

## Gmail Integration — Follow-Up

- [ ] Add `tauri.conf.json` allowlist for `http://localhost:8249` callback (may be needed for CSP)
- [ ] Test full OAuth flow end-to-end with real Google Cloud credentials
- [ ] Handle edge case: user closes browser during OAuth without completing consent
- [ ] Add timeout to OAuth callback server (currently waits indefinitely)
- [ ] Rate limit handling: exponential backoff instead of flat 30s retry
- [ ] Clean up `gmail_processed_messages` table periodically (older than 90 days)
- [ ] Add "last synced X minutes ago" relative time display instead of raw timestamp
- [ ] Show per-sender-filter match counts in the filter list UI
- [ ] E2E test: connect Gmail, sync, verify transactions appear

## Parsers — More Vendors

- [ ] Grubhub parser (`src-tauri/src/parser/vendors/grubhub.rs`)
- [ ] Instacart parser
- [ ] Lyft parser
- [ ] Netflix / Spotify / Apple subscription parsers
- [ ] Target / Walmart parsers
- [ ] PayPal parser
- [ ] Improve generic fallback parser accuracy

## Core Features — Not Yet Implemented

### Subscriptions
- [ ] Auto-detect recurring transactions from `recurring_patterns` table
- [ ] Subscription list view (monthly/annual cost, next expected date)
- [ ] Total subscription burden metric on dashboard

### Budgeting Enhancements
- [ ] Rollover toggle per budget category
- [ ] Budget alerts/notifications when approaching limit
- [ ] Weekly budget period support

### Transactions
- [ ] Bulk category assignment
- [ ] Merchant grouping view
- [ ] Transaction split across multiple categories
- [ ] Inline transaction editing (amount, date, notes)

### Dashboard
- [ ] Month-over-month comparison chart
- [ ] Burn rate indicator ("will I make it to end of month?")
- [ ] Anomaly detection ("this order was 3x your average")
- [ ] Spending trend sparklines

### Data & Sync
- [ ] Supabase cloud sync (backup/restore)
- [ ] CSV export
- [ ] JSON export
- [ ] Account deletion (clear all data)

## UX Polish

- [ ] Onboarding flow for first-time users
- [ ] Empty states for all pages (no transactions yet, no budgets set, etc.)
- [ ] Loading skeletons for async data fetches
- [ ] Keyboard shortcuts (Cmd+I for import, Cmd+/ for search)
- [ ] Transaction detail modal/drawer with line items
- [ ] Category icon picker component (currently raw text input)
- [ ] Responsive layout for smaller windows

## Technical Debt

- [ ] Add unit tests for parser vendors (HTML fixture files in `src-tauri/tests/fixtures/`)
- [ ] Add integration tests for DB queries with in-memory SQLite
- [ ] Add React component tests with Testing Library
- [ ] Add Playwright E2E tests for critical flows
- [ ] Code-split frontend bundle (currently 687KB, over Vite's 500KB warning)
- [ ] Add error boundary component for graceful crash recovery
- [ ] Audit `@tauri-apps/api/event` listener cleanup across all hooks
- [ ] Consider connection pooling for SQLite instead of open-per-request

## Future (v2+)

- [ ] Mobile app (iOS/Android)
- [ ] Shared household budgets
- [ ] Bill splitting / roommate expense tracking
- [ ] Savings goals with progress tracking
- [ ] AI-powered insights ("You could save $50/mo by...")
- [ ] Receipt photo scanning (OCR)
- [ ] Multi-currency support
- [ ] Outlook OAuth integration
