-- Migration: Add unique index for expense deduplication
--
-- Without this index, duplicate prevention relies solely on client-side
-- filtering which is race-prone under concurrent imports or retries.
-- With this index, bulkCreateExpenses uses INSERT ... ON CONFLICT DO NOTHING
-- so the database enforces uniqueness regardless of timing.
--
-- Run this against your Supabase project:
--   psql "$DATABASE_URL" -f migrations/001_add_expense_dedup_index.sql
-- Or via the Supabase SQL Editor in the dashboard.

CREATE UNIQUE INDEX IF NOT EXISTS expenses_dedup_key
  ON expenses (user_id, date, description, amount, filename);
