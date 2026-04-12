-- Migration 020: Introduce accounts as the canonical tenant entity
--
-- Adds an `accounts` table, an `account_users` junction table,
-- and backfills account_id on all existing data tables.
-- account_id columns are NULLABLE for phased migration.

-- ============================================================
-- 1. accounts table
-- ============================================================
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  created_by_user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, domain)
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- RLS policy will reference account_users; create a permissive stub
-- first, then replace after account_users exists.
-- (forward-reference workaround: use a DO block after account_users is created)

-- ============================================================
-- 2. Add account_id FK to all data tables (NULLABLE for phased migration)
-- ============================================================
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE account_members
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE account_profiles
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE folders
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE receipts
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE customer_subfolders
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

ALTER TABLE category_mappings
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES accounts(id);

-- ============================================================
-- 3. Data migration: create accounts + backfill account_id
-- ============================================================
-- For each distinct user_id in subscriptions, create an account row
-- using business_name from account_profiles (fallback to email domain,
-- then 'Unknown') and domain extracted from auth.users email.
DO $$
DECLARE
  rec RECORD;
  v_account_id uuid;
  v_name text;
  v_domain text;
  v_email text;
BEGIN
  FOR rec IN
    SELECT DISTINCT s.user_id
    FROM subscriptions s
  LOOP
    -- Derive account name: prefer business_name, then email prefix, then 'Unknown'
    SELECT ap.business_name
    INTO v_name
    FROM account_profiles ap
    WHERE ap.user_id = rec.user_id
    LIMIT 1;

    -- Get email from auth.users for domain extraction + fallback name
    SELECT u.email
    INTO v_email
    FROM auth.users u
    WHERE u.id = rec.user_id;

    -- Extract domain from email
    IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
      v_domain := split_part(v_email, '@', 2);
    ELSE
      v_domain := NULL;
    END IF;

    -- Fallback name if business_name is null/empty
    IF v_name IS NULL OR trim(v_name) = '' THEN
      IF v_email IS NOT NULL AND v_email LIKE '%@%' THEN
        v_name := split_part(v_email, '@', 1);
      ELSE
        v_name := 'Unknown';
      END IF;
    END IF;

    -- Insert the account; if name+domain already taken, disambiguate with user_id prefix
    BEGIN
      INSERT INTO accounts (name, domain, created_by_user_id)
      VALUES (v_name, v_domain, rec.user_id)
      RETURNING id INTO v_account_id;
    EXCEPTION WHEN unique_violation THEN
      -- Same business_name + domain for a different user — append user_id to make unique
      INSERT INTO accounts (name, domain, created_by_user_id)
      VALUES (v_name || ' (' || left(rec.user_id::text, 8) || ')', v_domain, rec.user_id)
      ON CONFLICT (name, domain) DO NOTHING
      RETURNING id INTO v_account_id;

      -- If still conflicted (extremely unlikely), just look it up
      IF v_account_id IS NULL THEN
        SELECT id INTO v_account_id FROM accounts WHERE created_by_user_id = rec.user_id LIMIT 1;
      END IF;
    END;

    -- Backfill account_id on all related tables for this user
    UPDATE subscriptions        SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE account_members      SET account_id = v_account_id WHERE owner_user_id = rec.user_id AND account_id IS NULL;
    UPDATE account_profiles     SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE companies            SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE expenses             SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE folders              SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE receipts             SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE customer_subfolders  SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
    UPDATE category_mappings    SET account_id = v_account_id WHERE user_id = rec.user_id AND account_id IS NULL;
  END LOOP;
END;
$$;

-- ============================================================
-- 4. account_users junction table
-- ============================================================
CREATE TABLE IF NOT EXISTS account_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'owner',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(account_id, user_id)
);

ALTER TABLE account_users ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_users_account_id
  ON account_users(account_id);

CREATE INDEX IF NOT EXISTS idx_account_users_user_id
  ON account_users(user_id);

-- Users can see account_users rows for accounts they belong to
DROP POLICY IF EXISTS "Users can view account memberships" ON account_users;
CREATE POLICY "Users can view account memberships" ON account_users
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. Populate account_users from migrated data
-- ============================================================
-- Insert creating users as 'owner'
INSERT INTO account_users (account_id, user_id, role, status)
SELECT a.id, a.created_by_user_id, 'owner', 'active'
FROM accounts a
WHERE a.created_by_user_id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- Insert account_members as 'member' role (only those with a resolved user_id)
INSERT INTO account_users (account_id, user_id, role, status)
SELECT am.account_id, am.member_user_id, 'member', 'active'
FROM account_members am
WHERE am.member_user_id IS NOT NULL
  AND am.account_id IS NOT NULL
ON CONFLICT (account_id, user_id) DO NOTHING;

-- ============================================================
-- 6. RLS policy on accounts (now that account_users exists)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view their accounts" ON accounts;
CREATE POLICY "Authenticated users can view their accounts" ON accounts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = accounts.id
        AND au.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. Indexes on all new account_id columns
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id
  ON subscriptions(account_id);

CREATE INDEX IF NOT EXISTS idx_account_members_account_id
  ON account_members(account_id);

CREATE INDEX IF NOT EXISTS idx_account_profiles_account_id
  ON account_profiles(account_id);

CREATE INDEX IF NOT EXISTS idx_companies_account_id
  ON companies(account_id);

CREATE INDEX IF NOT EXISTS idx_expenses_account_id
  ON expenses(account_id);

CREATE INDEX IF NOT EXISTS idx_folders_account_id
  ON folders(account_id);

CREATE INDEX IF NOT EXISTS idx_receipts_account_id
  ON receipts(account_id);

CREATE INDEX IF NOT EXISTS idx_customer_subfolders_account_id
  ON customer_subfolders(account_id);

CREATE INDEX IF NOT EXISTS idx_category_mappings_account_id
  ON category_mappings(account_id);
