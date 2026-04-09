-- Migration 018: Allow team members to be restricted to selected companies

ALTER TABLE account_members
  ADD COLUMN IF NOT EXISTS access_scope text NOT NULL DEFAULT 'all';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'account_members_access_scope_check'
  ) THEN
    ALTER TABLE account_members
      ADD CONSTRAINT account_members_access_scope_check
      CHECK (access_scope IN ('all', 'selected'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS account_member_companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES account_members(id) ON DELETE CASCADE NOT NULL,
  owner_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(member_id, company_name)
);

ALTER TABLE account_member_companies ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_account_member_companies_member_id
  ON account_member_companies(member_id);

CREATE INDEX IF NOT EXISTS idx_account_member_companies_owner_company
  ON account_member_companies(owner_user_id, company_name);

CREATE OR REPLACE FUNCTION is_owner_or_team_admin(p_owner_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() = p_owner_user_id
    OR EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = p_owner_user_id
        AND am.member_user_id = auth.uid()
        AND am.role = 'admin'
    );
$$;

CREATE OR REPLACE FUNCTION member_can_access_company(p_owner_user_id uuid, p_company_name text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM account_members am
    WHERE am.owner_user_id = p_owner_user_id
      AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
      AND (
        coalesce(am.access_scope, 'all') = 'all'
        OR EXISTS (
          SELECT 1
          FROM account_member_companies amc
          WHERE amc.member_id = am.id
            AND lower(amc.company_name) = lower(p_company_name)
        )
      )
  );
$$;

DROP POLICY IF EXISTS "Owner can view their members" ON account_members;
DROP POLICY IF EXISTS "Member can view membership by email" ON account_members;
DROP POLICY IF EXISTS "Owner can add members" ON account_members;
DROP POLICY IF EXISTS "Owner can remove members" ON account_members;
DROP POLICY IF EXISTS "Owner can update members" ON account_members;
DROP POLICY IF EXISTS "Team admin can view members" ON account_members;
DROP POLICY IF EXISTS "Team admin can add members" ON account_members;
DROP POLICY IF EXISTS "Team admin can update members" ON account_members;
DROP POLICY IF EXISTS "Team admin can remove members" ON account_members;

CREATE POLICY "Owner or team admin can view members" ON account_members
  FOR SELECT USING (is_owner_or_team_admin(owner_user_id));

CREATE POLICY "Member can view membership by email" ON account_members
  FOR SELECT USING (lower(coalesce(auth.jwt()->>'email', '')) = lower(member_email));

CREATE POLICY "Owner or team admin can add members" ON account_members
  FOR INSERT WITH CHECK (
    is_owner_or_team_admin(owner_user_id)
    AND EXISTS (
      SELECT 1
      FROM subscriptions s
      WHERE s.user_id = owner_user_id
        AND s.status = 'active'
        AND s.plan IN ('business', 'elite', 'vps')
        AND (
          SELECT count(*)
          FROM account_members am
          WHERE am.owner_user_id = owner_user_id
        ) < (
          GREATEST(
            COALESCE(s.allowed_active_users, CASE
              WHEN s.plan = 'business' THEN 4
              WHEN s.plan = 'elite' THEN 20
              WHEN s.plan = 'vps' THEN 20
              ELSE 1
            END) - 1,
            0
          )
        )
    )
  );

CREATE POLICY "Owner or team admin can update members" ON account_members
  FOR UPDATE USING (is_owner_or_team_admin(owner_user_id))
  WITH CHECK (is_owner_or_team_admin(owner_user_id));

CREATE POLICY "Owner or team admin can remove members" ON account_members
  FOR DELETE USING (is_owner_or_team_admin(owner_user_id));

DROP POLICY IF EXISTS "Owner can view company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Owner can manage company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Team admin can view company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Team admin can manage company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Member can view own company access grants" ON account_member_companies;

CREATE POLICY "Owner or team admin can view company access grants" ON account_member_companies
  FOR SELECT USING (is_owner_or_team_admin(owner_user_id));

CREATE POLICY "Member can view own company access grants" ON account_member_companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.id = account_member_companies.member_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Owner or team admin can manage company access grants" ON account_member_companies
  FOR ALL USING (is_owner_or_team_admin(owner_user_id))
  WITH CHECK (is_owner_or_team_admin(owner_user_id));

DROP POLICY IF EXISTS "Team members can view companies" ON companies;
DROP POLICY IF EXISTS "Team members can insert companies" ON companies;
DROP POLICY IF EXISTS "Team members can update companies" ON companies;
DROP POLICY IF EXISTS "Team members can view folders" ON folders;
DROP POLICY IF EXISTS "Team members can insert folders" ON folders;
DROP POLICY IF EXISTS "Team members can update folders" ON folders;
DROP POLICY IF EXISTS "Team members can delete folders" ON folders;
DROP POLICY IF EXISTS "Team members can view expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can update expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can delete expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can view receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can insert receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can update receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can delete receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can view customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can insert customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can update customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can delete customer subfolders" ON customer_subfolders;

CREATE POLICY "Team members can view companies" ON companies
  FOR SELECT USING (member_can_access_company(companies.user_id, companies.name));

CREATE POLICY "Team members can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = companies.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
        AND coalesce(am.access_scope, 'all') = 'all'
    )
  );

CREATE POLICY "Team members can update companies" ON companies
  FOR UPDATE USING (member_can_access_company(companies.user_id, companies.name));

CREATE POLICY "Team members can view folders" ON folders
  FOR SELECT USING (member_can_access_company(folders.user_id, folders.company_name));

CREATE POLICY "Team members can insert folders" ON folders
  FOR INSERT WITH CHECK (member_can_access_company(folders.user_id, folders.company_name));

CREATE POLICY "Team members can update folders" ON folders
  FOR UPDATE USING (member_can_access_company(folders.user_id, folders.company_name));

CREATE POLICY "Team members can delete folders" ON folders
  FOR DELETE USING (member_can_access_company(folders.user_id, folders.company_name));

CREATE POLICY "Team members can view expenses" ON expenses
  FOR SELECT USING (member_can_access_company(expenses.user_id, expenses.company_name));

CREATE POLICY "Team members can insert expenses" ON expenses
  FOR INSERT WITH CHECK (member_can_access_company(expenses.user_id, expenses.company_name));

CREATE POLICY "Team members can update expenses" ON expenses
  FOR UPDATE USING (member_can_access_company(expenses.user_id, expenses.company_name));

CREATE POLICY "Team members can delete expenses" ON expenses
  FOR DELETE USING (member_can_access_company(expenses.user_id, expenses.company_name));

CREATE POLICY "Team members can view receipts" ON receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM expenses e
      WHERE e.id = receipts.expense_id
        AND member_can_access_company(e.user_id, e.company_name)
    )
  );

CREATE POLICY "Team members can insert receipts" ON receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM expenses e
      WHERE e.id = receipts.expense_id
        AND member_can_access_company(e.user_id, e.company_name)
    )
  );

CREATE POLICY "Team members can update receipts" ON receipts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM expenses e
      WHERE e.id = receipts.expense_id
        AND member_can_access_company(e.user_id, e.company_name)
    )
  );

CREATE POLICY "Team members can delete receipts" ON receipts
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM expenses e
      WHERE e.id = receipts.expense_id
        AND member_can_access_company(e.user_id, e.company_name)
    )
  );

CREATE POLICY "Team members can view customer subfolders" ON customer_subfolders
  FOR SELECT USING (member_can_access_company(customer_subfolders.user_id, customer_subfolders.company_name));

CREATE POLICY "Team members can insert customer subfolders" ON customer_subfolders
  FOR INSERT WITH CHECK (member_can_access_company(customer_subfolders.user_id, customer_subfolders.company_name));

CREATE POLICY "Team members can update customer subfolders" ON customer_subfolders
  FOR UPDATE USING (member_can_access_company(customer_subfolders.user_id, customer_subfolders.company_name));

CREATE POLICY "Team members can delete customer subfolders" ON customer_subfolders
  FOR DELETE USING (member_can_access_company(customer_subfolders.user_id, customer_subfolders.company_name));
