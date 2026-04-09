# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## Release Notes

Quick summary of what's new in each release, written for users.

### v2.2.7 — Custom Folders (2026-04-08)
You can now create custom-named folders in two places. Inside any **year folder**, click **Add Folder** to create a subfolder with any name you choose (e.g. "Tax Documents", "Q1 Audit"). At the **company level**, an **Add Folder** button lets you create folders that sit alongside years — useful for project files, notes, or any records that don't belong to a specific year. Both folder types appear in the sidebar with a trash icon to remove them. The folder page displays the company and folder context with a back button.

### v2.2.6 — Team Roles & Admin Password Change (2026-04-08)
Team members can now be assigned one of three roles: **Admin** (full access, can manage team), **Contributor** (can add/edit companies and expenses, no team management), or **Viewer** (read-only). The role is set when inviting and can be changed at any time from the Team tab using the inline role selector on each member row. The master admin can now change any user's password directly from the Admin settings page via a "Change Password" button on each account card — requires `SUPABASE_SERVICE_ROLE_KEY` to be added to the server environment (see setup note in the modal).

### v2.2.5 — Invite Flow Fixes & 1-Hour Expiry (2026-04-08)
The team invitation link now takes new users directly to a **Sign Up** form with their email pre-filled and a clear "You've been invited to a team" banner — no more landing on a blank sign-in screen with no context. After creating an account via invite, users go straight to the dashboard instead of the 2FA setup page. Invitation links now expire after **1 hour** (down from 24 hours) and the Resend button resets the clock. The enrollment status badges on the Team tab reflect the new expiry window.

### v2.2.4 — Team Invitations, Enrollment Tracking & 2FA Toggle (2026-04-08)
Team members now receive an email invitation when they are added, with a direct link to sign in or create an account. Invitations expire after 1 hour — the Team Members tab now shows each invite timestamp and a real-time status badge: **Enrolled** (signed in), **Pending** (invite still valid), or **Expired** (1 hour passed without sign-in), with a Resend button for expired invites. Two-factor authentication can now be enabled and disabled from Security Settings — enabling starts the authenticator app enrollment flow, and disabling unenrolls all TOTP factors cleanly. The logo in the Settings header is now clickable and returns you to the dashboard.

### v2.2.3 — VPS Plan, HTTPS & Recovery Improvements (2026-04-08)
The platform now includes a new **Virtual Private Server** plan at **$250/month** for customers who want their own secured deployment of Accountant's Best Friend on a dedicated server environment. Year pages now support full-year analysis export in CSV, Excel, and QBO formats similar to monthly exports, password reset links now correctly establish the recovery session before allowing a new password to be saved, and production requests now default to HTTPS when the reverse proxy forwards the original protocol.

### v2.2.3 — Public Site Refresh & Team Account Fixes (2026-04-07)
The public homepage is now a full features-and-capabilities landing page with workflow diagrams and clearer product positioning. Sign out has been moved into the lower-left sidebar as a more visible exit control, the Privacy Policy was simplified by removing the child privacy section, team-account access has been corrected so invited users can load the owner account's companies and folders once the matching database policy migration is applied, and companies can now be moved to Trash and restored later with their folder structure intact.

### v2.2.2 — Navigation Cleanup & Header Polish (2026-04-07)
The dashboard navigation is cleaner and less confusing. The old collapsible menu behavior has been fully removed, the sidebar logo was rebalanced so company folders stay visible, and the top navigation now shows **Current Plan** more clearly while keeping **Sign Out** pinned to the far left.

### v2.2.1 — Admin Controls & Customer Organization (2026-04-07)
The app now includes a master admin area for monitoring active customer accounts, mapped to the existing `vic@alpina.net` site user. Account Settings now store richer business and contact details, year folders can contain customer-specific subfolders, the chatbot is now branded as **Alladin** with a genie-style mark, and the dashboard sidebar stays consistently open without a collapse toggle.

### v2.2.0 — Brand Refresh & Site Polish (2026-04-07)
The color scheme is now warm black with a Claude-inspired light orange accent throughout — buttons, links, focus rings, and badges all use the new palette. The logo now appears consistently on every page including login, pricing, subscribe, reset-password, settings, and the footer. The login page gained a proper header and footer matching the rest of the public site. Privacy Policy and Terms of Service pages were added with full content covering data collection, payments, subscriptions, acceptable use, and legal terms.

### v2.1.0 — PayPal Payments (2026-04-07)
You can now subscribe directly from the pricing page. Every plan card has a **Buy it now** button that takes you through a secure PayPal checkout. No need to enter card details on our site — PayPal handles everything. Sandbox mode is supported for testing before going live.

### v2.0.1 — Security & Authentication Hardening (2026-04-07)
Signup is now server-validated and rate-limited to 5 attempts per IP per day. Account security is stronger with required authenticator-app enrollment and a 10-minute MFA grace window after successful verification. Signup emails now include source IP monitoring, the chatbot stays mounted more reliably and can export replies to text or Excel, and the refreshed light theme now uses a light blue/white palette with clearer sign-out controls.

### v2.0.0 — Full UI Redesign (2026-04-07)
The entire interface has been rebuilt with a clean, minimal dark aesthetic — flat backgrounds, no gradients, no glow effects. The sidebar has clearer section groupings (Overview / Companies / Manage), the top nav is slimmer with breadcrumb navigation, and the font is now Arial at a comfortable 16px base size. A Contact page was added so users can reach support directly from the site.

### v1.5.x — Analytics, Exports & Onboarding (2026-04-06)
Year pages now open with six analytics dashboards (spend trend, category mix, top months, and more). Excel and CSV exports gained a yearly-summary option. New accounts are seeded with a sample company and demo expenses so you can explore the product immediately. An idle-session warning replaced the abrupt 5-minute sign-out.

### v1.5.0 — Company Layer & Team Settings (2026-04-05)
Expenses are now organized as **Company → Year → Month**. A full Settings area was added with Account, Team, and Security tabs. The main dashboard now shows account-wide spend analytics instead of a blank screen after login.

### v1.3.0 — Free Trial & Subscription Plans (2026-04-04)
Every new account gets a 30-day free trial with no credit card required. After the trial, choose from Personal ($5/mo), Lite ($10/mo), Business ($25/mo), or Elite ($100/mo). A public pricing page explains each plan, and a subscription page appears automatically when the trial ends.

### v1.2.0 — Light / Dark Mode (2026-04-04)
Full light and dark theme support with a one-click toggle. Your preference is saved across sessions and applied before the page loads so there is no flash of the wrong theme.

### v1.1.0 — Landing Page & Expense Chatbot (2026-04-04)
A proper public landing page replaced the old direct-to-dashboard redirect. An AI-powered chatbot (floating button, bottom-right) now lets you ask plain-English questions about your expenses — totals, categories, top vendors, and more.

### v1.0.0 — Two-Factor Authentication & Password Reset (2026-04-04)
All accounts now support TOTP 2FA via an authenticator app, with an email OTP fallback. A "Forgot password?" flow was added to the sign-in page.

### v0.4.0 — Receipt Uploads & Folder Deletes (2026-03-29)
Attach receipts (images, PDFs, Office docs) to any expense from a gallery modal with drag-and-drop support. Years and months can now be deleted from the sidebar with a soft-delete safety net.

### v0.2.0 — Full App Rebuild (2026-03-24)
Migrated from a vanilla JS proof-of-concept to a full Next.js 14 application backed by Supabase. Added authentication, cloud storage, a 4-step import wizard, and exports to Excel, CSV, and QuickBooks (QBO/OFX).

---

## [2.2.4] — 2026-04-08

### Added

#### Subscription Plans
- Added a new `Virtual Private Server` plan at `$250/month`
- Added VPS messaging across pricing, subscribe, PayPal order creation, and account upgrade flows
- Positioned the VPS offering as an isolated, secured copy of Accountant's Best Friend running on the customer's own server

#### Yearly Exports
- Added a `Yearly Analysis & Export` section to year views
- Enabled full-year export in CSV, Excel, and QBO formats from the year page using the same export workflow available for monthly analysis

### Fixed

#### Password Recovery
- Fixed the reset-password flow so Supabase recovery links correctly establish a recovery session before allowing the password update
- Added support for both URL hash token recovery links and PKCE `code`-based recovery links

### Changed

#### Production Security
- Added middleware that redirects production HTTP traffic to HTTPS when the deployed proxy forwards `x-forwarded-proto`
- Kept localhost and development traffic unaffected so local development continues to work normally

---

## [2.2.3] — 2026-04-07

### Added

#### Public Website
- Replaced the public homepage with a full features-and-capabilities landing page
- Added workflow and capability diagrams to explain imports, organization, analysis, collaboration, and secure exports

### Changed

#### Navigation / Sign Out
- Moved `Sign Out` from the top nav into the bottom-left sidebar area
- Added a larger, more visible exit-style sign-out control in the sidebar footer

#### Team Account Data Access
- Added owner-account resolution so invited/team users load companies, folders, expenses, and trash from the correct account context
- Added migration `011_allow_team_member_account_data_access.sql` to extend RLS policies for shared account access

#### Company Trash
- Added company-level trash support so whole companies can be moved to Trash and restored later
- Preserved year folders and customer subfolders when restoring a deleted company
- Added migration `012_add_company_trash_support.sql` for company soft-delete tracking

#### Privacy Policy
- Removed the child privacy clause from the Privacy Policy and renumbered the remaining sections

---

## [2.2.2] — 2026-04-07

### Changed

#### Navigation / Sidebar
- Removed the last remaining collapsible/mobile menu trigger from the dashboard shell and top navigation
- Rebalanced the enlarged sidebar logo area so company folders remain visible instead of being pushed down the panel

#### Top Navigation
- Updated the plan badge text to read `Current Plan: ...`
- Kept the `Sign Out` action pinned to the far left side of the top nav and always visible

---

## [2.2.1] — 2026-04-07

### Added

#### Site Administration
- Added a master site admin mapping tied to the existing `vic@alpina.net` account
- Added an admin-only `/settings/admin` dashboard for reviewing active customer account state
- Added server-side admin account reporting for subscription status, sign-in recency, company counts, and team-member counts

#### Account Details
- Added persistent account profile storage for account name, business name, contact details, phone, website, and mailing address
- Added an expanded Account Settings form to manage those business/contact details directly in the app

#### Customer Subfolders
- Added `customer_subfolders` support so users can create customer folders under each `Company / Year`
- Added subfolder creation in the sidebar and dedicated year-level subfolder cards/pages

### Changed

#### Chatbot Branding
- Renamed the chatbot to `Alladin`
- Replaced the generic bot icon with a genie-style mark in the launcher and chat header

#### Navigation
- Removed the dashboard sidebar collapse toggle so the left navigation stays consistently open

---

## [2.2.0] — 2026-04-07

### Changed

#### Theme
- Replaced blue accent palette with warm black + Claude-orange (`#DA7756` dark / `#C4603D` light) across the entire site
- Dark mode backgrounds shifted from cool blue-black to warm brown-black (`#0a0907` / `#131110` / `#1d1a17`)
- Light mode backgrounds shifted from blue-tinted whites to warm cream/parchment (`#faf8f5` / `#f2ede7` / `#e8e0d6`)
- All text, borders, and muted colors updated to match the warm palette

#### Branding / Logo
- Created shared `SiteLogo` component — theme-aware, uses `logo-dark.jpeg` / `logo-light.jpeg`
- Logo now appears consistently on: login header, login card, pricing, subscribe, reset-password, settings layout, and public footer
- Replaced all remaining `LuChartBar` placeholder icons in headers with the real logo

#### Login Page
- Added site header (logo + nav links to Pricing and Contact)
- Added `PublicFooter` matching every other public page

### Added

#### Legal Pages
- New `/privacy` — Privacy Policy (8 sections): data collected, usage, storage & security, cookies, retention, user rights, changes, contact
- New `/terms` — Terms of Service (12 sections): service description, eligibility, subscriptions & payments, acceptable use, data ownership, no tax advice disclaimer, availability, liability, termination, governing law, contact

---

## [2.1.0] — 2026-04-07

### Added

#### PayPal Payment Integration
- Added "Buy it now" button to every plan card on the public pricing page — links directly to the subscribe/checkout flow
- Subscribe page now shows PayPal Smart Payment Buttons (Buy Now) for each plan, powered by `@paypal/react-paypal-js`
- New `/api/paypal/create-order` route — creates a PayPal order server-side for the selected plan amount
- New `/api/paypal/capture-order` route — verifies and captures the PayPal payment, then activates the subscription
- Supports sandbox mode (`PAYPAL_SANDBOX=true`) for testing without real charges
- Gracefully falls back to direct plan selection when PayPal credentials are not yet configured

---

## [2.0.1] — 2026-04-07

### Changed

#### Authentication / Security
- Added a server-side signup route so account creation is validated and controlled on the backend instead of only in the browser
- Added IP tracking to signup notifications so new-account emails include the source IP address
- Added signup attempt limiting with a cap of 5 attempts per IP address within a 24-hour window
- Added a required authenticator-app 2FA registration flow as part of account onboarding
- Existing account sign-ins now route through the 2FA registration flow when no authenticator has been enrolled
- Added a dedicated `/mfa/setup` flow for enrolling and confirming TOTP during account setup
- Added a 10-minute post-verification MFA trust window so recently verified users are not prompted again immediately on the same browser

#### Email / Notifications
- Fixed SMTP2GO configuration and production email wiring for signup notifications
- Added resend support and stable production redirect handling for signup confirmation emails

#### Chatbot / Exports
- Moved the chatbot into persistent authenticated layouts so it stays available while navigating between dashboard views
- Added one-click download of chatbot replies as text files
- Added Excel export for chatbot responses that contain tabular data

#### Theme / Navigation
- Refreshed the site-wide light theme to a light blue/white palette with darker text for readability
- Adjusted dark theme text to use a slightly off-white contrast color
- Added a more obvious left-side sign-out button in authenticated top bars

## [2.0.0] — 2026-04-07

### Changed

#### UI Redesign
- Complete visual overhaul to a minimal dark platform aesthetic inspired by modern developer tools
- Replaced blue-tinted dark palette with true near-black backgrounds (`#0a0a0a` / `#111` / `#1a1a1a`)
- Removed all body gradients, grid overlays, and glow effects — fully flat design
- Sidebar redesigned with section headers (Overview / Companies / Manage), compact 52px collapsed state, and clean icon + text nav items
- TopNav slimmed to 56px with breadcrumbs on the left and action icons on the right
- Settings link added to sidebar Manage section
- Theme toggle simplified to a single sun/moon icon button
- Sign out replaced with a clean icon button

---

## [1.5.7] — 2026-04-07

### Fixed

#### Chatbot
- Updated Anthropic API key to active account with credits — chatbot fully restored
- Removed unused OpenAI API key from configuration

---

## [1.5.6] — 2026-04-07

### Fixed

#### Chatbot
- Switched expense chatbot from OpenAI (quota exceeded) to Claude (`claude-haiku`) — chatbot is fully functional again
- All chat features preserved: expense Q&A, category breakdowns, delete intent detection with confirmation flow

#### Authentication
- Sign out now reliably lands on the public home page in all cases — fixed race condition where `AuthGuard` was redirecting to `/login` before the sign-out navigation completed

### Changed

#### Branding
- Added official Accountant's Best Friend logo to the public landing page nav (dark/light theme-aware)
- Logo enlarged to 80×80px in the top nav and sidebar for better visibility
- Top nav height increased to accommodate the larger logo

---

## [1.5.4] — 2026-04-06

### Changed

#### Visual Polish
- Refined the authenticated dashboard experience with a more cohesive visual system across the main dashboard, year view, month view, top navigation, and sidebar
- Introduced stronger typography hierarchy, elevated panel styling, richer background atmosphere, and more consistent spacing so the product feels more premium and intentional

#### Analytics Presentation
- Upgraded summary cards, category breakdown panels, and chart framing to improve scanability and perceived quality
- Year and month pages now use stronger hero sections and better section framing to make analytics feel more dashboard-like and less like stacked utility cards

#### Navigation Experience
- Refined the left navigation with improved section treatment, cleaner active states, better indentation rhythm, and a more polished release badge treatment
- Updated the top navigation styling so breadcrumbs, plan badge, wizard CTA, and account actions better match the new visual language

## [1.5.3] — 2026-04-06

### Changed

#### Year View Analytics
- Year pages now open with six high-value dashboards including snapshot KPIs, spend trend, category mix, top spending months, largest transactions, and yearly insights
- Year pages still retain the month folder grid underneath the dashboards for quick navigation into monthly detail

#### Exports
- Added an optional yearly-summary mode to exports
- Excel exports can now include a dedicated `Yearly Summary` sheet with annual rollups and month-by-month totals
- CSV exports can now prepend a comprehensive yearly summary section ahead of transaction rows
- QBO exports can now download a companion yearly-summary CSV so QuickBooks files remain clean while still providing reporting metrics

#### Session Handling
- Replaced the abrupt 5-minute idle sign-out with a warning flow
- Users now see a 60-second session-expiring modal after 4 minutes of inactivity, with `Stay signed in` and `Sign out now` options

#### Year / Month Navigation
- Added an `Add Missing Month` action on year pages so users can open any zero-activity month directly and start importing data there

## [1.5.2] — 2026-04-06

### Changed

#### First-Login Experience
- Brand-new accounts now get a real `Sample Company` created automatically on first login
- The seeded sample company includes demo expenses that match the sample dashboard reports, so first-time users can explore realistic folders and analytics immediately
- Sample dashboard fallback visuals now reuse the same shared dataset as the seeded demo company to keep reports and example data fully aligned

#### Theme Defaults
- Dark mode is now the default again for first-time visitors
- Saved theme preference still overrides the default, and the pre-hydration theme script now avoids a flash of the wrong theme on first load

## [1.5.1] — 2026-04-05

### Changed

#### Dashboard Polish
- Year pages now open with a richer visual summary including annual spend, transaction count, active months, and improved month cards
- Month pages now use a more polished analysis layout with KPI cards, a stronger hero section, and cleaner analytics panels
- Empty year and month states now feel more intentional and guided instead of looking sparse

#### Company Management
- Companies can now be renamed directly from the sidebar
- Renaming a company also updates related expense and folder records so navigation stays in sync

#### Authentication / Account Experience
- Sign-up now clears stale sessions before creating a new account so new users are not dropped into someone else’s session
- Email signup confirmations now redirect back to the live website login page instead of falling back to `localhost:3000`
- Users on inherited team access now correctly see the effective account plan badge in the top-right dashboard nav
- Light mode is now the default for first-time visitors, while saved theme preference still takes precedence

#### Chatbot / Navigation
- Expense chat is now powered by OpenAI and supports the `OPENAI_API_KEY` configuration path
- Chatbot delete requests now show a delete summary first and only proceed after the user types exactly `I agree`
- Chat-based deletes move matching expenses to Trash in Supabase instead of permanently removing them
- Authenticated app version display was moved into the left navigation sidebar for easier visibility
- Signing out now returns users to the public home page instead of leaving them inside the authenticated shell
- Added a server-side signup notification route that can email `vsawhney@amvean.com` through SMTP2GO when a new user account is created

#### Pricing / Subscription Model
- Added a new `Personal` plan tier priced at **$5/month** for a single user with up to 500 transactions
- Updated `Lite` to include **unlimited transactions**
- Added DB plan validation via `migrations/005_update_subscription_plan_constraint.sql`
- Added subscription metadata fields for `plan_expires_at` and `allowed_active_users` via `migrations/006_add_subscription_metadata.sql`
- Account settings now show the stored subscription expiration date and allowed active-user count
- Added updated team-seat policy logic via `migrations/007_update_account_member_seat_policy.sql` so Business and Elite seat enforcement can use stored active-user allowances

#### Imports / Sample Data
- "Try Sample Data" now rewrites sample transactions into the currently selected year before import
- Sample-data imports now report when duplicate rows were skipped instead of silently appearing to do nothing

## [1.5.0] — 2026-04-05

### Added

#### Company-Level Folder Organization
- Added a real company layer above year/month folders so the dashboard navigation is now **Company → Year → Month**
- New `companies` table and `company_name` support on folder/expense records via `migrations/004_add_companies.sql`
- Sidebar now supports adding companies, then adding years underneath each company
- Dashboard routes now support company-aware URLs like `/dashboard/{company}/{year}/{month}`
- Legacy year/month dashboard URLs are redirected into the default company path for backward compatibility
- CSV imports and wizard saves now write expenses into the selected company

#### Team / Account Settings
- Added a dedicated Settings layout with Account, Team, and Security navigation
- New `/settings/account` page with plan summary and password update flow
- New `/settings/team` page for managing team members by email
- Added `account_members` table and policies via `migrations/003_add_account_members.sql`
- Team-member access now checks owner subscriptions correctly before creating a personal trial
- Team seat limits are enforced in app logic and row-level policies

#### Dashboard Analytics Landing View
- Replaced the placeholder post-login dashboard with a real analysis overview
- Dashboard now shows account-wide spend visuals including summary cards, spend trend, expense-by-category, and year-over-year analysis
- Empty accounts now see clearly labeled sample analytics instead of blank placeholders

### Changed

#### Navigation / Header
- Top-right dashboard nav now shows the current account type (Trial, Lite, Business, Elite)
- Chat API now supports the existing `claude_key` environment variable, with `ANTHROPIC_API_KEY` retained as a fallback

## [1.4.0] — 2026-04-04

### Changed

#### Corporate Blue Color Theme
- Replaced yellow/gold accent (`#F8D448`) with corporate blue (`#3B82F6` dark / `#2563EB` light)
- Updated dark-mode backgrounds to a deeper navy palette (`#0F1117`, `#161B27`, `#1E2638`)
- Light-mode backgrounds updated to a cool blue-tinted white (`#F1F5FB`, `#E4EAF5`)
- All `--accent-primary` / `--accent-dark` CSS vars updated — no component changes needed

#### Legal Footer
- New `PublicFooter` component with copyright notice, nav links (Pricing, Privacy Policy, Terms of Service, Sign In), and tax-disclaimer language
- Replaces the minimal footer on the landing page and pricing page

---

## [1.3.0] — 2026-04-04

### Added

#### Free Trial + Subscription Plans
- **30-day free trial** automatically started for every new account — no credit card required
- **3 paid plans** enforced after trial expiration:
  - **Lite** ($10/mo) — 1 user, up to 500 transactions, unlimited years
  - **Business** ($25/mo) — up to 4 users, unlimited transactions, 5 years of data
  - **Elite** ($100/mo) — up to 20 users, unlimited transactions, unlimited years
- `subscriptions` table in Supabase with RLS (see `migrations/002_add_subscriptions.sql`)
- `src/lib/subscription.ts` — `getSubscription`, `createTrialSubscription`, `selectPlan`, `isAccessAllowed`, `trialDaysRemaining`
- `src/lib/useSubscription.ts` — React hook for reading subscription in components
- `/pricing` — public pricing page with plan cards, feature lists, and FAQ
- `/subscribe` — authenticated plan-selection page shown when trial expires; includes trial-days-remaining banner or expired warning
- `AuthGuard` updated: auto-creates trial subscription for new users; redirects to `/subscribe` when trial or plan is expired
- "Trial" pill badge in TopNav (dashboard header) for users still in trial — links to `/subscribe`
- "Pricing" nav link added to the landing page header

---

## [1.2.0] — 2026-04-04

### Added

#### Light / Dark Mode
- Full light and dark theme support via CSS custom properties — zero Tailwind color hardcoding
- Dark mode is the default; light mode uses a clean warm-white palette
- Theme persists to `localStorage` and respects `prefers-color-scheme` on first visit
- Inline `<script>` in `layout.tsx` applies the saved theme class before React hydrates, preventing any flash of wrong theme
- Quirky animated pill toggle (moon left / sun right) in the top-right of the nav bar on both the landing page and dashboard
- Toggle glows yellow on hover as a visual call-out so it's easy to find

---

## [1.1.0] — 2026-04-04

### Added

#### Landing Page
- New public landing page at `/` replacing the old redirect to `/dashboard`
- Hero section with headline, CTA buttons, and feature description
- 6-feature grid (CSV import, IRS categorization, charts, export, receipts, security)
- "How it works" 4-step section
- Benefits checklist and second CTA
- Consistent nav with Sign In + Try it free buttons

#### Expense Chatbot
- Floating bot button (bottom-right) available on all dashboard pages
- Clicking opens a chat panel — asks questions about the user's expenses in plain English
- Context-aware: on a month page, only that month's expenses are loaded; on the main dashboard, all expenses are included
- Powered by Claude (`claude-sonnet-4-6`) via a secure `/api/chat` route
- API route authenticates the user via Supabase session cookie — no data leaks to other users
- Suggested starter questions shown on first open
- Streaming-style feel with a "Thinking..." indicator

---

## [1.0.0] — 2026-04-04

### Added (2FA + password reset, combined into 1.0)

See v0.8.0 and v0.9.0 entries below.

---

## [0.9.0] — 2026-04-04

### Added

#### Two-Factor Authentication (2FA) — forced for all users
- **TOTP (Authenticator App)**: users can enroll Google Authenticator, Authy, or any TOTP app via QR code on the Security Settings page (`/settings/security`)
- **Email OTP fallback**: if no authenticator app is enrolled, users can request a one-time code sent to their email
- After signing in, if the user has a verified TOTP factor, `AuthGuard` detects the unverified MFA state and redirects to `/mfa/verify` before granting dashboard access
- `/mfa/verify` page: tabbed interface for Authenticator vs Email OTP, sign-out escape hatch
- `/settings/security` page: enroll TOTP (QR code + manual secret), verify enrollment, remove factor
- Shield icon in `TopNav` links directly to security settings
- `auth.tsx`: added `mfaRequired` state, `listMFAFactors`, `enrollTOTP`, `verifyTOTPEnrollment`, `challengeAndVerifyMFA`, `unenrollMFA`, `sendEmailOTP` to `AuthContext`
- `AuthGuard` updated to redirect to `/mfa/verify` when `mfaRequired` is true

---

## [0.8.0] — 2026-04-04

### Added

#### Password Reset
- "Forgot password?" link on the Sign In form — switches to a single-field email view
- `sendPasswordReset(email)` in `auth.tsx` calls Supabase's `resetPasswordForEmail` with redirect to `/reset-password`
- New `/reset-password` page — validates the recovery session from the email link, accepts a new password + confirmation, shows success state and redirects to dashboard
- Invalid/expired links show a clear error with a "Back to Sign In" button
- `updatePassword(newPassword)` added to `AuthContext`

---

## [0.7.0] — 2026-04-04

### Fixed

#### High — Restoring expense from deleted year left it orphaned
- `restoreExpense()` now calls `createYearFolders()` after clearing `deleted_at`, re-creating the folder row that was hard-deleted when the year was trashed
- Restored expenses are immediately visible in the sidebar again

#### High — Permanent delete leaked receipt files in Supabase Storage
- `permanentDeleteReceipts()` now fetches `storage_path` for each receipt before deleting DB rows, then calls `supabase.storage.remove()` to delete the actual blobs from the `expense-receipts` bucket
- Storage errors are logged but do not block DB cleanup to avoid leaving the user stuck
- Fixes ongoing orphaned-blob storage cost from permanent deletes and "Empty Trash"

#### Medium — Wizard mishandled multi-year imports
- `StepFolders` now detects **all** unique years in the imported data (not just the most common one), displays them grouped by year → month, and creates folder records for every year
- `bulkCreateExpenses()` and `createExpense()` now call `createYearFolders()` for every year present in the data before inserting rows — belt-and-suspenders guard so even non-wizard code paths cannot create invisible expenses

#### Medium — Duplicate prevention was race-prone (client-side only)
- Added `migrations/001_add_expense_dedup_index.sql` which creates a `UNIQUE` index on `(user_id, date, description, amount, filename)`
- `bulkCreateExpenses()` now uses `.upsert(..., { onConflict, ignoreDuplicates: true })` mapping to `INSERT ... ON CONFLICT DO NOTHING`
- If the migration has not been applied yet, the upsert error is caught and it falls back to plain `.insert()`, preserving the existing client-side dedup

### Added

- `migrations/001_add_expense_dedup_index.sql` — unique index for database-enforced expense deduplication

---

## [0.6.1] — 2026-04-04

### Fixed (autoresearch eval — artifact code review)

All fixes target the `artifacts/web/src/` UI layer. Main `src/` project is unaffected.

#### Critical — would cause build/runtime failures

- **`generateQBO` import regression**: MonthView imported `generateQBO` from `@/lib/export`, which was removed in v0.5.0 (used incorrect `TRNTYPE=CREDIT`). Replaced with `downloadQBO` from `@/lib/qbo-export` which correctly uses `TRNTYPE=DEBIT`.
- **`generateExcelReport` wrong call signature**: MonthView called `generateExcelReport(filtered)` with 1 argument, but the source function requires 3 (`expenses`, `aggregation`, `summary`). Removed the broken call; CSV and QBO remain as export options.
- **`formatMonthDisplay` missing**: MonthView imported `formatMonthDisplay` from `@/lib/date-utils`, but this function did not exist. Added it to both `src/lib/date-utils.ts` and the artifact's local `date-utils.ts`.
- **Phantom local imports**: Artifact files imported `@/lib/categories`, `@/lib/date-utils`, `@/lib/export`, `@/lib/qbo-export`, `@/lib/utils`, `@/pages/not-found`, and UI components that had no corresponding files in `artifacts/web/src/`. Created all missing files so the artifact layer is fully self-contained.
- **Unused `toDateString` import**: `expense-processor.ts` imported `toDateString` from `./date-utils` but never used it. Removed.

#### Medium — functional bugs

- **YearView full-page reload**: Chart bar clicks used `window.location.href` which caused a full page reload, losing all React state. Replaced with wouter's `useLocation` + `navigate()` for proper SPA navigation.
- **Export dropdown never closed**: MonthView's export dropdown had no outside-click handler, staying open indefinitely. Added `useEffect` with `mousedown` listener + `ref` to close on outside click.

#### Low — code smells / placeholder UX

- **Sidebar delete used `confirm()`**: Replaced browser `confirm()` with inline Yes/No buttons matching the v0.4.0 design spec.
- **Trash used `alert()`**: Replaced browser `alert()` for "Empty Trash" with an inline dismissible notification banner.
- **Help used `alert()`**: Replaced placeholder `alert("Docs coming soon!")` with a link to the project README.

### Added

- `artifacts/web/src/lib/categories.ts` — self-contained IRS category definitions (mirrors `src/lib/categories.ts`)
- `artifacts/web/src/lib/date-utils.ts` — timezone-safe date utilities including `formatMonthDisplay`
- `artifacts/web/src/lib/export.ts` — CSV export with browser download trigger
- `artifacts/web/src/lib/qbo-export.ts` — QBO/OFX export using correct `TRNTYPE=DEBIT` with negative `TRNAMT`
- `artifacts/web/src/lib/utils.ts` — `cn()` utility for Tailwind class merging
- `artifacts/web/src/pages/not-found.tsx` — 404 page component
- `artifacts/web/src/components/ui/Button.tsx` — Button component (shadcn/ui compatible)
- `artifacts/web/src/components/ui/Badge.tsx` — Badge component with emerald variant
- `artifacts/web/src/components/ui/toaster.tsx` — Toaster stub
- `artifacts/web/src/components/ui/tooltip.tsx` — TooltipProvider stub
- `src/lib/date-utils.ts` — added `formatMonthDisplay()` export
- `eval_v060.sh` — 57-criterion autoresearch eval suite for v0.6.0 artifact code

### Eval Results
- **v0.6.1 eval: 57/57 criteria PASS (100.0%)** — all critical, medium, and low issues resolved
- **v0.5.0 eval: 24/24 criteria PASS (100.0%)** — no regressions
- TypeScript compilation: zero errors (`tsc --noEmit` clean)
- ESLint: no warnings or errors (`next lint` clean)

---

## [0.6.0] — 2026-04-04

  ### Added / Improved (UI overhaul — frontend only)

  #### Login page
  - Feature pills replaced with inline badge chips (IRS Schedule C · Smart CSV import · Excel & QBO)
  - Emerald glow card effect on the sign-in card
  - "Trusted by self-employed professionals" tagline below CTA

  #### Top Navigation
  - Logo icon animates with a pulsing emerald glow ring
  - User avatar shows a green "online" dot indicator
  - Logout icon rotates on hover; button turns red

  #### Sidebar
  - "Import CSV" promoted to a bright emerald CTA button
  - Year/month folder pills show spend totals
  - Framer Motion smooth expand/collapse on folder groups
  - Empty-state guide with dashed border pointing users to import

  #### Dashboard (empty state)
  - Personalized welcome greeting using the authenticated user's name
  - Three numbered "Getting Started" step cards
  - Large Import CSV card with glowing border
  - Three feature highlight pills

  #### Import Wizard
  - Full drag-and-drop zone with marching dashed-border animation that glows on hover
  - Numbered step circles with connecting lines and checkmarks on completed steps
  - Step 2 shows transaction count + total amount summary
  - Step 4 confetti CSS animation on successful import

  #### Month View
  - Color-coded category dot next to each expense row
  - Export buttons consolidated into a clean dropdown menu
  - Skeleton loading rows while data fetches
  - Top Category stat card (4th metric)
  - Empty-search friendly state message

  #### Year View
  - Month cards link directly to their month view with "View Month →" hover overlay
  - Chart bars are also clickable

  #### Trash
  - Improved empty-state illustration
  - Category column restored

  ### Fixed

  - `parseCSVLine`: fixed `text` (undefined) → `line` variable reference in escaped-quote detection branch
  - `parseDateToISOString`: replaced `new Date(rawDate)` timezone-sensitive parsing with explicit format matchers (MM/DD/YYYY, YYYY-MM-DD, MM-DD-YYYY, YYYY/MM/DD)
  - Amount guard: skip rows where `|amount| > $999,999.99` — prevents mis-detected balance/account-number columns from causing DB overflow
  - Import now throws a user-friendly error when zero valid rows are parsed

  
## [0.5.0] — 2026-04-04

### Fixed

#### P0 — Missing Receipt & ReceiptUploadResult types (CRITICAL)
- Added `Receipt` and `ReceiptUploadResult` interfaces to `src/types/index.ts`
- `Receipt` includes all 9 fields used by components: `id`, `expense_id`, `user_id`, `filename`, `storage_path`, `file_type`, `size_bytes`, `created_at`, `deleted_at`
- Resolves TypeScript compilation failures in 7 files that imported these types

#### P0 — folders table `deleted_at` column mismatch (CRITICAL)
- `softDeleteYear()` was calling `.update({ deleted_at })` on the `folders` table, which has no `deleted_at` column — causing silent runtime errors
- Changed `softDeleteYear()` to use `.delete()` on the folders row instead
- Changed `restoreYear()` to use `.upsert()` to recreate the folder record (since it was hard-deleted)

#### P1 — CSV export UTC date off-by-one bug
- `generateCSV()` in `export.ts` used `e.date.toISOString().split('T')[0]` which converts to UTC and can shift the date by one day in US timezones
- Replaced with `toDateString()` from `date-utils.ts` which uses local time consistently
- Added `instanceof Date` safety guard for date values that may arrive as strings

#### P1 — Duplicate incorrect QBO generator in export.ts
- Removed the `generateQBO()` function from `export.ts` which incorrectly used `TRNTYPE=CREDIT` (would import as deposits in QuickBooks, not expenses)
- The correct implementation in `qbo-export.ts` (`generateQBOFile()` / `downloadQBO()`) uses `TRNTYPE=DEBIT` with negative `TRNAMT` and remains the sole QBO export path
- All callers (`ExportMenu`, `StepExport`) already use `generateQBOFile` from `qbo-export.ts` — no orphaned references

#### P1 — No deduplication on CSV re-import
- Re-importing the same CSV file previously created duplicate expense rows (the comment mentioned ON CONFLICT DO NOTHING, but no unique index existed)
- Added client-side deduplication to `bulkCreateExpenses()`: before inserting, it fetches existing expenses for the affected year(s) and builds a dedup key set from `(date, description, amount, filename)`
- Duplicate rows are silently filtered out before the batch insert
- Also deduplicates within the same CSV batch (prevents intra-file duplicates)
- Returns 0 early when all rows are duplicates, avoiding unnecessary insert calls

### Eval Results (autoresearch-style grading)
- **24/24 criteria PASS (100.0%)** — all 5 fixes verified across 24 automated eval criteria
- TypeScript compilation: zero errors (`tsc --noEmit` clean)
- ESLint: no warnings or errors (`next lint` clean)

---

## [0.4.0] — 2026-03-29

### Added

#### Receipt Uploads per Expense
- Every expense row in the table now has a clickable receipt cell
- Rows with no receipts show a camera-plus icon to signal upload availability; rows with existing receipts show a count badge
- Clicking either opens a **Receipt Gallery modal** that combines viewing and uploading in one place
- The gallery supports drag-and-drop file upload as well as a "Upload Receipt" button in the footer
- Supported formats: JPG, PNG, WebP, PDF, DOCX, XLSX, TXT (max 50 MB per file)
- Newly uploaded receipts appear in the gallery immediately without closing the modal
- Receipts can be downloaded or soft-deleted from the gallery

#### Delete Year
- Hover over any year node in the sidebar to reveal a trash icon
- Clicking shows an inline Yes/No confirmation prompt
- Confirming soft-deletes the year folder and all its expenses (moved to trash bin, recoverable)
- If the user is currently viewing a page within that year, they are redirected to the dashboard

#### Delete Month
- Hover over any month node in the sidebar (months with expenses) to reveal a trash icon
- Same inline confirmation pattern as year delete
- A **Delete Month** button also appears in the month page header for discoverability
- Confirming soft-deletes all expenses in that month
- If the user is currently viewing that month, they are redirected to the dashboard

### Changed

- `ReceiptGallery` now manages its own internal receipts state (initialized from props) so uploads and deletes reflect instantly without requiring a parent re-fetch
- `ReceiptGallery` now requires an `expenseId` prop (used to attach uploaded files to the correct expense)
- Month page (`[year]/[month]/page.tsx`) now loads receipts for all expenses in a single extra query (`getReceiptsByExpenseIds`) after the expense fetch, and passes them down to `ExpenseTable`
- `FolderTree` imports `softDeleteYear` and `softDeleteMonth` and handles delete confirmation inline

### Fixed

- `permanentDeleteExpense` called `deleteReceiptsForExpense` which was never defined, causing a runtime error when attempting to permanently remove an expense. Fixed by inlining the correct calls to `getAllReceiptsForExpense` + `permanentDeleteReceipts`.

### Database / API

- New function `softDeleteMonth(userId, year, month)` — soft-deletes all active expenses in a month
- New function `getReceiptsByExpenseIds(userId, expenseIds[])` — fetches all non-deleted receipts for a list of expense IDs in one query; returns `Record<expenseId, Receipt[]>`

---

## [0.3.0] — 2026-03-24

### Fixed (audit findings)

- Data integrity: unique constraint on `(user_id, date, description, amount, filename)` prevents duplicate imports
- Timezone: all date-only values parsed as local noon to avoid UTC off-by-one bug
- Bulk insert: expenses batch-inserted in chunks of 500 instead of row-by-row
- QBO export: all transactions emit `TRNTYPE=DEBIT` with negative `TRNAMT` for correct QuickBooks import
- CSV parser: improved RFC 4180 compliance (quoted fields, escaped quotes, multiline values)

---

## [0.2.0] — 2026-03-24

### Added

- Next.js 14 App Router migration from legacy vanilla JS
- Supabase Auth (email/password + Google OAuth)
- Supabase PostgreSQL with Row Level Security
- Soft delete / trash bin with restore
- 4-step wizard (Upload → Organize → Categorize → Export)
- Export to Excel (multi-sheet), CSV, and QBO/OFX

---

## [0.1.0] — 2026-03-02

- Vanilla HTML/CSS/JS proof of concept (archived in `_legacy/`)
- CSV drag-and-drop, IRS category matching, basic expense table
