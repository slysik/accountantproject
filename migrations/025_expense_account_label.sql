-- Migration 025: Add payment_account_label to expenses
-- Run this in the Supabase SQL editor AFTER migration 024.
--
-- Adds a text column to expenses that records which payment account
-- (credit card, bank account, etc.) a transaction was imported from.
-- This is set at import time when the user selects an account in the
-- Import Wizard Step 1 account selector.

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS payment_account_label TEXT;

-- Optional index for filtering expenses by account
CREATE INDEX IF NOT EXISTS expenses_payment_account_label_idx
  ON expenses (user_id, payment_account_label)
  WHERE payment_account_label IS NOT NULL;
