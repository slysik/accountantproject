-- Migration 024: Payment Accounts
-- Run this in the Supabase SQL editor before using the Setup Wizard Step 2.
--
-- Creates a table to store labeled payment accounts (credit cards, bank
-- accounts, checking accounts) linked to a user and their account.
-- These labels are used during CSV import to identify which payment
-- source a statement belongs to.

CREATE TABLE IF NOT EXISTS payment_accounts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id   UUID        REFERENCES accounts(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label        TEXT        NOT NULL,
  account_type TEXT        NOT NULL DEFAULT 'credit_card',
    -- 'credit_card' | 'bank' | 'check'
  last_four    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security
ALTER TABLE payment_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own payment accounts"
  ON payment_accounts
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Index for fast lookup by user/account
CREATE INDEX IF NOT EXISTS payment_accounts_user_id_idx    ON payment_accounts (user_id);
CREATE INDEX IF NOT EXISTS payment_accounts_account_id_idx ON payment_accounts (account_id);
