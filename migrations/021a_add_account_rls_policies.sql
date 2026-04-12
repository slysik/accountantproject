-- Migration 021a: Add account_id-based RLS policies alongside existing user_id/email policies
--
-- These new "Account: ..." policies use the account_users junction table
-- to grant access based on account membership. Postgres permissive RLS
-- uses OR logic, so these coexist with the legacy user_id policies.
--
-- IMPORTANT: Each policy includes a user_id fallback for rows where
-- account_id IS NULL (not yet migrated or created pre-migration).
-- This ensures no data becomes inaccessible after 021b drops legacy policies.

-- ============================================================
-- Helper: reusable check for active account membership
-- ============================================================
CREATE OR REPLACE FUNCTION is_account_member(p_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM account_users au
    WHERE au.account_id = p_account_id
      AND au.user_id = auth.uid()
      AND au.status = 'active'
  );
$$;

-- ============================================================
-- accounts table (new table — no user_id fallback needed)
-- ============================================================
DROP POLICY IF EXISTS "Account: users can view their accounts" ON accounts;
CREATE POLICY "Account: users can view their accounts" ON accounts
  FOR SELECT USING (is_account_member(accounts.id));

-- ============================================================
-- account_users table (new table — no user_id fallback needed)
-- ============================================================
DROP POLICY IF EXISTS "Account: members can view account users" ON account_users;
CREATE POLICY "Account: members can view account users" ON account_users
  FOR SELECT USING (is_account_member(account_users.account_id));

DROP POLICY IF EXISTS "Account: owners can insert account users" ON account_users;
CREATE POLICY "Account: owners can insert account users" ON account_users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.status = 'active'
        AND au.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Account: owners can update account users" ON account_users;
CREATE POLICY "Account: owners can update account users" ON account_users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.status = 'active'
        AND au.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS "Account: owners can delete account users" ON account_users;
CREATE POLICY "Account: owners can delete account users" ON account_users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM account_users au
      WHERE au.account_id = account_users.account_id
        AND au.user_id = auth.uid()
        AND au.status = 'active'
        AND au.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- subscriptions
-- ============================================================
DROP POLICY IF EXISTS "Account: members can view subscription" ON subscriptions;
CREATE POLICY "Account: members can view subscription" ON subscriptions
  FOR SELECT USING (
    is_account_member(subscriptions.account_id)
    OR (subscriptions.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert subscription" ON subscriptions;
CREATE POLICY "Account: members can insert subscription" ON subscriptions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR is_account_member(subscriptions.account_id)
    )
  );

DROP POLICY IF EXISTS "Account: members can update subscription" ON subscriptions;
CREATE POLICY "Account: members can update subscription" ON subscriptions
  FOR UPDATE USING (
    auth.uid() = user_id
    AND (
      account_id IS NULL
      OR is_account_member(subscriptions.account_id)
    )
  );

-- ============================================================
-- account_members
-- ============================================================
DROP POLICY IF EXISTS "Account: members can view account members" ON account_members;
CREATE POLICY "Account: members can view account members" ON account_members
  FOR SELECT USING (
    is_account_member(account_members.account_id)
    OR (account_members.account_id IS NULL AND (
      auth.uid() = owner_user_id
      OR lower(coalesce(auth.jwt()->>'email', '')) = lower(member_email)
    ))
  );

DROP POLICY IF EXISTS "Account: admins can insert account members" ON account_members;
CREATE POLICY "Account: admins can insert account members" ON account_members
  FOR INSERT WITH CHECK (
    (
      account_members.account_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_members.account_id
          AND au.user_id = auth.uid()
          AND au.status = 'active'
          AND au.role IN ('owner', 'admin')
      )
      AND EXISTS (
        SELECT 1 FROM subscriptions s
        WHERE s.account_id = account_members.account_id
          AND s.status = 'active'
          AND s.plan IN ('business', 'elite', 'vps')
      )
    )
    OR (
      account_members.account_id IS NULL
      AND auth.uid() = owner_user_id
    )
  );

DROP POLICY IF EXISTS "Account: admins can update account members" ON account_members;
CREATE POLICY "Account: admins can update account members" ON account_members
  FOR UPDATE USING (
    is_account_member(account_members.account_id)
    OR (account_members.account_id IS NULL AND auth.uid() = owner_user_id)
  );

DROP POLICY IF EXISTS "Account: admins can delete account members" ON account_members;
CREATE POLICY "Account: admins can delete account members" ON account_members
  FOR DELETE USING (
    is_account_member(account_members.account_id)
    OR (account_members.account_id IS NULL AND auth.uid() = owner_user_id)
  );

-- ============================================================
-- account_profiles
-- ============================================================
DROP POLICY IF EXISTS "Account: members can view account profile" ON account_profiles;
CREATE POLICY "Account: members can view account profile" ON account_profiles
  FOR SELECT USING (
    is_account_member(account_profiles.account_id)
    OR (account_profiles.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: admins can insert account profile" ON account_profiles;
CREATE POLICY "Account: admins can insert account profile" ON account_profiles
  FOR INSERT WITH CHECK (
    (
      account_profiles.account_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_profiles.account_id
          AND au.user_id = auth.uid()
          AND au.status = 'active'
          AND au.role IN ('owner', 'admin')
      )
    )
    OR (account_profiles.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: admins can update account profile" ON account_profiles;
CREATE POLICY "Account: admins can update account profile" ON account_profiles
  FOR UPDATE USING (
    (
      account_profiles.account_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM account_users au
        WHERE au.account_id = account_profiles.account_id
          AND au.user_id = auth.uid()
          AND au.status = 'active'
          AND au.role IN ('owner', 'admin')
      )
    )
    OR (account_profiles.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- companies
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select companies" ON companies;
CREATE POLICY "Account: members can select companies" ON companies
  FOR SELECT USING (
    is_account_member(companies.account_id)
    OR (companies.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert companies" ON companies;
CREATE POLICY "Account: members can insert companies" ON companies
  FOR INSERT WITH CHECK (
    is_account_member(companies.account_id)
    OR (companies.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update companies" ON companies;
CREATE POLICY "Account: members can update companies" ON companies
  FOR UPDATE USING (
    is_account_member(companies.account_id)
    OR (companies.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete companies" ON companies;
CREATE POLICY "Account: members can delete companies" ON companies
  FOR DELETE USING (
    is_account_member(companies.account_id)
    OR (companies.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- expenses
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select expenses" ON expenses;
CREATE POLICY "Account: members can select expenses" ON expenses
  FOR SELECT USING (
    is_account_member(expenses.account_id)
    OR (expenses.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert expenses" ON expenses;
CREATE POLICY "Account: members can insert expenses" ON expenses
  FOR INSERT WITH CHECK (
    is_account_member(expenses.account_id)
    OR (expenses.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update expenses" ON expenses;
CREATE POLICY "Account: members can update expenses" ON expenses
  FOR UPDATE USING (
    is_account_member(expenses.account_id)
    OR (expenses.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete expenses" ON expenses;
CREATE POLICY "Account: members can delete expenses" ON expenses
  FOR DELETE USING (
    is_account_member(expenses.account_id)
    OR (expenses.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- folders
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select folders" ON folders;
CREATE POLICY "Account: members can select folders" ON folders
  FOR SELECT USING (
    is_account_member(folders.account_id)
    OR (folders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert folders" ON folders;
CREATE POLICY "Account: members can insert folders" ON folders
  FOR INSERT WITH CHECK (
    is_account_member(folders.account_id)
    OR (folders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update folders" ON folders;
CREATE POLICY "Account: members can update folders" ON folders
  FOR UPDATE USING (
    is_account_member(folders.account_id)
    OR (folders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete folders" ON folders;
CREATE POLICY "Account: members can delete folders" ON folders
  FOR DELETE USING (
    is_account_member(folders.account_id)
    OR (folders.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- receipts
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select receipts" ON receipts;
CREATE POLICY "Account: members can select receipts" ON receipts
  FOR SELECT USING (
    is_account_member(receipts.account_id)
    OR (receipts.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert receipts" ON receipts;
CREATE POLICY "Account: members can insert receipts" ON receipts
  FOR INSERT WITH CHECK (
    is_account_member(receipts.account_id)
    OR (receipts.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update receipts" ON receipts;
CREATE POLICY "Account: members can update receipts" ON receipts
  FOR UPDATE USING (
    is_account_member(receipts.account_id)
    OR (receipts.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete receipts" ON receipts;
CREATE POLICY "Account: members can delete receipts" ON receipts
  FOR DELETE USING (
    is_account_member(receipts.account_id)
    OR (receipts.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- customer_subfolders
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select customer subfolders" ON customer_subfolders;
CREATE POLICY "Account: members can select customer subfolders" ON customer_subfolders
  FOR SELECT USING (
    is_account_member(customer_subfolders.account_id)
    OR (customer_subfolders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert customer subfolders" ON customer_subfolders;
CREATE POLICY "Account: members can insert customer subfolders" ON customer_subfolders
  FOR INSERT WITH CHECK (
    is_account_member(customer_subfolders.account_id)
    OR (customer_subfolders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update customer subfolders" ON customer_subfolders;
CREATE POLICY "Account: members can update customer subfolders" ON customer_subfolders
  FOR UPDATE USING (
    is_account_member(customer_subfolders.account_id)
    OR (customer_subfolders.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete customer subfolders" ON customer_subfolders;
CREATE POLICY "Account: members can delete customer subfolders" ON customer_subfolders
  FOR DELETE USING (
    is_account_member(customer_subfolders.account_id)
    OR (customer_subfolders.account_id IS NULL AND auth.uid() = user_id)
  );

-- ============================================================
-- category_mappings
-- ============================================================
DROP POLICY IF EXISTS "Account: members can select category mappings" ON category_mappings;
CREATE POLICY "Account: members can select category mappings" ON category_mappings
  FOR SELECT USING (
    is_account_member(category_mappings.account_id)
    OR (category_mappings.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can insert category mappings" ON category_mappings;
CREATE POLICY "Account: members can insert category mappings" ON category_mappings
  FOR INSERT WITH CHECK (
    is_account_member(category_mappings.account_id)
    OR (category_mappings.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can update category mappings" ON category_mappings;
CREATE POLICY "Account: members can update category mappings" ON category_mappings
  FOR UPDATE USING (
    is_account_member(category_mappings.account_id)
    OR (category_mappings.account_id IS NULL AND auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Account: members can delete category mappings" ON category_mappings;
CREATE POLICY "Account: members can delete category mappings" ON category_mappings
  FOR DELETE USING (
    is_account_member(category_mappings.account_id)
    OR (category_mappings.account_id IS NULL AND auth.uid() = user_id)
  );
