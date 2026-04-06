-- Migration 006: Add subscription expiration and allowed active-user metadata
-- Run this in the Supabase SQL editor

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS allowed_active_users integer;

UPDATE subscriptions
SET
  plan_expires_at = CASE
    WHEN plan = 'trial' THEN trial_ends_at
    WHEN plan_expires_at IS NOT NULL THEN plan_expires_at
    WHEN plan_starts_at IS NOT NULL THEN plan_starts_at + interval '30 days'
    ELSE now() + interval '30 days'
  END,
  allowed_active_users = CASE
    WHEN allowed_active_users IS NOT NULL THEN allowed_active_users
    WHEN plan = 'elite' THEN 20
    WHEN plan = 'business' THEN 4
    ELSE 1
  END;
