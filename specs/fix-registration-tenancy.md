# Plan: Fix Registration Tenancy & Multi-Tenant Signup Flow

## Task Description
The current registration/signup system has a broken tenancy model that risks becoming an architectural problem. The system needs to be reworked so that:

1. **New signups default to a free 30-day Business plan trial** (not a generic "trial" with 1-user limits)
2. **First user from a company** creates a new tenant (account) — capturing personal and company details into the relevant tables (`account_profiles`, `subscriptions`, `companies`)
3. **Subsequent users from the same company** are automatically matched to the existing tenant using fuzzy matching on email domain + company name, rather than creating orphaned individual accounts
4. **Tenant = Account** — terminology and data model should be consistent; an "account" IS the tenant
5. **Individual plan** = single user in their own tenant. **Business plan** = multiple users sharing one tenant
6. **Supabase table structure must support true multi-tenancy** — the current model ties everything to `user_id` (the owner), not to an explicit `account_id`/`tenant_id`
7. **Pricing plan restructure** — remove "Personal" plan entirely, rename "Lite" to "Individual", remove "Up to 5 years of data" from Business plan features

## Objective
Deliver a robust multi-tenant registration flow where new users are either routed into an existing tenant (via fuzzy company-name + email-domain matching) or provisioned as a new tenant with a 30-day Business trial, and the underlying Supabase schema explicitly supports tenant isolation via an `account_id` foreign key on all data tables.

## Problem Statement
The current architecture has several tenancy gaps:

1. **No explicit tenant/account entity** — There is no `accounts` table. The "account" concept is implicit: `subscriptions.user_id` is treated as the account owner, and `account_members.owner_user_id` links team members to that owner. If the owner is deleted or changes, the entire tenant concept collapses.

2. **Subscription is per-user, not per-account** — `subscriptions` has `UNIQUE(user_id)`. Every user who signs up gets their own subscription row with `plan: 'trial'` and `allowed_active_users: 1`. There's no mechanism during signup to detect "this person belongs to an existing company."

3. **No company-name capture at signup** — The signup flow (`/api/auth/signup` + Login page) only collects email + password. Company name and personal details are only entered later in Settings > Account (`account_profiles`). By the time the user fills that in, they already have an orphaned subscription and data silo.

4. **No fuzzy matching** — Nothing in the current flow checks if a company by a similar name already exists or if the email domain matches an existing tenant.

5. **Trial defaults to 1-user** — `createTrialSubscription()` hardcodes `allowed_active_users: 1` and `plan: 'trial'`. The requirement is a 30-day Business trial (4 users).

6. **RLS policies are user_id-scoped, not account-scoped** — All data tables (`expenses`, `folders`, `companies`, `receipts`, `customer_subfolders`) have RLS policies keyed on `user_id = auth.uid()`. Team member access is bolted on via `account_members` email matching. This works but is fragile — it doesn't scale to a proper `account_id`-based model.

## Solution Approach

### Phase 1: Introduce explicit `accounts` table as the tenant entity
- Create an `accounts` table (`id uuid PK`, `name text`, `domain text`, `created_at`, `created_by_user_id`)
- Add `account_id uuid` FK column to: `subscriptions`, `account_members`, `account_profiles`, `companies`, `expenses`, `folders`, `receipts`, `customer_subfolders`, `category_mappings`
- Write a data migration to create an `accounts` row for each existing `subscriptions.user_id` (current owners) and backfill `account_id` on all tables
- Update RLS policies to use `account_id` membership checks instead of individual `user_id` or email matching

### Phase 2: Enhanced signup flow with company capture + tenant matching
- Add `firstName`, `lastName`, `companyName` fields to the signup form
- On signup API: extract email domain, fuzzy-match `companyName` against existing `accounts.name` + domain match
- If match found → show the user the matched company name and let them confirm ("Join [CompanyName]") or decline ("No, create a new account"). On confirm → create user, add to `account_users` with `status: 'pending_approval'`, notify account owner. On decline → create new tenant. **Note**: for now, auto-join the user immediately (don't enforce approval gate) but log the pending status so the approval workflow can be enforced later without a schema change.
- If no match → create new `accounts` row, create `account_profiles` row, create `subscriptions` row with `plan: 'trial'` + Business-tier defaults (30 days, 4 users), sign them in

### Phase 3: Migrate subscription to account-level
- Move `subscriptions.user_id` to `subscriptions.account_id` (keeping `user_id` as `created_by` for audit)
- Update `AuthGuard`, `findOwnerSubscription`, `getSubscription` to resolve via `account_id`
- Update team seat enforcement to count users per `account_id`

## Relevant Files
Use these files to complete the task:

**Core Auth & Signup Flow**
- `src/app/api/auth/signup/route.ts` — Server-side signup handler. Currently only accepts email+password. Needs company name, first/last name fields + tenant matching logic
- `src/app/login/page.tsx` — Login/signup UI. Needs additional form fields for signup mode (first name, last name, company name)
- `src/lib/auth.tsx` — Auth context + `signUpWithEmail()`. Needs to pass new fields to signup API and handle tenant-match response
- `src/components/AuthGuard.tsx` — Post-login subscription check + trial creation. `createTrialSubscription` call needs to create account-scoped subscription with Business defaults

**Subscription & Account Management**
- `src/lib/subscription.ts` — `createTrialSubscription()`, `getSubscription()`, `findOwnerSubscription()`, `selectPlan()`. All need account_id awareness. Also: `Plan` type union includes `'personal'` which must be removed; `'lite'` must be renamed to `'individual'`; `PLANS.business.maxYears` is `5` — must be changed to `null` (unlimited); `PLANS.business.features` includes `'Up to 5 years of data'` — must be removed; `addAccountMember()` gates on `plan === 'personal' || plan === 'lite'` — must be updated to `plan === 'individual'`
- `src/lib/account-profile.ts` — `getAccountProfile()`, `saveAccountProfile()`. Needs account_id FK + auto-create during signup
- `src/app/settings/account/page.tsx` — Account settings UI (reads profile + subscription)
- `src/app/settings/team/page.tsx` — Team settings. Line 121 gates on `sub?.plan === 'personal' || sub?.plan === 'lite'` — must be updated to `sub?.plan === 'individual'`

**Pricing & Subscribe Pages**
- `src/app/pricing/page.tsx` — Public pricing page. Currently shows 5 cards (personal, lite, business, elite, vps). Must remove `personal` entry, rename `lite` to `individual`, and the Business card's "Up to 5 years of data" feature will be removed via `PLANS` data. Also update FAQ answer referencing "Personal includes 500 transactions" → "Individual includes unlimited transactions"
- `src/app/subscribe/page.tsx` — Authenticated plan selection. `PLAN_ORDER` array includes `'personal'` and `'lite'` — must remove `'personal'`, rename `'lite'` to `'individual'`. Grid changes from `xl:grid-cols-5` to `xl:grid-cols-4`

**PayPal Integration**
- `src/app/api/paypal/create-order/route.ts` — Has `personal: '5.00'` price and `personal: 'Personal'` label. Must remove `personal` entries and rename `lite` → `individual`

**Database Migrations**
- `migrations/002_add_subscriptions.sql` — Current subscriptions schema (user_id-scoped)
- `migrations/003_add_account_members.sql` — Current team member schema (owner_user_id-scoped)
- `migrations/004_add_companies.sql` — Companies table (user_id-scoped)
- `migrations/005_update_subscription_plan_constraint.sql` — Plan CHECK constraint includes `'personal'` and `'lite'` — must be updated to remove `'personal'`, rename `'lite'` to `'individual'`
- `migrations/006_add_subscription_metadata.sql` — `plan_expires_at`, `allowed_active_users`
- `migrations/007_update_account_member_seat_policy.sql` — Seat enforcement RLS
- `migrations/008_add_account_profiles.sql` — Account profile schema (user_id-scoped)
- `migrations/010_add_site_admins.sql` — Admin dashboard function (joins on user_id)
- `migrations/011_allow_team_member_account_data_access.sql` — Team member RLS policies (email-match pattern)
- `migrations/013_add_team_invite_tracking.sql` — `mark_team_member_enrolled()` RPC
- `migrations/014_add_team_roles.sql` — Team roles

**Data Layer**
- `src/lib/database.ts` — Expense/folder CRUD. Uses `user_id` for all queries
- `src/lib/company.ts` — Company helpers

### New Files
- `migrations/020_add_accounts_table.sql` — New `accounts` table + `account_id` FK on all data tables + data migration
- `migrations/021a_add_account_rls_policies.sql` — Add new account_id-based RLS policies alongside existing ones (phase 1 — coexist)
- `migrations/021b_drop_legacy_rls_policies.sql` — Drop old user_id/email RLS policies (phase 2 — run after verifying 021a)
- `migrations/022_rename_plans_and_update_constraints.sql` — Remove `personal` plan, rename `lite` → `individual` in CHECK constraint, migrate any existing `personal` subscriptions to `individual`, migrate any existing `lite` subscriptions to `individual`, remove `maxYears` limit from Business
- `src/lib/tenant.ts` — Tenant matching logic (fuzzy company name + domain matching)
- `src/lib/fuzzy-match.ts` — Fuzzy string matching utility for company names
- `src/app/onboard/page.tsx` — One-time onboarding page for migrated users missing company name. Collects company name, updates `accounts.name`, redirects to dashboard. Shown only when `accounts.name` is a fallback value (email domain or empty).

## Implementation Phases

### Phase 1: Foundation — `accounts` Table + Data Migration
1. Create `accounts` table as the canonical tenant entity
2. Add `account_id` column to all data tables (`subscriptions`, `account_members`, `account_profiles`, `companies`, `expenses`, `folders`, `receipts`, `customer_subfolders`, `category_mappings`)
3. Write idempotent data migration: for each existing `subscriptions.user_id`, create an `accounts` row and backfill `account_id` across all related tables
4. Create `account_users` junction table (`account_id`, `user_id`, `role`, `joined_at`) to replace the implicit owner/member relationship
5. Add indexes on `account_id` columns

### Phase 2: Core Implementation — Signup Flow + Tenant Matching
1. Build `src/lib/tenant.ts` with:
   - `findMatchingTenant(companyName, emailDomain)` — fuzzy match against `accounts.name` + `accounts.domain`
   - `createTenant(companyName, emailDomain, userId)` — create new account + link user
   - `addUserToTenant(accountId, userId, role)` — add user to existing account
2. Build `src/lib/fuzzy-match.ts` — Levenshtein/trigram-based company name matcher
3. Update signup API (`/api/auth/signup`) to:
   - Accept `firstName`, `lastName`, `companyName`
   - Call tenant matching
   - Create or join tenant
   - Auto-create `account_profiles` row
   - Create subscription with Business trial defaults (30 days, 4 users) for new tenants
4. Update Login page to show company name + name fields in signup mode
5. Update `signUpWithEmail` in auth context to pass new fields

### Phase 3: Integration & Polish — RLS, AuthGuard, Admin
1. Rewrite RLS policies on all data tables to use `account_id` membership check instead of `user_id` or email matching
2. Update `AuthGuard` to resolve subscription via `account_id` instead of `user_id` chain
3. Update `getSubscription()`, `findOwnerSubscription()`, `selectPlan()` for account-scoped queries
4. Update `get_admin_account_states()` function for new schema
5. Update `mark_team_member_enrolled()` RPC
6. Update team settings page and invite flow for account-scoped model
7. Typecheck, lint, and test all changes

## Team Orchestration

- You operate as the team lead and orchestrate the team to execute the plan.
- You're responsible for deploying the right team members with the right context to execute the plan.
- IMPORTANT: You NEVER operate directly on the codebase. You use `Task` and `Task*` tools to deploy team members to to the building, validating, testing, deploying, and other tasks.
  - This is critical. You're job is to act as a high level director of the team, not a builder.
  - You're role is to validate all work is going well and make sure the team is on track to complete the plan.
  - You'll orchestrate this by using the Task* Tools to manage coordination between the team members.
  - Communication is paramount. You'll use the Task* Tools to communicate with the team members and ensure they're on track to complete the plan.
- Take note of the session id of each team member. This is how you'll reference them.

### Team Members

- Builder
  - Name: builder-schema
  - Role: Database schema architect — creates migrations for `accounts` table, `account_id` columns, data migration, and updated RLS policies
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: builder-api
  - Role: Backend developer — implements tenant matching logic (`src/lib/tenant.ts`, `src/lib/fuzzy-match.ts`) and updates the signup API route
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: builder-frontend
  - Role: Frontend developer — updates login/signup UI with company name + name fields, updates auth context and AuthGuard
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: builder-integration
  - Role: Integration developer — updates subscription lib, account-profile lib, admin functions, and team settings for account-scoped model
  - Agent Type: general-purpose
  - Resume: true

- Builder
  - Name: validator
  - Role: Validator — runs typecheck, lint, and verifies all acceptance criteria
  - Agent Type: general-purpose
  - Resume: false

## Step by Step Tasks

- IMPORTANT: Execute every step in order, top to bottom. Each task maps directly to a `TaskCreate` call.
- Before you start, run `TaskCreate` to create the initial task list that all team members can see and execute.

### 1. Create `accounts` Table Migration
- **Task ID**: create-accounts-table
- **Depends On**: none
- **Assigned To**: builder-schema
- **Agent Type**: general-purpose
- **Parallel**: false
- Create `migrations/020_add_accounts_table.sql` with:
  - `accounts` table: `id uuid PK DEFAULT gen_random_uuid()`, `name text NOT NULL`, `domain text`, `created_by_user_id uuid REFERENCES auth.users(id)`, `created_at timestamptz DEFAULT now()`
  - `UNIQUE(name, domain)` to prevent duplicate company+domain combos
  - RLS enabled with policy: authenticated users can view accounts they belong to
  - Add `account_id uuid REFERENCES accounts(id)` to: `subscriptions`, `account_members`, `account_profiles`, `companies`, `expenses`, `folders`, `receipts`, `customer_subfolders`, `category_mappings`
  - Data migration: for each distinct `user_id` in `subscriptions`, create an `accounts` row using `account_profiles.business_name` (or email domain as fallback), then backfill `account_id` on all related tables
  - Add indexes on all new `account_id` columns
  - Create `account_users` table: `id uuid PK`, `account_id uuid REFERENCES accounts(id)`, `user_id uuid REFERENCES auth.users(id)`, `role text DEFAULT 'owner'`, `status text DEFAULT 'active' CHECK (status IN ('active', 'pending_approval'))`, `joined_at timestamptz DEFAULT now()`, `UNIQUE(account_id, user_id)`
  - **Note on `status` column**: `pending_approval` is the future approval-gated state. For now, all users are inserted as `active` (approval not enforced yet). The column exists so the approval workflow can be activated later without a schema migration.

### 2. Update RLS Policies for Account-Based Access (Phased)
- **Task ID**: update-rls-policies
- **Depends On**: create-accounts-table
- **Assigned To**: builder-schema
- **Agent Type**: general-purpose
- **Parallel**: false
- **Phased approach for safety** — add new policies first (alongside old ones), verify access works, then drop old policies in a separate migration. This prevents data-access lockout if something goes wrong.
- Create `migrations/021a_add_account_rls_policies.sql` with:
  - **Add** new account_id-based policies alongside existing user_id/email policies on `companies`, `expenses`, `folders`, `receipts`, `customer_subfolders`. Use distinct policy names (e.g., `"Account members can view companies"`) to avoid conflicts with existing ones.
  - New policies use: `EXISTS (SELECT 1 FROM account_users au WHERE au.account_id = <table>.account_id AND au.user_id = auth.uid() AND au.status = 'active')`
  - Add `subscriptions` policy allowing viewing by any user in the same account
  - Add `account_members` policies scoped to `account_id`
  - Add `account_profiles` policies for account-scoped access
  - Add `accounts` table policy: users can view accounts they belong to via `account_users`
  - **Do NOT drop old policies yet** — both old (user_id) and new (account_id) policies coexist. Postgres RLS is permissive by default (OR logic), so either policy granting access is sufficient.
- Create `migrations/021b_drop_legacy_rls_policies.sql` with:
  - Drop old user_id-based owner policies and email-match team policies on all data tables
  - This migration runs only after 021a is verified working in staging
  - Each DROP is `DROP POLICY IF EXISTS` for idempotency

### 3. Build Tenant Matching Logic
- **Task ID**: build-tenant-matching
- **Depends On**: create-accounts-table
- **Assigned To**: builder-api
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside update-rls-policies)
- Create `src/lib/fuzzy-match.ts`:
  - `normalizeCompanyName(name: string): string` — lowercase, strip Inc/LLC/Ltd suffixes, collapse whitespace
  - `fuzzyCompanyMatch(input: string, candidates: string[], threshold?: number): string | null` — Levenshtein-based matching with configurable threshold (default 0.8 similarity)
- Create `src/lib/tenant.ts`:
  - `findMatchingTenant(companyName: string, emailDomain: string): Promise<{ accountId: string; accountName: string } | null>` — query `accounts` table, check domain match + fuzzy name match. Returns the best match (if any) so the signup flow can present it to the user for confirmation.
  - `createTenant(params: { companyName: string, emailDomain: string, userId: string, firstName: string, lastName: string }): Promise<string>` — create `accounts` row, `account_users` row (status: 'active', role: 'owner'), `account_profiles` row, `subscriptions` row with Business trial defaults
  - `addUserToTenant(accountId: string, userId: string, role?: string): Promise<void>` — insert into `account_users` with `status: 'active'` (approval not enforced yet; column supports future `pending_approval` gating)

### 4. Update Signup API Route
- **Task ID**: update-signup-api
- **Depends On**: build-tenant-matching
- **Assigned To**: builder-api
- **Agent Type**: general-purpose
- **Parallel**: false
- Update `src/app/api/auth/signup/route.ts`:
  - Accept new fields: `firstName`, `lastName`, `companyName`, `confirmTenantId` (optional) in request body
  - **Two-call flow for tenant matching**:
    1. First call (no `confirmTenantId`): extract email domain, call `findMatchingTenant(companyName, emailDomain)`. If match found, return `{ tenantMatch: true, matchedAccountName: "...", matchedAccountId: "..." }` **without creating the user yet** — the frontend shows a confirmation prompt.
    2. Second call (with `confirmTenantId`): user confirmed the match. Create auth user, call `addUserToTenant(confirmTenantId, newUserId)`, create `account_profiles` row. Return `{ tenantMatch: true, accountId: "..." }`.
    3. Second call (with `confirmTenantId: "new"`): user declined the match. Create auth user, call `createTenant(...)` to create a new account. Return `{ tenantMatch: false, accountId: "..." }`.
    4. First call with no match: create auth user + new tenant immediately. Return `{ tenantMatch: false, accountId: "..." }`.
  - Handle invite flow: if `inviteToken` present, the existing invite path remains but should also set `account_id` on the new user's data

### 5. Update Signup UI
- **Task ID**: update-signup-ui
- **Depends On**: none
- **Assigned To**: builder-frontend
- **Agent Type**: general-purpose
- **Parallel**: true (can run immediately, no schema dependency)
- Update `src/app/login/page.tsx`:
  - In signup mode, add fields: First Name, Last Name, Company Name (all required)
  - Company Name field should have a subtle helper text: "We'll check if your company already has an account"
  - Pass new fields to `signUpWithEmail()`
  - **Tenant match confirmation step**: When the API returns a fuzzy match, show an inline confirmation before creating the account:
    - "We found an existing account for **[MatchedCompanyName]**. Would you like to join it?"
    - Two buttons: "Yes, join [CompanyName]" (calls signup again with `confirmTenantId`) and "No, create a new account" (calls signup with `confirmTenantId: "new"`)
    - If no match, proceed directly to account creation (no extra step)
  - Handle final response: show appropriate message ("You've been added to [CompanyName]'s account" vs "Your account has been created with a 30-day Business trial")
  - **Disable Google OAuth for signup**: Hide or disable the Google sign-in button when in signup mode. Google OAuth does not go through the tenant-matching signup flow and would create orphaned users without account/tenant association. Keep Google sign-in available only for existing users in sign-in mode.
- Update `src/lib/auth.tsx`:
  - Update `signUpWithEmail` signature to accept `firstName`, `lastName`, `companyName`
  - Pass these fields to the `/api/auth/signup` fetch call
  - Update return type to include `tenantMatch`, `matchedAccountName`, `matchedAccountId`, `accountId`, `accountName`
- Create `src/app/onboard/page.tsx`:
  - Simple form: company name input + "Continue" button
  - On submit: update `accounts.name` for the user's account, then redirect to `/dashboard`
  - Only shown when `AuthGuard` detects a fallback account name
  - Wrapped in `AuthGuard` so only authenticated users see it
  - Add `/onboard` to `SUBSCRIPTION_EXEMPT` list in `AuthGuard` so expired trials don't block onboarding

### 5b. Restructure Pricing Plans (Remove Personal, Rename Lite → Individual, Fix Business)
- **Task ID**: restructure-pricing-plans
- **Depends On**: none
- **Assigned To**: builder-frontend
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside signup UI and schema tasks)
- Update `src/lib/subscription.ts`:
  - Remove `'personal'` from `Plan` type union entirely
  - Rename `'lite'` to `'individual'` in `Plan` type union
  - Remove the `personal: { ... }` entry from `PLANS` object
  - Rename the `lite` key to `individual` in `PLANS` object, update `name: 'Individual'`
  - In `PLANS.business`: change `maxYears: 5` → `maxYears: null`, remove `'Up to 5 years of data'` from `features` array
  - In `addAccountMember()`: change gate from `sub.plan === 'personal' || sub.plan === 'lite'` to `sub.plan === 'individual'`
- Update `src/app/pricing/page.tsx`:
  - Remove the `{ key: 'personal', ... }` entry from the `plans` array
  - Rename `{ key: 'lite', ... }` to `{ key: 'individual', ... }`
  - Grid changes from `xl:grid-cols-5` to `xl:grid-cols-4` (4 plans now)
  - Update FAQ: change "Personal includes 500 transactions" → "Individual includes unlimited transactions"
- Update `src/app/subscribe/page.tsx`:
  - Remove `'personal'` from `PLAN_ORDER` array
  - Rename `'lite'` to `'individual'` in `PLAN_ORDER` array
  - Grid changes from `xl:grid-cols-5` to `xl:grid-cols-4`
- Update `src/app/api/paypal/create-order/route.ts`:
  - Remove `personal: '5.00'` from price map and `personal: 'Personal'` from label map
  - Rename `lite` key to `individual` in both maps
- Update `src/app/settings/team/page.tsx`:
  - Line 121: change `sub?.plan === 'personal' || sub?.plan === 'lite'` to `sub?.plan === 'individual'`
- Create `migrations/022_rename_plans_and_update_constraints.sql`:
  - `UPDATE subscriptions SET plan = 'individual' WHERE plan IN ('personal', 'lite');`
  - Drop and recreate plan CHECK constraint: `CHECK (plan IN ('trial', 'individual', 'business', 'elite'))`

### 6. Update Subscription & Profile Logic for Account Scope
- **Task ID**: update-subscription-account-scope
- **Depends On**: create-accounts-table, update-rls-policies
- **Assigned To**: builder-integration
- **Agent Type**: general-purpose
- **Parallel**: true (can run alongside tasks 3-5)
- Update `src/lib/subscription.ts`:
  - `getSubscription()` — accept `accountId` parameter (in addition to `userId`), prefer account-based lookup
  - `createTrialSubscription()` — accept `accountId`, set `plan: 'trial'`, `allowed_active_users: 4`, trial period 30 days (Business-tier defaults)
  - `selectPlan()` — update by `account_id`
  - `findOwnerSubscription()` — rewrite to look up via `account_users` → `subscriptions.account_id` instead of email matching through `account_members`
  - `maxUsersForSubscription()` — no change needed (already reads from sub row)
- Update `src/lib/account-profile.ts`:
  - Add `account_id` to `AccountProfile` interface
  - Update `getAccountProfile()` and `saveAccountProfile()` to include `account_id`
- Update `src/components/AuthGuard.tsx`:
  - Resolve user's account via `account_users` table
  - Get subscription via `account_id` instead of `user_id`
  - Remove the `findOwnerSubscription` email-matching fallback (replaced by direct account lookup)
  - Keep trial creation for users with no account (edge case: shouldn't happen post-migration, but defensive)
  - **Missing-profile onboarding gate**: If user has an `account_users` row but the linked `accounts` row has a fallback name (e.g., an email domain like "gmail.com" from migration backfill, or empty `business_name`), redirect to a one-time onboarding page (`/onboard`) that collects company name. This ensures migrated users who never set `business_name` get prompted to complete their tenant profile before accessing the dashboard.

### 7. Update Admin & Team Functions
- **Task ID**: update-admin-team
- **Depends On**: update-subscription-account-scope
- **Assigned To**: builder-integration
- **Agent Type**: general-purpose
- **Parallel**: false
- Create `migrations/023_update_admin_functions.sql`:
  - Update `get_admin_account_states()` to join via `accounts` + `account_users` instead of `subscriptions.user_id`
  - Update `mark_team_member_enrolled()` to also set `account_id` on relevant rows
- Update `src/app/settings/team/page.tsx` — team management should scope to `account_id`
- Update `src/lib/subscription.ts` team member functions (`getAccountMembers`, `addAccountMember`, `removeAccountMember`) to use `account_id` instead of `owner_user_id`
- Update `src/lib/database.ts` — all CRUD queries should filter by `account_id` (resolving from `account_users` for current user)

### 8. Final Validation
- **Task ID**: validate-all
- **Depends On**: create-accounts-table, update-rls-policies, build-tenant-matching, update-signup-api, update-signup-ui, restructure-pricing-plans, update-subscription-account-scope, update-admin-team
- **Assigned To**: validator
- **Agent Type**: general-purpose
- **Parallel**: false
- Run `bun run typecheck` — zero errors
- Run `bun run lint` — zero errors
- Run `bun run test` (if tests exist) — all pass
- Verify migration files are syntactically valid SQL
- Verify all new TypeScript files export correctly
- Walk through the signup flow logic:
  - New user with new company → new account created, Business trial, 4 users
  - New user with existing company (fuzzy match) → shown confirmation prompt → on confirm, joined to existing account; on decline, new account created
  - New user with existing company (fuzzy match) → declines match → new separate account created
  - Existing migrated user with fallback account name → redirected to `/onboard` → sets company name → reaches dashboard
  - Invite flow still works (invite token → create user → join account)
- Verify RLS policies cover all CRUD operations on all data tables
- Verify no orphaned `user_id`-only references remain in active code paths
- Verify pricing plan restructure:
  - No references to `'personal'` as a plan key anywhere in `src/` (grep confirms zero matches)
  - No references to `'lite'` as a plan key anywhere in `src/` (all renamed to `'individual'`)
  - `PLANS` object has exactly 4 entries: `individual`, `business`, `elite`, `vps`
  - `PLANS.business.maxYears` is `null` (unlimited)
  - `PLANS.business.features` does not contain "Up to 5 years of data"
  - Pricing page renders 4 cards (not 5)
  - Subscribe page renders 4 cards (not 5)
  - Migration 022 updates existing `personal`/`lite` rows to `individual`

## Acceptance Criteria

1. An `accounts` table exists as the canonical tenant entity with `id`, `name`, `domain`, `created_by_user_id`
2. All data tables (`subscriptions`, `companies`, `expenses`, `folders`, `receipts`, `customer_subfolders`, `account_profiles`, `account_members`, `category_mappings`) have an `account_id` column with FK to `accounts`
3. Existing data is migrated: every current subscription owner has a corresponding `accounts` row, and all their data rows have `account_id` backfilled
4. Signup form collects: email, password, first name, last name, company name
5. New signup with unrecognized company → creates new tenant + 30-day Business trial (4 users, `plan: 'trial'`)
6. New signup with fuzzy-matching company name + matching email domain → user is shown a confirmation prompt ("Join [CompanyName]?" / "No, create new account"). On confirm → added to existing tenant. On decline → new tenant created.
7. `signUpWithEmail` returns whether a tenant match occurred so the UI can show the confirmation step and appropriate messaging
7b. `account_users` table has a `status` column (`active` / `pending_approval`). For now all users are inserted as `active` (approval not enforced). The column exists for future owner-approval gating without schema changes.
8. RLS policies on all data tables use `account_id` membership check via `account_users` table
9. `AuthGuard` resolves subscription via `account_id` (not user_id chain)
10. Admin dashboard (`get_admin_account_states()`) works with new schema
11. Team invite flow continues to work (invite → signup → join account)
12. **"Personal" plan removed entirely** — no `'personal'` key in `Plan` type, `PLANS` object, pricing page, subscribe page, PayPal route, or DB constraint
13. **"Lite" renamed to "Individual"** — all references to `'lite'` replaced with `'individual'` across Plan type, PLANS, pricing page, subscribe page, PayPal route, team settings gate, and DB constraint
14. **Business plan unlimited years** — `PLANS.business.maxYears` is `null`, `features` array does not include "Up to 5 years of data"
15. **Migration 022** migrates existing `personal` and `lite` subscription rows to `individual` and updates the CHECK constraint
16. Pricing page and subscribe page render **4 plan cards** (individual, business, elite, vps) — not 5
17. **Google OAuth disabled for signup** — Google sign-in button is hidden/disabled in signup mode; only available in sign-in mode for existing users
18. **Migrated user onboarding** — existing users whose `accounts.name` is a fallback (email domain or empty) are redirected to `/onboard` to set their company name before accessing the dashboard
19. **RLS phased rollout** — migration 021a adds new policies alongside old ones; migration 021b drops old policies only after verification. Both exist as separate files.
20. `bun run typecheck` passes with zero errors
21. `bun run lint` passes with zero errors

## Validation Commands
Execute these commands to validate the task is complete:

- `bun run typecheck` — Verify all TypeScript compiles without errors
- `bun run lint` — Verify code passes linting rules
- `bun run test` — Run test suite if tests exist
- `grep -r 'account_id' migrations/020*.sql` — Verify account_id column is added to all data tables
- `grep -r 'accounts' migrations/020*.sql` — Verify accounts table creation
- `grep -r 'fuzzy' src/lib/` — Verify fuzzy matching module exists
- `grep -r 'companyName' src/app/api/auth/signup/route.ts` — Verify signup API accepts company name
- `grep -r 'companyName' src/app/login/page.tsx` — Verify signup UI has company name field
- `grep -r 'account_users' migrations/021*.sql` — Verify RLS policies use account_users
- `grep -rn "'personal'" src/` — Should return ZERO matches (plan fully removed). Ignore `suspected_personal` category references and privacy page text
- `grep -rn "'lite'" src/lib/subscription.ts src/app/pricing/ src/app/subscribe/ src/app/api/paypal/ src/app/settings/team/` — Should return ZERO matches (all renamed to 'individual')
- `grep -n 'individual' src/lib/subscription.ts` — Verify 'individual' plan exists in Plan type and PLANS object
- `grep -n 'maxYears' src/lib/subscription.ts` — Verify business plan has `maxYears: null`
- `grep -rn "5 years" src/lib/subscription.ts` — Should return ZERO matches
- `grep -n 'grid-cols-4' src/app/pricing/page.tsx src/app/subscribe/page.tsx` — Verify 4-column grid (not 5)
- `cat migrations/022*.sql` — Verify plan migration and constraint update

## Notes

- **Backwards compatibility**: The `account_id` columns should be nullable initially to support the phased migration. After data migration runs, they can be made NOT NULL.
- **Fuzzy matching threshold**: Start with 0.8 Levenshtein similarity. This catches "Hopewell AI" vs "Hopewell A.I." vs "HopewellAI" but won't conflate unrelated companies. Can be tuned based on real-world data.
- **Domain matching**: Extract domain from email (e.g., `slysik@hopewell.ai` → `hopewell.ai`). Free email domains (gmail.com, yahoo.com, outlook.com) should be excluded from domain matching to avoid false positives.
- **Migration ordering**: Migration 020 must run before 021, 021 before 022. All should be tested in a staging Supabase instance before production.
- **No new packages needed**: Levenshtein distance can be implemented in ~20 lines of TypeScript. No external fuzzy-matching library required.
- **The invite flow** (token-based team onboarding) should continue to work. The invite already targets a specific account, so `account_id` should be set on the `account_members` row during invite creation.
- **Plan rename data migration**: Migration 022 must handle existing `personal` and `lite` subscriptions gracefully. Any user currently on `personal` or `lite` gets migrated to `individual`. The `vps` plan is NOT included in the DB CHECK constraint since it's deployment-based, not a subscription tier — keep it in the constraint for now since existing code references it.
- **`suspected_personal` category**: The expense categorization system has a `suspected_personal` category key in `src/lib/categories.ts` — this is unrelated to the "Personal" pricing plan and must NOT be renamed or removed.
- **Pricing FAQ update**: The FAQ answer "Personal includes 500 transactions, while Lite and above include unlimited transactions" needs to be rewritten since both plan names are changing. New text should reference "Individual" plan with unlimited transactions.
- **Confirmed via live Supabase probe (2026-04-12)**: All 11 tables exist. No `accounts` table, no `account_users` table, no `account_id` column on any table. Schema matches migrations 001-019 exactly.
- **Google OAuth deferred for signup**: Google OAuth bypasses the signup API route entirely (it's a Supabase OAuth redirect). There's no hook to capture company name/tenant matching during OAuth signup. For this plan, Google sign-in is disabled in signup mode and only available for existing users signing in. A future plan can add a post-OAuth onboarding step that captures company details and runs tenant matching before granting dashboard access.

### Design Decisions (confirmed 2026-04-12)
- **Tenant join requires owner approval (future-gated)**: `account_users.status` supports `pending_approval` but is not enforced yet. All fuzzy-matched users are inserted as `active`. The approval workflow (owner gets notified, must approve before user sees data) is a future enhancement that requires no schema change — just a code change to insert as `pending_approval` and an RLS tweak to exclude `pending_approval` rows from the access check.
- **Fuzzy match requires user confirmation**: When a tenant match is found, the signup flow shows the matched company name and lets the user confirm or decline. The user can always say "No, create a new account" — this prevents false-positive merges (e.g., "Smith Consulting" vs "Smith Consulting Group"). The signup API supports this via a two-call pattern: first call returns the match, second call confirms or declines.
- **Migrated users prompted for company name**: Existing users who never set `business_name` in their profile get an `accounts` row with an email-domain fallback name during migration. On next login, `AuthGuard` detects the fallback and redirects to `/onboard` to collect the real company name. This is a one-time prompt, not a recurring gate.
- **RLS phased rollout**: New account_id-based policies are added alongside old user_id/email policies (migration 021a). Both coexist because Postgres RLS uses permissive OR logic. Old policies are dropped only after 021a is verified in staging (migration 021b). This prevents data-access lockout if the new policies have a bug.
