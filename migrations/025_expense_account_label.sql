-- Migration 025: Add payment_account_label to expenses
-- Run this in the Supabase SQL editor AFTER migration 024.
--
-- Adds a text column to expenses that records which payment account
-- (credit card, bank account, etc.) a transaction was imported from.
-- This is set at import time when the user selects an account in the
-- Import Wizard Step 1 account selector.

th