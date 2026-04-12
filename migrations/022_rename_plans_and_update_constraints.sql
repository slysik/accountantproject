-- Migration 022: Rename personal/lite plans to individual and update constraints
-- Run this in the Supabase SQL editor

-- Migrate existing rows: both 'personal' and 'lite' become 'individual'
UPDATE subscriptions SET plan = 'individual' WHERE plan IN ('personal', 'lite');

-- Drop old plan CHECK constraint and recreate with updated values
ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('trial', 'individual', 'business', 'elite', 'vps'));
