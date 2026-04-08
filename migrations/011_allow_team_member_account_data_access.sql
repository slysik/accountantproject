-- Migration 011: Allow team members to access owner account data rows

CREATE POLICY "Team members can view companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = companies.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can insert companies" ON companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = companies.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can update companies" ON companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = companies.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can view folders" ON folders
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = folders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can insert folders" ON folders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = folders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can update folders" ON folders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = folders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can delete folders" ON folders
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = folders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can view expenses" ON expenses
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = expenses.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can insert expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = expenses.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can update expenses" ON expenses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = expenses.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can delete expenses" ON expenses
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = expenses.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can view receipts" ON receipts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = receipts.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can insert receipts" ON receipts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = receipts.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can update receipts" ON receipts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = receipts.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can delete receipts" ON receipts
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = receipts.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can view customer subfolders" ON customer_subfolders
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = customer_subfolders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can insert customer subfolders" ON customer_subfolders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = customer_subfolders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can update customer subfolders" ON customer_subfolders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = customer_subfolders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );

CREATE POLICY "Team members can delete customer subfolders" ON customer_subfolders
  FOR DELETE USING (
    EXISTS (
      SELECT 1
      FROM account_members am
      WHERE am.owner_user_id = customer_subfolders.user_id
        AND lower(am.member_email) = lower(coalesce(auth.jwt()->>'email', ''))
    )
  );
