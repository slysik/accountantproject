# Accountant's Best Friend

Personal expense categorization tool for self-employed professionals. Built with Next.js + React + Supabase.

## Tech Stack

- **Next.js 14+** (App Router)
- **React 18** with TypeScript
- **Tailwind CSS** (Rivian-inspired dark theme)
- **Supabase Auth** (email/password + Google Sign-in)
- **Supabase PostgreSQL** for persistent data
- **SheetJS** for Excel export

## Features

- Two-pane layout with collapsible folder tree (Year > Month)
- Drag-and-drop CSV upload with smart column detection
- IRS Schedule C expense categorization (25+ categories)
- Inline category editing
- Export to Excel, CSV, and QBO/OFX (QuickBooks)
- Trash bin with soft delete and restore
- 4-step workflow wizard
- Responsive design with mobile sidebar overlay

## Getting Started

```bash
cd accountantproject
bun install
# Create .env.local with Supabase config (see below)
bun run dev
# Open http://localhost:3000
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

### Database Migration

Run this in the Supabase SQL Editor:

```sql
-- Expenses table
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  month TEXT NOT NULL,
  year TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  original_category TEXT,
  category TEXT NOT NULL,
  filename TEXT,
  raw_data JSONB,
  deleted_at TIMESTAMPTZ,
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
    app/          # Next.js App Router pages and layouts
    components/   # React UI components
    lib/          # Supabase config, auth, database, utilities
    styles/       # Global styles and Tailwind config
    types/        # TypeScript type definitions
  _legacy/        # Original vanilla JS files (archived for reference)
  public/         # Static assets
```

## Legacy Code

The original vanilla HTML/CSS/JS implementation is archived in the `_legacy/` directory for reference. The modern Next.js app in `src/` is the active codebase.
