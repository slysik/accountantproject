-- Migration 005: Formalize allowed subscription plan values
-- Run this in the Supabase SQL editor

ALTER TABLE subscriptions
  DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('trial', 'personal', 'lite', 'business', 'elite'));
