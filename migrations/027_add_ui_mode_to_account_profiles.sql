-- Migration 027: Add ui_mode preference to account_profiles

ALTER TABLE account_profiles
  ADD COLUMN IF NOT EXISTS ui_mode text NOT NULL DEFAULT 'light'
  CHECK (ui_mode IN ('light', 'dark', 'auto'));
