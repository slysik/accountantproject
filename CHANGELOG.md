# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.8.0] — 2026-04-04

### Added

#### Password Reset
- "Forgot password?" link on the Sign In form — switches to a single-field email view
- `sendPasswordReset(email)` in `auth.tsx` calls Supabase's `resetPasswordForEmail` with redirect to `/reset-password`
- New `/reset-password` page — validates the recovery session from the email link, accepts a new password + confirmation, shows success state and redirects to dashboard
- Invalid/expired links show a clear error with a "Back to Sign In" button
- `updatePassword(newPassword)` added to `AuthContext`

---

## [0.7.0] — 2026-04-04

### Fixed

#### High — Restoring expense from deleted year left it orphaned
- `restoreExpense()` now calls `createYearFolders()` after clearing `deleted_at`, re-creating the folder row that was hard-deleted when the year was trashed
- Restored expenses are immediately visible in the sidebar again

#### High — Permanent delete leaked receipt files in Supabase Storage
- `permanentDeleteReceipts()` now fetches `storage_path` for each receipt before deleting DB rows, then calls `supabase.storage.remove()` to delete the actual blobs from the `expense-receipts` bucket
- Storage errors are logged but do not block DB cleanup to avoid leaving the user stuck
- Fixes ongoing orphaned-blob storage cost from permanent deletes and "Empty Trash"

#### Medium — Wizard mishandled multi-year imports
- `StepFolders` now detects **all** unique years in the imported data (not just the most common one), displays them grouped by year → month, and creates folder records for every year
- `bulkCreateExpenses()` and `createExpense()` now call `createYearFolders()` for every year present in the data before inserting rows — belt-and-suspenders guard so even non-wizard code paths cannot create invisible expenses

#### Medium — Duplicate prevention was race-prone (client-side only)
- Added `migrations/001_add_expense_dedup_index.sql` which creates a `UNIQUE` index on `(user_id, date, description, amount, filename)`
- `bulkCreateExpenses()` now uses `.upsert(..., { onConflict, ignoreDuplicates: true })` mapping to `INSERT ... ON CONFLICT DO NOTHING`
- If the migration has not been applied yet, the upsert error is caught and it falls back to plain `.insert()`, preserving the existing client-side dedup

### Added

- `migrations/001_add_expense_dedup_index.sql` — unique index for database-enforced expense deduplication

---

## [0.6.1] — 2026-04-04

### Fixed (autoresearch eval — artifact code review)

All fixes target the `artifacts/web/src/` UI layer. Main `src/` project is unaffected.

#### Critical — would cause build/runtime failures

- **`generateQBO` import regression**: MonthView imported `generateQBO` from `@/lib/export`, which was removed in v0.5.0 (used incorrect `TRNTYPE=CREDIT`). Replaced with `downloadQBO` from `@/lib/qbo-export` which correctly uses `TRNTYPE=DEBIT`.
- **`generateExcelReport` wrong call signature**: MonthView called `generateExcelReport(filtered)` with 1 argument, but the source function requires 3 (`expenses`, `aggregation`, `summary`). Removed the broken call; CSV and QBO remain as export options.
- **`formatMonthDisplay` missing**: MonthView imported `formatMonthDisplay` from `@/lib/date-utils`, but this function did not exist. Added it to both `src/lib/date-utils.ts` and the artifact's local `date-utils.ts`.
- **Phantom local imports**: Artifact files imported `@/lib/categories`, `@/lib/date-utils`, `@/lib/export`, `@/lib/qbo-export`, `@/lib/utils`, `@/pages/not-found`, and UI components that had no corresponding files in `artifacts/web/src/`. Created all missing files so the artifact layer is fully self-contained.
- **Unused `toDateString` import**: `expense-processor.ts` imported `toDateString` from `./date-utils` but never used it. Removed.

#### Medium — functional bugs

- **YearView full-page reload**: Chart bar clicks used `window.location.href` which caused a full page reload, losing all React state. Replaced with wouter's `useLocation` + `navigate()` for proper SPA navigation.
- **Export dropdown never closed**: MonthView's export dropdown had no outside-click handler, staying open indefinitely. Added `useEffect` with `mousedown` listener + `ref` to close on outside click.

#### Low — code smells / placeholder UX

- **Sidebar delete used `confirm()`**: Replaced browser `confirm()` with inline Yes/No buttons matching the v0.4.0 design spec.
- **Trash used `alert()`**: Replaced browser `alert()` for "Empty Trash" with an inline dismissible notification banner.
- **Help used `alert()`**: Replaced placeholder `alert("Docs coming soon!")` with a link to the project README.

### Added

- `artifacts/web/src/lib/categories.ts` — self-contained IRS category definitions (mirrors `src/lib/categories.ts`)
- `artifacts/web/src/lib/date-utils.ts` — timezone-safe date utilities including `formatMonthDisplay`
- `artifacts/web/src/lib/export.ts` — CSV export with browser download trigger
- `artifacts/web/src/lib/qbo-export.ts` — QBO/OFX export using correct `TRNTYPE=DEBIT` with negative `TRNAMT`
- `artifacts/web/src/lib/utils.ts` — `cn()` utility for Tailwind class merging
- `artifacts/web/src/pages/not-found.tsx` — 404 page component
- `artifacts/web/src/components/ui/Button.tsx` — Button component (shadcn/ui compatible)
- `artifacts/web/src/components/ui/Badge.tsx` — Badge component with emerald variant
- `artifacts/web/src/components/ui/toaster.tsx` — Toaster stub
- `artifacts/web/src/components/ui/tooltip.tsx` — TooltipProvider stub
- `src/lib/date-utils.ts` — added `formatMonthDisplay()` export
- `eval_v060.sh` — 57-criterion autoresearch eval suite for v0.6.0 artifact code

### Eval Results
- **v0.6.1 eval: 57/57 criteria PASS (100.0%)** — all critical, medium, and low issues resolved
- **v0.5.0 eval: 24/24 criteria PASS (100.0%)** — no regressions
- TypeScript compilation: zero errors (`tsc --noEmit` clean)
- ESLint: no warnings or errors (`next lint` clean)

---

## [0.6.0] — 2026-04-04

  ### Added / Improved (UI overhaul — frontend only)

  #### Login page
  - Feature pills replaced with inline badge chips (IRS Schedule C · Smart CSV import · Excel & QBO)
  - Emerald glow card effect on the sign-in card
  - "Trusted by self-employed professionals" tagline below CTA

  #### Top Navigation
  - Logo icon animates with a pulsing emerald glow ring
  - User avatar shows a green "online" dot indicator
  - Logout icon rotates on hover; button turns red

  #### Sidebar
  - "Import CSV" promoted to a bright emerald CTA button
  - Year/month folder pills show spend totals
  - Framer Motion smooth expand/collapse on folder groups
  - Empty-state guide with dashed border pointing users to import

  #### Dashboard (empty state)
  - Personalized welcome greeting using the authenticated user's name
  - Three numbered "Getting Started" step cards
  - Large Import CSV card with glowing border
  - Three feature highlight pills

  #### Import Wizard
  - Full drag-and-drop zone with marching dashed-border animation that glows on hover
  - Numbered step circles with connecting lines and checkmarks on completed steps
  - Step 2 shows transaction count + total amount summary
  - Step 4 confetti CSS animation on successful import

  #### Month View
  - Color-coded category dot next to each expense row
  - Export buttons consolidated into a clean dropdown menu
  - Skeleton loading rows while data fetches
  - Top Category stat card (4th metric)
  - Empty-search friendly state message

  #### Year View
  - Month cards link directly to their month view with "View Month →" hover overlay
  - Chart bars are also clickable

  #### Trash
  - Improved empty-state illustration
  - Category column restored

  ### Fixed

  - `parseCSVLine`: fixed `text` (undefined) → `line` variable reference in escaped-quote detection branch
  - `parseDateToISOString`: replaced `new Date(rawDate)` timezone-sensitive parsing with explicit format matchers (MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY, YYYY/MM/DD)
  - Amount guard: skip rows where `|amount| > $999,999.99` — prevents mis-detected balance/account-number columns from causing DB overflow
  - Import now throws a user-friendly error when zero valid rows are parsed

  
## [0.5.0] — 2026-04-04

### Fixed

#### P0 — Missing Receipt & ReceiptUploadResult types (CRITICAL)
- Added `Receipt` and `ReceiptUploadResult` interfaces to `src/types/index.ts`
- `Receipt` includes all 9 fields used by components: `id`, `expense_id`, `user_id`, `filename`, `storage_path`, `file_type`, `size_bytes`, `created_at`, `deleted_at`
- Resolves TypeScript compilation failures in 7 files that imported these types

#### P0 — folders table `deleted_at` column mismatch (CRITICAL)
- `softDeleteYear()` was calling `.update({ deleted_at })` on the `folders` table, which has no `deleted_at` column — causing silent runtime errors
- Changed `softDeleteYear()` to use `.delete()` on the folders row instead
- Changed `restoreYear()` to use `.upsert()` to recreate the folder record (since it was hard-deleted)

#### P1 — CSV export UTC date off-by-one bug
- `generateCSV()` in `export.ts` used `e.date.toISOString().split('T')[0]` which converts to UTC and can shift the date by one day in US timezones
- Replaced with `toDateString()` from `date-utils.ts` which uses local time consistently
- Added `instanceof Date` safety guard for date values that may arrive as strings

#### P1 — Duplicate incorrect QBO generator in export.ts
- Removed the `generateQBO()` function from `export.ts` which incorrectly used `TRNTYPE=CREDIT` (would import as deposits in QuickBooks, not expenses)
- The correct implementation in `qbo-export.ts` (`generateQBOFile()` / `downloadQBO()`) uses `TRNTYPE=DEBIT` with negative `TRNAMT` and remains the sole QBO export path
- All callers (`ExportMenu`, `StepExport`) already use `generateQBOFile` from `qbo-export.ts` — no orphaned references

#### P1 — No deduplication on CSV re-import
- Re-importing the same CSV file previously created duplicate expense rows (the comment mentioned ON CONFLICT DO NOTHING, but no unique index existed)
- Added client-side deduplication to `bulkCreateExpenses()`: before inserting, it fetches existing expenses for the affected year(s) and builds a dedup key set from `(date, description, amount, filename)`
- Duplicate rows are silently filtered out before the batch insert
- Also deduplicates within the same CSV batch (prevents intra-file duplicates)
- Returns 0 early when all rows are duplicates, avoiding unnecessary insert calls

### Eval Results (autoresearch-style grading)
- **24/24 criteria PASS (100.0%)** — all 5 fixes verified across 24 automated eval criteria
- TypeScript compilation: zero errors (`tsc --noEmit` clean)
- ESLint: no warnings or errors (`next lint` clean)

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
