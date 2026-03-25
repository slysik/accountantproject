# Accountant's Best Friend

Personal expense categorization tool for self-employed professionals. Built with Next.js + React + Supabase.

## Tech Stack

- **Next.js 14+** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** (Rivian-inspired dark theme)
- **Supabase Auth** (email/password + Google Sign-in)
- **Supabase PostgreSQL** for persistent data (Row Level Security)
- **SheetJS** for Excel export

## Features

- Two-pane layout with collapsible folder tree (Year > Month)
- Drag-and-drop CSV upload with RFC 4180-compliant parsing (handles quoted fields, escaped quotes, multiline values)
- Smart column detection for various bank export formats
- IRS Schedule C expense categorization (25+ categories)
- Inline category editing
- Export to Excel, CSV, and QBO/OFX (QuickBooks-compatible debit transactions)
- Bulk import — expenses are batch-inserted in a single round-trip (chunked at 500 rows)
- Timezone-safe date handling — all dates use local noon to prevent off-by-one drift
- Canonical year/month derivation from expense dates (no mismatches between route and data)
- Trash bin with soft delete and restore
- 4-step workflow wizard (Upload → Organize → Categorize → Export)
- Responsive design with mobile sidebar overlay

## Getting Started

```bash
cd accountantproject
bun install
# Create .env.local with Supabase config (see below)
bun run dev
# Open http://localhost:3000
```

### Available Scripts

```bash
bun run dev        # Start dev server
bun run build      # Production build
bun run lint       # ESLint (next/core-web-vitals)
bun run typecheck  # TypeScript type checking
```

## Supabase Setup

1. Create a Supabase project at https://supabase.com
2. Run the SQL migration below in the SQL Editor
3. Enable Authentication providers (Email/Password is on by default, add Google if desired)
4. Copy your project config to `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

The **anon key** is found at: Supabase Dashboard → Settings → API Keys → `anon` / `public` (a long `eyJ...` JWT string).

### Database Migration

Run this in the Supabase SQL Editor:

```sql
-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  month TEXT NOT NULL,           -- "YYYY-MM" (derived from date)
  year TEXT NOT NULL,            -- "YYYY" (derived from date)
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  original_category TEXT,
  category TEXT NOT NULL,
  filename TEXT,
  raw_data JSONB,
  deleted_at TIMESTAMPTZ,       -- soft delete (null = active)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Year folders metadata
CREATE TABLE folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, year)
);

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own expenses"
  ON expenses FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can CRUD own folders"
  ON folders FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_expenses_user_month ON expenses(user_id, year, month);
CREATE INDEX idx_expenses_deleted ON expenses(user_id, deleted_at) WHERE deleted_at IS NOT NULL;
```

## Project Structure

```
accountantproject/
  src/
    app/                    # Next.js App Router pages and layouts
      dashboard/            #   Dashboard, year, month, trash, wizard pages
      login/                #   Auth page (sign in / sign up / Google)
    components/             # React UI components
      Wizard/               #   4-step import wizard (Upload, Folders, Categorize, Export)
    lib/
      supabase.ts           #   Supabase client (lazy-initialized, SSR-safe)
      auth.tsx              #   Auth context provider (Supabase Auth)
      database.ts           #   All CRUD operations (bulk insert, soft delete, folders)
      date-utils.ts         #   Timezone-safe date parsing and formatting
      expense-processor.ts  #   CSV parsing (RFC 4180), categorization, aggregation
      categories.ts         #   IRS Schedule C category definitions and keyword matching
      export.ts             #   Excel/CSV export via SheetJS
      qbo-export.ts         #   QBO/OFX export (QuickBooks-compatible)
    styles/                 # Global styles and Tailwind config
    types/                  # TypeScript type definitions
  _legacy/                  # Original vanilla JS files (archived for reference)
  public/                   # Static assets (sample CSV data)
```

### Key Design Decisions

- **Canonical date source**: Year and month are always derived from `expense.date` via `date-utils.ts`, never from route params or user input. This prevents mismatches where expenses could disappear from month views.
- **Timezone safety**: All date-only values use local noon (`new Date(y, m, d, 12, 0, 0)`) to avoid the UTC off-by-one bug where `new Date('2024-03-01')` renders as Feb 29 in US timezones.
- **Bulk inserts**: `bulkCreateExpenses()` sends expenses in a single Supabase batch (chunked at 500 rows) instead of row-by-row, making imports faster and reducing partial-failure windows.
- **QBO debit semantics**: All expenses emit `TRNTYPE=DEBIT` with negative `TRNAMT` so QuickBooks imports them as outflows, not deposits.
- **Row Level Security**: All tables have RLS policies ensuring users can only access their own data.

## Legacy Code

The original vanilla HTML/CSS/JS implementation is archived in the `_legacy/` directory for reference. The modern Next.js app in `src/` is the active codebase.
