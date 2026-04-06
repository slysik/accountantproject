-- Migration 007: Make account member seat enforcement use allowed_active_users
-- Run this in the Supabase SQL editor

DROP POLICY IF EXISTS "Owner can add members" ON account_members;

CREATE POLICY "Owner can add members" ON account_members
  FOR INSERT WITH CHECK (
    auth.uid() = owner_user_id
    AND EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.user_id = owner_user_id
        AND s.status = 'active'
        AND s.plan IN ('business', 'elite')
        AND (
          SELECT count(*)
          FROM account_members am
          WHERE am.owner_user_id = owner_user_id
        ) < (
          GREATEST(
            COALESCE(s.allowed_active_users, CASE
              WHEN s.plan = 'business' THEN 4
              WHEN s.plan = 'elite' THEN 20
              ELSE 1
            END) - 1,
            0
          )
        )
    )
  );
