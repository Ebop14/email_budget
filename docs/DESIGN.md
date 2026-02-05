# Design System: Email Budget

## Design Philosophy

Email Budget targets recent college graduates who are budget-conscious but time-poor. The design should be:

1. **Calm, not alarming** — Finances are stressful. Use soft colors and encouraging language, not red alerts everywhere.
2. **Glanceable** — Key metrics visible in 2 seconds. Details available on drill-down.
3. **Modern but mature** — Clean, contemporary UI. Not gamified to the point of feeling unserious.
4. **Action-oriented** — Every screen should make the next action obvious.
5. **Honest** — Show real numbers. Don't hide overspending or sugarcoat.

---

## Color System

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Primary** | `#6366f1` (Indigo 500) | Primary actions, active states, links |
| **Primary Hover** | `#4f46e5` (Indigo 600) | Button hover states |
| **Secondary** | `#f1f5f9` (Slate 100) | Secondary buttons, backgrounds |

### Semantic Colors

| Name | Hex | Usage |
|------|-----|-------|
| **Success** | `#22c55e` (Green 500) | Under budget, positive trends, income |
| **Warning** | `#f59e0b` (Amber 500) | Approaching budget (70-90%) |
| **Danger** | `#ef4444` (Red 500) | Over budget, negative trends |
| **Info** | `#3b82f6` (Blue 500) | Informational states, tips |

### Neutral Palette

| Name | Hex | Usage |
|------|-----|-------|
| **Background** | `#ffffff` | Main background (light mode) |
| **Surface** | `#f8fafc` (Slate 50) | Cards, elevated surfaces |
| **Border** | `#e2e8f0` (Slate 200) | Dividers, card borders |
| **Text Primary** | `#0f172a` (Slate 900) | Headings, primary text |
| **Text Secondary** | `#64748b` (Slate 500) | Labels, secondary text |
| **Text Muted** | `#94a3b8` (Slate 400) | Placeholders, disabled |

### Dark Mode

| Light | Dark |
|-------|------|
| `#ffffff` (Background) | `#0f172a` (Slate 900) |
| `#f8fafc` (Surface) | `#1e293b` (Slate 800) |
| `#e2e8f0` (Border) | `#334155` (Slate 700) |
| `#0f172a` (Text Primary) | `#f8fafc` (Slate 50) |
| `#64748b` (Text Secondary) | `#94a3b8` (Slate 400) |

### Category Colors

Each category has a distinct, accessible color:

```
Housing:        #6366f1 (Indigo)
Groceries:      #22c55e (Green)
Food Delivery:  #f97316 (Orange)
Dining Out:     #eab308 (Yellow)
Transportation: #3b82f6 (Blue)
Subscriptions:  #8b5cf6 (Violet)
Shopping:       #ec4899 (Pink)
Entertainment:  #14b8a6 (Teal)
Health:         #ef4444 (Red)
Income:         #10b981 (Emerald)
Uncategorized:  #6b7280 (Gray)
```

---

## Typography

Using system font stack for performance and native feel:

```css
--font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
             "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco,
             Consolas, monospace;
```

### Type Scale

| Name | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| **Display** | 36px | 700 | 1.1 | Dashboard total |
| **H1** | 24px | 600 | 1.2 | Page titles |
| **H2** | 20px | 600 | 1.3 | Section headers |
| **H3** | 16px | 600 | 1.4 | Card titles |
| **Body** | 14px | 400 | 1.5 | Default text |
| **Small** | 12px | 400 | 1.5 | Labels, captions |
| **Tiny** | 11px | 500 | 1.4 | Badges, chips |

### Number Formatting

- **Currency**: Always show 2 decimal places (`$1,234.56`)
- **Large numbers**: Use compact notation over $10k (`$12.3k`)
- **Percentages**: No decimals unless precision needed (`67%` not `67.3%`)
- **Tabular numbers**: Use `font-variant-numeric: tabular-nums` for aligned columns

---

## Spacing

8px base unit. Use Tailwind spacing scale:

| Token | Size | Usage |
|-------|------|-------|
| `space-1` | 4px | Tight spacing (icon gaps) |
| `space-2` | 8px | Default element spacing |
| `space-3` | 12px | Related element groups |
| `space-4` | 16px | Section padding |
| `space-6` | 24px | Card padding |
| `space-8` | 32px | Section margins |
| `space-12` | 48px | Page sections |

### Layout Grid

- **Sidebar**: Fixed 240px (collapsible to 64px icons-only)
- **Main content**: Fluid, max-width 1200px
- **Dashboard grid**: 12 columns, 24px gap
- **Card grid**: Auto-fit, min 300px per card

---

## Components

### Buttons

**Primary Button**
```
Background: Primary (#6366f1)
Text: White
Padding: 10px 16px
Border Radius: 8px
Font: 14px/600
Hover: Primary Hover (#4f46e5)
Active: Scale 0.98
Disabled: Opacity 0.5
```

**Secondary Button**
```
Background: Transparent
Border: 1px solid Border (#e2e8f0)
Text: Text Primary
Hover: Background Surface (#f8fafc)
```

**Danger Button**
```
Background: Danger (#ef4444)
Text: White
Hover: #dc2626 (Red 600)
```

### Cards

```
Background: Surface (#f8fafc) / White in some contexts
Border: 1px solid Border (#e2e8f0)
Border Radius: 12px
Padding: 24px
Shadow: 0 1px 3px rgba(0,0,0,0.1)
```

**Card Header**
- Title: H3 (16px/600)
- Optional subtitle: Small/Secondary
- Optional action button aligned right

### Input Fields

```
Background: White
Border: 1px solid Border (#e2e8f0)
Border Radius: 8px
Padding: 10px 12px
Font: 14px
Focus: Border Primary, Ring 2px Primary/20%
Error: Border Danger, Ring Danger/20%
```

### Progress Bars (Budget Health)

```
Track: #e2e8f0 (Slate 200)
Height: 8px
Border Radius: 4px (full round)

Fill colors by percentage:
  0-70%:  Success (#22c55e)
  70-90%: Warning (#f59e0b)
  90%+:   Danger (#ef4444)

Animation: Width transition 300ms ease-out
```

### Badges / Chips

```
Background: Category color at 10% opacity
Text: Category color (darkened for accessibility)
Padding: 4px 8px
Border Radius: 6px
Font: 11px/500 uppercase
```

### Health Indicators

Three-state system for budget health:

| State | Icon | Color | Label |
|-------|------|-------|-------|
| Good | Checkmark circle | Success | "On track" |
| Warning | Alert triangle | Warning | "Watch it" |
| Over | X circle | Danger | "Over budget" |

---

## Iconography

Using [Lucide Icons](https://lucide.dev/) — clean, consistent, MIT licensed.

### Standard Icons

| Concept | Icon |
|---------|------|
| Dashboard | `LayoutDashboard` |
| Transactions | `Receipt` |
| Upload/Import | `Upload` |
| Budgets | `PiggyBank` |
| Subscriptions | `RefreshCw` |
| Settings | `Settings` |
| Categories | `Tags` |
| Add | `Plus` |
| Edit | `Pencil` |
| Delete | `Trash2` |
| Search | `Search` |
| Filter | `Filter` |
| Calendar | `Calendar` |
| Sync | `Cloud` |
| Export | `Download` |
| Success | `CheckCircle` |
| Warning | `AlertTriangle` |
| Error | `XCircle` |
| Info | `Info` |

### Icon Sizing

| Context | Size |
|---------|------|
| Inline with text | 16px |
| Buttons | 18px |
| Navigation | 20px |
| Empty states | 48px |
| Onboarding | 64px |

---

## Layout Patterns

### App Shell

```
┌────────────────────────────────────────────────────────┐
│  Header (drag region for Tauri)                   48px │
├──────────┬─────────────────────────────────────────────┤
│          │                                             │
│  Sidebar │              Main Content                   │
│  240px   │              (scrollable)                   │
│          │                                             │
│          │                                             │
│          │                                             │
│          │                                             │
│          │                                             │
├──────────┴─────────────────────────────────────────────┤
│  Status bar (sync status, last updated)           24px │
└────────────────────────────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Month Summary Card (full width)                 │   │
│  │  "February 2026"                                 │   │
│  │  $2,847.32 spent   |   Budget: $3,500           │   │
│  │  [============================------] 81%       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │  Category Breakdown   │  │  Budget Health        │  │
│  │  (Donut Chart)        │  │  (Progress bars)      │  │
│  │                       │  │                       │  │
│  │                       │  │  Groceries   [====] ✓ │  │
│  │       [CHART]         │  │  Food Del    [====] ! │  │
│  │                       │  │  Transport   [==]   ✓ │  │
│  │                       │  │  ...                  │  │
│  └───────────────────────┘  └───────────────────────┘  │
│                                                         │
│  ┌───────────────────────┐  ┌───────────────────────┐  │
│  │  Top Merchants        │  │  Recent Transactions  │  │
│  │                       │  │                       │  │
│  │  1. DoorDash  $234    │  │  Today                │  │
│  │  2. Amazon    $189    │  │  - Uber Eats  -$32.50 │  │
│  │  3. Uber      $87     │  │  - Spotify    -$9.99  │  │
│  │  ...                  │  │  Yesterday            │  │
│  │                       │  │  - Amazon     -$47.82 │  │
│  └───────────────────────┘  └───────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Transaction List

```
┌─────────────────────────────────────────────────────────┐
│  Transactions                              [+ Import]   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔍 Search...    │ Category ▼ │ Date Range ▼ │   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  February 2026                              $2,847.32   │
│  ─────────────────────────────────────────────────────  │
│  │ 🍔 │ DoorDash - Chipotle    │ Food Del │ -$18.47 │  │
│  │ 📦 │ Amazon - Electronics   │ Shopping │ -$89.99 │  │
│  │ 🚗 │ Uber                   │ Transpor │ -$24.50 │  │
│  │ 🔄 │ Netflix                │ Subscrip │  -$15.99│  │
│  │ 💰 │ Paycheck               │ Income   │+$2800.00│  │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  January 2026                               $3,102.88   │
│  ─────────────────────────────────────────────────────  │
│  │ ... │                                              │  │
└─────────────────────────────────────────────────────────┘
```

### Import Flow

**Step 1: Drop Zone**
```
┌─────────────────────────────────────────────────────────┐
│  Import Receipts                                        │
│                                                         │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│                                                         │
│  │         📄                                       │  │
│           Drop HTML receipt files here                  │
│  │        or click to browse                        │  │
│                                                         │
│  │        Supports: Amazon, DoorDash, Uber,         │  │
│                     and 12 more providers               │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
│                                                         │
│  Recent imports:                                        │
│  • 3 receipts imported today                           │
│  • 12 receipts imported this week                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Step 2: Preview**
```
┌─────────────────────────────────────────────────────────┐
│  Review Transactions                      [Cancel]      │
│                                                         │
│  Found 3 transactions from 2 files:                     │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✓ │ DoorDash - Chipotle │ Feb 3  │ $18.47       │   │
│  │   │ [Food Delivery ▼]   │        │              │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ✓ │ Amazon              │ Feb 2  │ $89.99       │   │
│  │   │ [Shopping ▼]        │        │              │   │
│  │   │  └─ Wireless Mouse  │        │ $29.99       │   │
│  │   │  └─ USB-C Hub       │        │ $49.99       │   │
│  │   │  └─ Tax             │        │ $10.01       │   │
│  ├─────────────────────────────────────────────────┤   │
│  │ ⚠ │ Unknown Merchant    │ Feb 1  │ $42.00       │   │
│  │   │ [Select category ▼] │        │ Low confidence│   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ⚠ 1 transaction needs review                          │
│                                                         │
│                              [Cancel]  [Import 3 items] │
└─────────────────────────────────────────────────────────┘
```

---

## Motion & Animation

### Principles

1. **Purposeful** — Animation should guide attention, not distract
2. **Quick** — Most transitions under 200ms
3. **Consistent** — Same easing across the app

### Timing

| Type | Duration | Easing |
|------|----------|--------|
| Micro (hover, active) | 100ms | `ease-out` |
| Standard (modals, dropdowns) | 150ms | `ease-out` |
| Emphasis (page transitions) | 200ms | `ease-in-out` |
| Progress bars | 300ms | `ease-out` |

### Specific Animations

**Budget Progress Bar**
- Animate width on mount (0 → actual %)
- Color transition when crossing thresholds

**Transaction Import**
- New items slide in from top
- Confirmed items fade + scale slightly

**Dashboard Stats**
- Numbers count up on load (odometer style)
- Staggered card entrance (50ms delay each)

**Drag and Drop**
- Drop zone pulses on drag-over
- Files show preview on drop

---

## Empty States

Every list view needs an empty state. Pattern:

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                         📭                              │
│                  (48px icon, muted)                     │
│                                                         │
│              No transactions yet                        │
│         (16px, Text Secondary, centered)                │
│                                                         │
│    Import your first receipt to get started             │
│         (14px, Text Muted, centered)                    │
│                                                         │
│                   [Import Receipts]                     │
│                   (Primary button)                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Empty State Copy

| Screen | Heading | Subtext | Action |
|--------|---------|---------|--------|
| Transactions | No transactions yet | Import your first receipt to get started | Import Receipts |
| Budgets | No budgets set | Set spending limits to track your goals | Create Budget |
| Subscriptions | No subscriptions found | Import more receipts to detect recurring charges | Import Receipts |
| Search results | No matches | Try a different search term | Clear Search |

---

## Onboarding Flow

### Screen 1: Welcome

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│                         💰                              │
│                                                         │
│                Welcome to Email Budget                  │
│                                                         │
│     Track your spending by importing email receipts.    │
│         No bank connections. Your data stays yours.     │
│                                                         │
│                    [Get Started]                        │
│                                                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 2: Provider Selection

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Which services do you use?                             │
│  (Select all that apply - you can change this later)    │
│                                                         │
│  Food & Delivery                                        │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ ✓      │ │ ✓      │ │        │ │        │          │
│  │🍔      │ │🍕      │ │🥡      │ │🛒      │          │
│  │DoorDash│ │UberEats│ │Grubhub │ │Instacrt│          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                         │
│  Transportation                                         │
│  ┌────────┐ ┌────────┐                                 │
│  │ ✓      │ │        │                                 │
│  │🚗      │ │🚙      │                                 │
│  │ Uber   │ │ Lyft   │                                 │
│  └────────┘ └────────┘                                 │
│                                                         │
│  Shopping                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐                     │
│  │ ✓      │ │        │ │        │                     │
│  │📦      │ │🎯      │ │🏪      │                     │
│  │ Amazon │ │ Target │ │Walmart │                     │
│  └────────┘ └────────┘ └────────┘                     │
│                                                         │
│  Subscriptions & Payments                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐          │
│  │ ✓      │ │ ✓      │ │        │ │        │          │
│  │🎵      │ │🎬      │ │💳      │ │💸      │          │
│  │Spotify │ │Netflix │ │ Apple  │ │ Venmo  │          │
│  └────────┘ └────────┘ └────────┘ └────────┘          │
│                                                         │
│                           [Continue with 6 selected]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Screen 3: Quick Tour (Optional)

Brief 3-step carousel showing:
1. How to export emails as HTML
2. The import/review flow
3. Dashboard overview

Then → Dashboard (empty state)

---

## Accessibility

### Requirements

- **Color contrast**: Minimum 4.5:1 for text, 3:1 for UI components
- **Focus indicators**: Visible focus ring on all interactive elements
- **Keyboard navigation**: Full app usable without mouse
- **Screen readers**: Proper ARIA labels, semantic HTML
- **Reduced motion**: Respect `prefers-reduced-motion`

### Focus Styles

```css
:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
```

### ARIA Patterns

| Component | Pattern |
|-----------|---------|
| Sidebar navigation | `nav` with `aria-label="Main"` |
| Transaction list | `table` with proper headers |
| Progress bars | `progressbar` with `aria-valuenow` |
| Modals | `dialog` with `aria-modal="true"` |
| Alerts | `alert` role for important messages |
| Dropdowns | `listbox` or `menu` as appropriate |

---

## Responsive Considerations

While v1 is desktop-only, design with these breakpoints in mind for future:

| Breakpoint | Width | Target |
|------------|-------|--------|
| `sm` | 640px | Mobile landscape |
| `md` | 768px | Tablet portrait |
| `lg` | 1024px | Tablet landscape, small desktop |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Large desktop |

### Mobile Adaptations (Future)

- Sidebar becomes bottom navigation
- Dashboard cards stack vertically
- Transaction list becomes card-based
- Filters move to sheet/modal

---

## Dark Mode

Implemented via Tailwind `dark:` variants. Toggle in settings, respects system preference by default.

```typescript
// Check system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Apply class to html element
document.documentElement.classList.toggle('dark', prefersDark);
```

### Dark Mode Adjustments

- Reduce brightness of category colors by 10%
- Charts use slightly desaturated colors
- Shadows become more subtle (lower opacity)
- Success/warning/danger colors remain vibrant for visibility

---

## Appendix: Figma Structure (If Applicable)

```
Email Budget Design System
├── 🎨 Foundations
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Icons
├── 🧩 Components
│   ├── Buttons
│   ├── Inputs
│   ├── Cards
│   ├── Charts
│   ├── Tables
│   └── Navigation
├── 📱 Screens
│   ├── Onboarding
│   ├── Dashboard
│   ├── Transactions
│   ├── Import
│   ├── Budgets
│   ├── Subscriptions
│   └── Settings
└── 🌙 Dark Mode
    └── (Mirrored structure)
```
