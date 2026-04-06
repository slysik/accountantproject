-- Migration 003: Account members table for multi-user plan support

CREATE TABLE IF NOT EXISTS account_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  member_email text NOT NULL,
  member_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(owner_user_id, member_email)
);

ALTER TABLE account_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_members_owner_user_id
  ON account_members(owner_user_id);

CREATE INDEX IF NOT EXISTS idx_account_members_member_email
  ON account_members(member_email);

-- Owner can see their own members
CREATE POLICY "Owner can view their members" ON account_members
  FOR SELECT USING (auth.uid() = owner_user_id);

-- Members can see the accounts they belong to by signing in with the invited email address
CREATE POLICY "Member can view membership by email" ON account_members
  FOR SELECT USING (lower(coalesce(auth.jwt()->>'email', '')) = lower(member_email));

-- Owners can only add members when their subscription tier includes extra seats
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
          CASE
            WHEN s.plan = 'business' THEN (
              SELECT count(*)
              FROM account_members am
              WHERE am.owner_user_id = owner_user_id
            ) < 3
            WHEN s.plan = 'elite' THEN (
              SELECT count(*)
              FROM account_members am
              WHERE am.owner_user_id = owner_user_id
            ) < 19
            ELSE false
          END
        )
    )
  );

CREATE POLICY "Owner can remove members" ON account_members
  FOR DELETE USING (auth.uid() = owner_user_id);
