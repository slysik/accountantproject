# Accountant's Best Friend

> A browser-based expense categorization and report generator for small business owners and accountants.
> Upload your bank or credit card CSV statements — get IRS-ready expense reports in seconds.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ACCOUNTANT'S BEST FRIEND                         │
│                        (Pure Frontend Web App)                          │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
          ┌────────────────────────▼────────────────────────┐
          │                   index.html                     │
          │              (App Shell / Entry Point)           │
          └──────┬──────────────────────────────────┬────────┘
                 │                                  │
    ┌────────────▼───────────┐         ┌────────────▼───────────┐
    │      css/styles.css    │         │   External Libraries   │
    │   (UI / Layout / Theme)│         │  • SheetJS (Excel)     │
    └────────────────────────┘         │  • Google Fonts        │
                                       └────────────────────────┘
                                   │
          ┌────────────────────────▼────────────────────────┐
          │                  JavaScript Modules              │
          └─────────────────────────────────────────────────┘
                 │                 │                │
   ┌─────────────▼──┐   ┌──────────▼──────┐   ┌────▼────────────────┐
   │ categories.js  │   │expense-processor│   │     app.js          │
   │                │   │     .js         │   │  (Main Controller)  │
   │ • 25+ IRS      │   │                 │   │                     │
   │   Schedule C   │◄──│ • CSV Parser    │   │ • File Upload / DnD │
   │   categories   │   │ • Column detect │   │ • Render Dashboard  │
   │ • Keyword      │   │ • Date parser   │   │ • Filters           │
   │   matching     │   │ • Amount parser │   │ • Category editor   │
   │ • Personal     │   │ • Categorizer   │   │ • Monthly chart     │
   │   charge flags │   │ • Aggregator    │   │ • Sample data       │
   └────────────────┘   └─────────────────┘   └──────────┬──────────┘
                                                          │
                                         ┌────────────────▼────────────────┐
                                         │         Export Modules           │
                                         │                                  │
                                         │  ┌──────────┐  ┌─────────────┐  │
                                         │  │export.js │  │qbo-export.js│  │
                                         │  │          │  │             │  │
                                         │  │ • Excel  │  │ • QBO/OFX   │  │
                                         │  │   .xlsx  │  │   format    │  │
                                         │  │ • CSV    │  │ (QuickBooks │  │
                                         │  │          │  │  compatible)│  │
                                         │  └──────────┘  └─────────────┘  │
                                         └─────────────────────────────────┘


  DATA FLOW
  ─────────
  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │  CSV Upload  │────►│  Parse CSV   │────►│  Categorize  │────►│  Render UI   │
  │              │     │              │     │  (IRS Rules) │     │  Dashboard   │
  │ Drag & Drop  │     │ Auto-detect  │     │              │     │              │
  │ or Browse    │     │ bank format  │     │ 25 categories│     │ Summary Cards│
  │              │     │              │     │ + Personal   │     │ Charts       │
  │ Multi-file   │     │ Date/Amount/ │     │   Flags      │     │ Tables       │
  │ support      │     │ Desc columns │     │              │     │              │
  └──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                         │
                                                                         ▼
                                                                ┌──────────────┐
                                                                │    Export    │
                                                                │              │
                                                                │ • Excel xlsx │
                                                                │ • CSV        │
                                                                │ • QBO/OFX    │
                                                                └──────────────┘
```

---

## Features

### CSV Import
- **Drag & drop** or click-to-browse file upload
- **Multi-file support** — combine transactions from multiple accounts
- **Smart column detection** — automatically identifies Date, Description, and Amount columns from any bank format
- Supports **Chase, Bank of America, Wells Fargo, Amex, Visa, Mastercard** and custom CSV exports
- Handles both **single amount** and **debit/credit** column formats
- Multiple date format support: `MM/DD/YYYY`, `YYYY-MM-DD`, `MM-DD-YYYY`, `MM/DD/YY`

### IRS Expense Categorization
Automatically maps transactions to **25+ IRS Schedule C / Publication 535** categories using keyword matching:

| Category | Examples |
|---|---|
| Advertising | Google Ads, Facebook Ads, Mailchimp |
| Car and Truck | Gas, Uber, Parking, Oil Change |
| Contract Labor | Upwork, Fiverr, Freelancers |
| Meals (50% deductible) | Restaurants, DoorDash, Starbucks |
| Software & Subscriptions | Zoom, Adobe, AWS, Slack |
| Travel | Airlines, Hotels, Airbnb, Expedia |
| Office Expense | Office Depot, Staples, Supplies |
| Legal & Professional | CPA, Attorney, QuickBooks |
| Utilities | Verizon, Comcast, AT&T, PG&E |
| Wages | Gusto, ADP, Paychex payroll |
| Rent or Lease | WeWork, Regus, Office Rent |
| *...and 15 more* | |

### Suspected Personal Charges Detection
Automatically flags transactions that are likely personal expenses mixed into business accounts:
- Entertainment (gaming, movies, concerts, sporting events)
- Personal care (salon, spa, gym, fitness)
- Groceries and personal shopping
- Pet stores, hobby shops, vacation/resort charges

### Interactive Dashboard
- **Summary cards** — Total expenses, transaction count, months covered, top spending category
- **IRS Category Breakdown** — Visual bar chart of spending by category with percentage breakdown
- **Monthly Spending Chart** — SVG line chart showing spending trends over time
- **Month Detail Drill-Down** — Click any month to see a full category breakdown for that period
- **Suspected Personal Charges** — Grouped by month with individual transaction details
- **Full Transactions Table** — Sortable, filterable list of all transactions

### Inline Category Editing
- Change any transaction's IRS category directly in the table
- Dashboard updates in real time to reflect manual overrides

### Filtering
Filter the transaction table by:
- **IRS Category**
- **Month**
- **Source file** (when multiple CSVs are uploaded)

### Export
| Format | Contents |
|---|---|
| **Excel (.xlsx)** | 4 sheets: Summary, Monthly Breakdown, All Transactions, By Category |
| **CSV** | Flat export with Date, Description, Amount, Category |
| **QBO / OFX** | QuickBooks-compatible bank feed format |

### Sample Data
Built-in sample dataset with 30 realistic business transactions across 3 months — try the tool instantly without uploading a file.

---

## Getting Started

No installation required. This is a fully static web app.

**Run locally:**
```bash
cd accountants-best-friend
python3 -m http.server 8080
```
Then open [http://localhost:8080](http://localhost:8080) in your browser.

**Or just open directly:**
```bash
open index.html
```

---

## Project Structure

```
accountants-best-friend/
├── index.html                  # App shell and UI layout
├── css/
│   └── styles.css              # All styles and theming
├── js/
│   ├── categories.js           # IRS category definitions + keyword matching
│   ├── expense-processor.js    # CSV parsing, categorization, aggregation
│   ├── export.js               # Excel and CSV export
│   ├── qbo-export.js           # QuickBooks OFX/QBO export
│   └── app.js                  # Main app controller and UI rendering
└── sample-data/
    └── sample_transactions.csv # Sample business transactions for demo
```

---

## Supported Bank CSV Formats

| Bank | Format |
|---|---|
| Chase | Date, Description, Amount |
| Bank of America | Date, Description, Amount, Running Bal. |
| Wells Fargo | Date, Amount, *, *, Description |
| American Express | Date, Description, Amount |
| Capital One | Transaction Date, Posted Date, Card No., Description, Category, Debit, Credit |
| Custom | Any CSV with Date + Description + Amount (or Debit/Credit) columns |

---

## Tech Stack

- **Vanilla HTML / CSS / JavaScript** — zero framework dependencies
- **[SheetJS](https://sheetjs.com/)** — Excel file generation
- **Google Fonts** — Inter typeface
- Runs entirely **in the browser** — no backend, no data leaves your device

---

## License

MIT © 2024 Accountant's Best Friend
