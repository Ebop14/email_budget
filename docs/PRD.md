# Product Requirements Document: Email Budget

## Overview

Email Budget is a desktop application that helps recent college graduates track their spending by parsing email receipts. It extracts transaction data from uploaded HTML emails, auto-categorizes expenses, and provides a clear dashboard for budget visibility and financial health monitoring.

---

## Problem Statement

Recent college graduates struggle to track their spending across multiple services (food delivery, subscriptions, online shopping). Bank statements show transactions but lack context. Email receipts contain rich data (itemized purchases, tips, fees) but are scattered across inboxes and difficult to aggregate.

**Current pain points:**
- Manual expense tracking is tedious and abandoned quickly
- Bank categorization is often wrong ("DOORDASH*CHIPOTLE" → "Other")
- Subscription creep goes unnoticed until money is tight
- No visibility into spending patterns until it's too late

---

## Target Audience

**Primary:** Recent college graduates (22-28 years old)
- Entry-level salary, budget-conscious
- High usage of food delivery (DoorDash, Uber Eats)
- Multiple subscriptions (streaming, software, gym)
- Frequent Amazon/online shopping
- Tech-savvy but time-poor
- May share expenses with roommates

**Characteristics:**
- Comfortable with apps, expect modern UI
- Privacy-conscious (don't want to connect bank accounts)
- Need motivation/gamification to stay engaged
- Check finances weekly or monthly, not daily

---

## User Stories

### Onboarding
- As a new user, I want to select which services I use most so the app is ready to parse my receipts
- As a new user, I want to see a quick demo of what the dashboard will look like once I add data

### Importing Receipts
- As a user, I want to drag-and-drop email HTML files to import transactions
- As a user, I want to see a preview of parsed transactions before confirming import
- As a user, I want duplicate receipts to be detected and skipped automatically
- As a user, I want to bulk-import multiple receipts at once

### Categorization
- As a user, I want transactions auto-categorized based on merchant
- As a user, I want to correct a category and have future transactions from that merchant use my correction
- As a user, I want to create custom categories for my specific needs
- As a user, I want to split a single transaction across multiple categories (e.g., Costco trip with groceries + household items)

### Budgeting
- As a user, I want to set monthly budget targets for each category
- As a user, I want to see my progress against budget with clear visual indicators
- As a user, I want to choose whether unspent budget rolls over to next month
- As a user, I want alerts when I'm approaching or exceeding a budget

### Dashboard & Insights
- As a user, I want to see my total spending this month at a glance
- As a user, I want a breakdown of spending by category (chart + list)
- As a user, I want to compare this month to previous months
- As a user, I want to see my "burn rate" (will I make it to end of month?)
- As a user, I want anomaly detection ("This order was 3x your average")

### Subscriptions
- As a user, I want the app to auto-detect recurring charges
- As a user, I want a dedicated view showing all my active subscriptions
- As a user, I want to see total monthly subscription cost

### Data & Privacy
- As a user, I want my raw emails to never be stored (only extracted transaction data)
- As a user, I want my data synced to the cloud so I don't lose it
- As a user, I want to export my data (CSV/JSON) at any time
- As a user, I want to delete my account and all associated data

---

## Features

### MVP (v1.0)

#### Provider Selection & Parsing
- [ ] Onboarding flow to select top providers (checkboxes)
- [ ] Pre-built parsers for top 15 providers:
  - **Food Delivery:** DoorDash, Uber Eats, Grubhub, Instacart
  - **Rideshare:** Uber, Lyft
  - **Shopping:** Amazon, Target, Walmart
  - **Subscriptions:** Netflix, Spotify, Apple, Google Play
  - **Payments:** Venmo, PayPal
- [ ] Generic fallback parser (regex for amounts/dates)
- [ ] Drag-and-drop upload zone
- [ ] Parse preview with edit capability before confirm
- [ ] Duplicate detection via content hash

#### Transactions
- [ ] Transaction list view with search and filters
- [ ] Inline category editing
- [ ] Bulk category assignment
- [ ] Date range filtering
- [ ] Merchant grouping view

#### Categories
- [ ] 11 default categories (Housing, Groceries, Food Delivery, Dining Out, Transportation, Subscriptions, Shopping, Entertainment, Health, Income, Uncategorized)
- [ ] Custom category creation (name, icon, color)
- [ ] Category rules (merchant → category mapping)
- [ ] Auto-categorization engine with learning from corrections

#### Budgeting
- [ ] Set monthly budget per category
- [ ] Budget progress bars with color coding (green/yellow/red)
- [ ] Rollover toggle per category
- [ ] Budget vs actual summary

#### Dashboard
- [ ] Month-at-a-glance summary card
- [ ] Category breakdown donut/pie chart
- [ ] Top merchants list
- [ ] Budget health indicators
- [ ] Recent transactions feed

#### Subscriptions
- [ ] Auto-detection of recurring transactions
- [ ] Subscription list view with monthly/annual cost
- [ ] Total subscription burden metric

#### Data & Sync
- [ ] Local SQLite database
- [ ] Cloud sync to Supabase (transactions, categories, budgets only)
- [ ] Last-write-wins conflict resolution
- [ ] Data export (CSV, JSON)

### Future (v2.0+)

- [ ] OAuth email integration (Gmail, Outlook) — auto-fetch receipts
- [ ] Mobile app (iOS/Android)
- [ ] Shared household budgets
- [ ] Bill splitting / roommate expense tracking
- [ ] Savings goals with progress tracking
- [ ] Net worth tracking (if bank integration added)
- [ ] AI-powered insights ("You could save $50/mo by...")
- [ ] Receipt photo scanning (OCR for physical receipts)
- [ ] Multi-currency support

---

## Success Metrics

| Metric | Target (6 months post-launch) |
|--------|-------------------------------|
| Monthly Active Users | 1,000 |
| Receipts imported per user/month | 20+ |
| Budget set completion rate | 60% of users set at least 3 budgets |
| Retention (30-day) | 40% |
| User-reported budget accuracy | 80%+ say "accurate" or "very accurate" |

---

## Out of Scope (v1)

- Bank account integration (Plaid, etc.)
- Investment tracking
- Tax preparation features
- Multi-user/family accounts
- Mobile apps
- Browser extension
- Real-time email monitoring (OAuth)

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Email format changes break parsers | High | Version parsers, monitor for failures, quick patch process |
| Users don't have emails saved as HTML | Medium | Provide clear instructions per email client, consider .eml support |
| Auto-categorization accuracy is poor | High | Conservative defaults, easy correction UX, learn from user feedback |
| Cloud sync issues / data loss | High | Local-first architecture, SQLite is source of truth, sync is backup |
| Low engagement after initial import | Medium | Weekly email summaries, achievement badges, streak tracking |

---

## Open Questions

1. Should we support .eml files in addition to .html?
2. What's the right threshold for "anomaly" detection? (2x average? 3x?)
3. Should budget periods be configurable (weekly, bi-weekly) or just monthly?
4. Do we need an "undo" for bulk operations?

---

## Appendix: Provider Parser Priority

Based on target demographic usage patterns:

| Priority | Provider | Complexity | Notes |
|----------|----------|------------|-------|
| P0 | Amazon | High | Multiple items, tax, shipping |
| P0 | DoorDash | Medium | Tips, fees, refunds |
| P0 | Uber Eats | Medium | Similar to DoorDash |
| P0 | Uber | Low | Single transaction |
| P0 | Venmo | Medium | Inbound vs outbound |
| P1 | Spotify | Low | Subscription |
| P1 | Netflix | Low | Subscription |
| P1 | Lyft | Low | Single transaction |
| P1 | Instacart | Medium | Multiple items |
| P1 | Grubhub | Medium | Similar to DoorDash |
| P2 | Target | Medium | Multiple items |
| P2 | Walmart | Medium | Multiple items |
| P2 | Apple | Low | App store, subscriptions |
| P2 | Google Play | Low | App store, subscriptions |
| P2 | PayPal | Medium | Various transaction types |
