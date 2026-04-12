-- Run this migration ONLY after verifying 021a policies work correctly in staging
--
-- Migration 021b: Drop legacy user_id-based and email-match-based RLS policies
--
-- These policies are replaced by the account_id-based "Account: ..." policies
-- from migration 021a. All access is now scoped through account_users membership.

-- ============================================================
-- subscriptions (from 002_add_subscriptions.sql)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can insert own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Users can update own subscription" ON subscriptions;

-- ============================================================
-- account_members (from 003, 007, 014, 018)
-- ============================================================
-- Legacy owner/email-based policies (current versions from 018)
DROP POLICY IF EXISTS "Owner or team admin can view members" ON account_members;
DROP POLICY IF EXISTS "Member can view membership by email" ON account_members;
DROP POLICY IF EXISTS "Owner or team admin can add members" ON account_members;
DROP POLICY IF EXISTS "Owner or team admin can update members" ON account_members;
DROP POLICY IF EXISTS "Owner or team admin can remove members" ON account_members;
-- Earlier versions that may still exist (from 003, 007, 014)
DROP POLICY IF EXISTS "Owner can view their members" ON account_members;
DROP POLICY IF EXISTS "Member can view membership by email" ON account_members;
DROP POLICY IF EXISTS "Owner can add members" ON account_members;
DROP POLICY IF EXISTS "Owner can remove members" ON account_members;
DROP POLICY IF EXISTS "Owner can update member role" ON account_members;
DROP POLICY IF EXISTS "Team admin can view members" ON account_members;
DROP POLICY IF EXISTS "Team admin can add members" ON account_members;
DROP POLICY IF EXISTS "Team admin can update members" ON account_members;
DROP POLICY IF EXISTS "Team admin can remove members" ON account_members;

-- ============================================================
-- account_profiles (from 008_add_account_profiles.sql)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own account profile" ON account_profiles;
DROP POLICY IF EXISTS "Users can insert own account profile" ON account_profiles;
DROP POLICY IF EXISTS "Users can update own account profile" ON account_profiles;

-- ============================================================
-- companies (from 004, 018)
-- ============================================================
DROP POLICY IF EXISTS "Users can CRUD own companies" ON companies;
DROP POLICY IF EXISTS "Team members can view companies" ON companies;
DROP POLICY IF EXISTS "Team members can insert companies" ON companies;
DROP POLICY IF EXISTS "Team members can update companies" ON companies;

-- ============================================================
-- expenses (from Supabase dashboard + 018)
-- ============================================================
-- Original user_id-based policies (created via Supabase dashboard)
DROP POLICY IF EXISTS "Users can view own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can CRUD own expenses" ON expenses;
-- Team member policies (from 018)
DROP POLICY IF EXISTS "Team members can view expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can insert expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can update expenses" ON expenses;
DROP POLICY IF EXISTS "Team members can delete expenses" ON expenses;

-- ============================================================
-- folders (from Supabase dashboard + 018)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own folders" ON folders;
DROP POLICY IF EXISTS "Users can insert own folders" ON folders;
DROP POLICY IF EXISTS "Users can update own folders" ON folders;
DROP POLICY IF EXISTS "Users can delete own folders" ON folders;
DROP POLICY IF EXISTS "Users can CRUD own folders" ON folders;
-- Team member policies (from 018)
DROP POLICY IF EXISTS "Team members can view folders" ON folders;
DROP POLICY IF EXISTS "Team members can insert folders" ON folders;
DROP POLICY IF EXISTS "Team members can update folders" ON folders;
DROP POLICY IF EXISTS "Team members can delete folders" ON folders;

-- ============================================================
-- receipts (from Supabase dashboard + 018)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can CRUD own receipts" ON receipts;
-- Team member policies (from 018)
DROP POLICY IF EXISTS "Team members can view receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can insert receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can update receipts" ON receipts;
DROP POLICY IF EXISTS "Team members can delete receipts" ON receipts;

-- ============================================================
-- customer_subfolders (from 009, 018)
-- ============================================================
DROP POLICY IF EXISTS "Users can CRUD own customer subfolders" ON customer_subfolders;
-- Team member policies (from 018)
DROP POLICY IF EXISTS "Team members can view customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can insert customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can update customer subfolders" ON customer_subfolders;
DROP POLICY IF EXISTS "Team members can delete customer subfolders" ON customer_subfolders;

-- ============================================================
-- category_mappings (from 016_add_category_mappings.sql)
-- ============================================================
DROP POLICY IF EXISTS "Users can view own category mappings" ON category_mappings;
DROP POLICY IF EXISTS "Users can insert own category mappings" ON category_mappings;
DROP POLICY IF EXISTS "Users can update own category mappings" ON category_mappings;
DROP POLICY IF EXISTS "Users can delete own category mappings" ON category_mappings;

-- ============================================================
-- accounts table (from 020 - replace with account_id-based version)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can view their accounts" ON accounts;

-- ============================================================
-- account_users table (from 020 - replace with account_id-based version)
-- ============================================================
DROP POLICY IF EXISTS "Users can view account memberships" ON account_users;

-- ============================================================
-- account_member_companies (from 018)
-- These policies use is_owner_or_team_admin which depends on
-- account_members legacy structure. Drop and re-create if needed.
-- ============================================================
DROP POLICY IF EXISTS "Owner or team admin can view company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Member can view own company access grants" ON account_member_companies;
DROP POLICY IF EXISTS "Owner or team admin can manage company access grants" ON account_member_companies;

-- ============================================================
-- Drop legacy helper functions (no longer needed after migration)
-- ============================================================
DROP FUNCTION IF EXISTS is_owner_or_team_admin(uuid);
DROP FUNCTION IF EXISTS member_can_access_company(uuid, text);
