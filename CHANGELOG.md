# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

---

## [0.4.0] — 2026-03-29

### Added

#### Receipt Uploads per Expense
- Every expense row in the table now has a clickable receipt cell
- Rows with no receipts show a camera-plus icon to signal upload availability; rows with existing receipts show a count badge
- Clicking either opens a **Receipt Gallery modal** that combines viewing and uploading in one place
- The gallery supports drag-and-drop file upload as well as a "Upload Receipt" button in the footer
- Supported formats: JPG, PNG, WebP, PDF, DOCX, XLSX, TXT (max 50 MB per file)
- Newly uploaded receipts appear in the gallery immediately without closing the modal
- Receipts can be downloaded or soft-deleted from the gallery

#### Delete Year
- Hover over any year node in the sidebar to reveal a trash icon
- Clicking shows an inline Yes/No confirmation prompt
- Confirming soft-deletes the year folder and all its expenses (moved to trash bin, recoverable)
- If the user is currently viewing a page within that year, they are redirected to the dashboard

#### Delete Month
- Hover over any month node in the sidebar (months with expenses) to reveal a trash icon
- Same inline confirmation pattern as year delete
- A **Delete Month** button also appears in the month page header for discoverability
- Confirming soft-deletes all expenses in that month
- If the user is currently viewing that month, they are redirected to the dashboard

### Changed

- `ReceiptGallery` now manages its own internal receipts state (initialized from props) so uploads and deletes reflect instantly without requiring a parent re-fetch
- `ReceiptGallery` now requires an `expenseId` prop (used to attach uploaded files to the correct expense)
- Month page (`[year]/[month]/page.tsx`) now loads receipts for all expenses in a single extra query (`getReceiptsByExpenseIds`) after the expense fetch, and passes them down to `ExpenseTable`
- `FolderTree` imports `softDeleteYear` and `softDeleteMonth` and handles delete confirmation inline

### Fixed

- `permanentDeleteExpense` called `deleteReceiptsForExpense` which was never defined, causing a runtime error when attempting to permanently remove an expense. Fixed by inlining the correct calls to `getAllReceiptsForExpense` + `permanentDeleteReceipts`.

### Database / API

- New function `softDeleteMonth(userId, year, month)` — soft-deletes all active expenses in a month
- New function `getReceiptsByExpenseIds(userId, expenseIds[])` — fetches all non-deleted receipts for a list of expense IDs in one query; returns `Record<expenseId, Receipt[]>`

---

## [0.3.0] — 2026-03-24

### Fixed (audit findings)

- Data integrity: unique constraint on `(user_id, date, description, amount, filename)` prevents duplicate imports
- Timezone: all date-only values parsed as local noon to avoid UTC off-by-one bug
- Bulk insert: expenses batch-inserted in chunks of 500 instead of row-by-row
- QBO export: all transactions emit `TRNTYPE=DEBIT` with negative `TRNAMT` for correct QuickBooks import
- CSV parser: improved RFC 4180 compliance (quoted fields, escaped quotes, multiline values)

---

## [0.2.0] — 2026-03-24

### Added

- Next.js 14 App Router migration from legacy vanilla JS
- Supabase Auth (email/password + Google OAuth)
- Supabase PostgreSQL with Row Level Security
- Soft delete / trash bin with restore
- 4-step wizard (Upload → Organize → Categorize → Export)
- Export to Excel (multi-sheet), CSV, and QBO/OFX

---

## [0.1.0] — 2026-03-02

- Vanilla HTML/CSS/JS proof of concept (archived in `_legacy/`)
- CSV drag-and-drop, IRS category matching, basic expense table
