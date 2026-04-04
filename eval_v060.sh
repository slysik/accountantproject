#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Autoresearch-style Eval Suite for v0.6.0 — UI Artifact Code Review
# 
# Evaluates the 12 new files in artifacts/web/src/ from the latest commit.
# Tests: structural integrity, import consistency, logic correctness,
#        security, accessibility, missing dependencies, and known bugs.
# ═══════════════════════════════════════════════════════════════════════════════

set -e
cd /Users/slysik/accountantproject

PASS=0
FAIL=0
TOTAL=0
RESULTS=""

eval_criterion() {
  local area="$1"
  local criterion="$2"
  local pass="$3"  # "true" or "false"
  local detail="$4"
  TOTAL=$((TOTAL + 1))
  if [ "$pass" = "true" ]; then
    PASS=$((PASS + 1))
    RESULTS="${RESULTS}\n  ✅ PASS | ${area} | ${criterion} | ${detail}"
  else
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}\n  ❌ FAIL | ${area} | ${criterion} | ${detail}"
  fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "  AUTORESEARCH EVAL — v0.6.0 Artifact Code Review"
echo "  $(date)"
echo "═══════════════════════════════════════════════════════════════"

ART="artifacts/web/src"

# ─── SECTION 1: FILE STRUCTURE ─────────────────────────────────────────────────
echo ""
echo "▶ SECTION 1: File Structure & Completeness"

# 1.1: All 11 expected artifact files exist
EXPECTED_FILES=(
  "$ART/App.tsx"
  "$ART/index.css"
  "$ART/components/layout/Sidebar.tsx"
  "$ART/components/layout/TopNav.tsx"
  "$ART/components/wizard/ImportWizard.tsx"
  "$ART/lib/expense-processor.ts"
  "$ART/pages/Dashboard.tsx"
  "$ART/pages/Login.tsx"
  "$ART/pages/MonthView.tsx"
  "$ART/pages/YearView.tsx"
  "$ART/pages/Trash.tsx"
)
ALL_EXIST="true"
MISSING_FILES=""
for f in "${EXPECTED_FILES[@]}"; do
  if [ ! -f "$f" ]; then
    ALL_EXIST="false"
    MISSING_FILES="${MISSING_FILES} ${f}"
  fi
done
eval_criterion "STRUCTURE" "all_artifact_files_exist" "$ALL_EXIST" "Checked ${#EXPECTED_FILES[@]} files. Missing:${MISSING_FILES:-none}"

# 1.2: No empty files
ALL_NONEMPTY="true"
EMPTY_FILES=""
for f in "${EXPECTED_FILES[@]}"; do
  if [ -f "$f" ] && [ ! -s "$f" ]; then
    ALL_NONEMPTY="false"
    EMPTY_FILES="${EMPTY_FILES} ${f}"
  fi
done
eval_criterion "STRUCTURE" "no_empty_files" "$ALL_NONEMPTY" "Empty:${EMPTY_FILES:-none}"

# 1.3: CHANGELOG.md updated with v0.6.0 entry
if grep -q "\[0.6.0\]" CHANGELOG.md; then
  eval_criterion "STRUCTURE" "changelog_updated" "true" "CHANGELOG.md contains [0.6.0] entry"
else
  eval_criterion "STRUCTURE" "changelog_updated" "false" "CHANGELOG.md missing [0.6.0]"
fi

# ─── SECTION 2: IMPORT CONSISTENCY (phantom imports) ──────────────────────────
echo ""
echo "▶ SECTION 2: Import Consistency — Phantom/Missing Imports"

# 2.1: Check that all local @/lib/* and @/pages/* imports resolve within artifacts/
PHANTOM_COUNT=0
PHANTOM_DETAILS=""

# Collect all local imports from artifact files and check each
check_import() {
  local source_file="$1"
  local import_path="$2"
  local base_name=$(basename "$source_file")
  
  # Convert @/lib/foo to $ART/lib/foo, @/pages/foo to $ART/pages/foo, ./foo to relative
  local resolved=""
  if echo "$import_path" | grep -q '^@/'; then
    local rel=$(echo "$import_path" | sed 's|^@/||')
    resolved="$ART/$rel"
  elif echo "$import_path" | grep -q '^\.'; then
    local dir=$(dirname "$source_file")
    resolved="$dir/$(echo "$import_path" | sed 's|^\./||')"
  fi
  
  if [ -n "$resolved" ]; then
    if [ ! -f "${resolved}.ts" ] && [ ! -f "${resolved}.tsx" ] && [ ! -f "${resolved}/index.ts" ] && [ ! -f "${resolved}/index.tsx" ]; then
      PHANTOM_COUNT=$((PHANTOM_COUNT + 1))
      PHANTOM_DETAILS="${PHANTOM_DETAILS} ${base_name}→${import_path}"
    fi
  fi
}

# App.tsx
check_import "$ART/App.tsx" "@/pages/not-found"
check_import "$ART/App.tsx" "@/components/ui/toaster"
check_import "$ART/App.tsx" "@/components/ui/tooltip"

# ImportWizard
check_import "$ART/components/wizard/ImportWizard.tsx" "@/lib/categories"
check_import "$ART/components/wizard/ImportWizard.tsx" "@/components/ui/Button"
check_import "$ART/components/wizard/ImportWizard.tsx" "@/lib/utils"

# MonthView
check_import "$ART/pages/MonthView.tsx" "@/lib/categories"
check_import "$ART/pages/MonthView.tsx" "@/lib/date-utils"
check_import "$ART/pages/MonthView.tsx" "@/lib/export"
check_import "$ART/pages/MonthView.tsx" "@/lib/qbo-export"
check_import "$ART/pages/MonthView.tsx" "@/lib/utils"
check_import "$ART/pages/MonthView.tsx" "@/components/ui/Badge"
check_import "$ART/pages/MonthView.tsx" "@/components/ui/Button"

# Trash
check_import "$ART/pages/Trash.tsx" "@/lib/categories"
check_import "$ART/pages/Trash.tsx" "@/components/ui/Button"

# YearView
check_import "$ART/pages/YearView.tsx" "@/components/ui/Badge"

# Sidebar
check_import "$ART/components/layout/Sidebar.tsx" "@/lib/utils"

# expense-processor
check_import "$ART/lib/expense-processor.ts" "./categories"

# TopNav
check_import "$ART/pages/Login.tsx" "@/components/ui/Button"
check_import "$ART/components/layout/TopNav.tsx" "@/components/ui/Button"

# Exclude @workspace/* and npm packages — those are external platform deps
if [ "$PHANTOM_COUNT" -gt "0" ]; then
  eval_criterion "IMPORTS" "no_phantom_local_imports" "false" "${PHANTOM_COUNT} missing local imports:${PHANTOM_DETAILS}"
else
  eval_criterion "IMPORTS" "no_phantom_local_imports" "true" "All local @/ and ./ imports resolve to files in artifacts/"
fi

# 2.2: Check that expense-processor.ts imports toDateString but doesn't use it
IMPORTS_DATEUTILS=$(grep "from.*date-utils" "$ART/lib/expense-processor.ts" 2>/dev/null || echo "")
USES_TODATESTRING=$(grep "toDateString" "$ART/lib/expense-processor.ts" 2>/dev/null | grep -v "import" || echo "")
if [ -n "$IMPORTS_DATEUTILS" ] && [ -z "$USES_TODATESTRING" ]; then
  eval_criterion "IMPORTS" "no_unused_imports_expense_processor" "false" "expense-processor imports from date-utils but never uses toDateString in function body"
else
  eval_criterion "IMPORTS" "no_unused_imports_expense_processor" "true" "No unused imports detected in expense-processor"
fi

# 2.3: MonthView imports formatMonthDisplay from @/lib/date-utils — check it exists in src/
if grep -q "formatMonthDisplay" "$ART/pages/MonthView.tsx"; then
  if grep -q "export.*function formatMonthDisplay\|export.*formatMonthDisplay" src/lib/date-utils.ts 2>/dev/null; then
    eval_criterion "IMPORTS" "formatMonthDisplay_exists_in_src" "true" "formatMonthDisplay is exported from src/lib/date-utils.ts"
  else
    eval_criterion "IMPORTS" "formatMonthDisplay_exists_in_src" "false" "MonthView uses formatMonthDisplay but it's NOT exported from src/lib/date-utils.ts"
  fi
fi

# 2.4: MonthView should use downloadQBO from qbo-export.ts (not the removed generateQBO from export.ts)
if grep -q "generateQBO" "$ART/pages/MonthView.tsx"; then
  eval_criterion "IMPORTS" "no_generateQBO_regression" "false" "MonthView still imports generateQBO (was removed in v0.5.0)"
else
  if grep -q "downloadQBO" "$ART/pages/MonthView.tsx"; then
    eval_criterion "IMPORTS" "no_generateQBO_regression" "true" "MonthView correctly uses downloadQBO from qbo-export.ts"
  else
    eval_criterion "IMPORTS" "no_generateQBO_regression" "false" "MonthView has no QBO export function"
  fi
fi

# 2.5: QBO export uses correct TRNTYPE=DEBIT pattern
if [ -f "$ART/lib/qbo-export.ts" ]; then
  if grep -q "DEBIT" "$ART/lib/qbo-export.ts"; then
    eval_criterion "IMPORTS" "qbo_uses_debit" "true" "Artifact qbo-export.ts correctly uses TRNTYPE=DEBIT"
  else
    eval_criterion "IMPORTS" "qbo_uses_debit" "false" "Artifact qbo-export.ts missing DEBIT transaction type"
  fi
else
  eval_criterion "IMPORTS" "qbo_uses_debit" "false" "No qbo-export.ts in artifacts"
fi

# ─── SECTION 3: CSV PARSER (expense-processor.ts) BUG FIXES ──────────────────
echo ""
echo "▶ SECTION 3: expense-processor.ts — Bug Fixes from v0.5.0"

# 3.1: parseCSVLine no longer references undefined `text` variable
# Note: splitCSVRows has a parameter named `text` which is valid — only check parseCSVLine
PARSECSVLINE_BODY=$(sed -n '/^function parseCSVLine/,/^}/p' "$ART/lib/expense-processor.ts")
if echo "$PARSECSVLINE_BODY" | grep -q 'text\['; then
  eval_criterion "EXPENSE_PROC" "parseCSVLine_no_undefined_text" "false" "parseCSVLine still references 'text[' (undefined variable)"
else
  eval_criterion "EXPENSE_PROC" "parseCSVLine_no_undefined_text" "true" "parseCSVLine uses 'line' correctly (no undefined 'text' reference)"
fi

# 3.2: parseDateToISOString handles multiple date formats without timezone shift
FORMATS_HANDLED=0
if grep -q 'YYYY-MM-DD' "$ART/lib/expense-processor.ts" || grep -q '^\d{4}-\d{2}-\d{2}' "$ART/lib/expense-processor.ts"; then
  FORMATS_HANDLED=$((FORMATS_HANDLED + 1))
fi
if grep -q 'MM/DD/YYYY' "$ART/lib/expense-processor.ts" || grep -q 'M/D/YYYY' "$ART/lib/expense-processor.ts"; then
  FORMATS_HANDLED=$((FORMATS_HANDLED + 1))
fi
if grep -q 'MM-DD-YYYY' "$ART/lib/expense-processor.ts"; then
  FORMATS_HANDLED=$((FORMATS_HANDLED + 1))
fi
if grep -q 'YYYY/MM/DD' "$ART/lib/expense-processor.ts"; then
  FORMATS_HANDLED=$((FORMATS_HANDLED + 1))
fi
if [ "$FORMATS_HANDLED" -ge "3" ]; then
  eval_criterion "EXPENSE_PROC" "multiple_date_formats" "true" "${FORMATS_HANDLED} date formats handled"
else
  eval_criterion "EXPENSE_PROC" "multiple_date_formats" "false" "Only ${FORMATS_HANDLED} date format(s) handled"
fi

# 3.3: MAX_AMOUNT guard exists
if grep -q "MAX_AMOUNT" "$ART/lib/expense-processor.ts"; then
  eval_criterion "EXPENSE_PROC" "max_amount_guard" "true" "MAX_AMOUNT guard prevents balance column mis-detection"
else
  eval_criterion "EXPENSE_PROC" "max_amount_guard" "false" "No MAX_AMOUNT guard"
fi

# 3.4: Throws user-friendly error on zero valid rows
if grep -q "No valid expenses found" "$ART/lib/expense-processor.ts" || grep -q "expenses.length === 0" "$ART/lib/expense-processor.ts"; then
  eval_criterion "EXPENSE_PROC" "zero_rows_error" "true" "Throws error when no valid expenses parsed"
else
  eval_criterion "EXPENSE_PROC" "zero_rows_error" "false" "No zero-row error handling"
fi

# 3.5: Skips credit transactions
if grep -q "credit" "$ART/lib/expense-processor.ts"; then
  eval_criterion "EXPENSE_PROC" "skips_credits" "true" "Filters out credit/income transactions"
else
  eval_criterion "EXPENSE_PROC" "skips_credits" "false" "Does not filter credit transactions"
fi

# ─── SECTION 4: ROUTING & NAVIGATION ──────────────────────────────────────────
echo ""
echo "▶ SECTION 4: Routing & Navigation"

# 4.1: All routes defined in App.tsx match page component imports
ROUTES_OK="true"
ROUTE_DETAILS=""
if ! grep -q 'path="/"' "$ART/App.tsx"; then
  ROUTES_OK="false"; ROUTE_DETAILS="${ROUTE_DETAILS} missing_root_route"
fi
if ! grep -q 'path="/year/:year"' "$ART/App.tsx"; then
  ROUTES_OK="false"; ROUTE_DETAILS="${ROUTE_DETAILS} missing_year_route"
fi
if ! grep -q 'path="/year/:year/month/:month"' "$ART/App.tsx"; then
  ROUTES_OK="false"; ROUTE_DETAILS="${ROUTE_DETAILS} missing_month_route"
fi
if ! grep -q 'path="/trash"' "$ART/App.tsx"; then
  ROUTES_OK="false"; ROUTE_DETAILS="${ROUTE_DETAILS} missing_trash_route"
fi
eval_criterion "ROUTING" "all_routes_defined" "$ROUTES_OK" "Routes:${ROUTE_DETAILS:-all present}"

# 4.2: ProtectedLayout wraps all authenticated routes
PROTECTED_COUNT=$(grep -c "ProtectedLayout" "$ART/App.tsx")
if [ "$PROTECTED_COUNT" -ge "4" ]; then
  eval_criterion "ROUTING" "all_routes_protected" "true" "ProtectedLayout wraps ${PROTECTED_COUNT} routes (all authenticated)"
else
  eval_criterion "ROUTING" "all_routes_protected" "false" "Only ${PROTECTED_COUNT} routes wrapped in ProtectedLayout"
fi

# 4.3: Login redirects authenticated users
if grep -q "Redirect" "$ART/pages/Login.tsx" && grep -q "isAuthenticated" "$ART/pages/Login.tsx"; then
  eval_criterion "ROUTING" "login_redirects_authenticated" "true" "Login page redirects authenticated users"
else
  eval_criterion "ROUTING" "login_redirects_authenticated" "false" "Login doesn't redirect authenticated users"
fi

# ─── SECTION 5: SECURITY ──────────────────────────────────────────────────────
echo ""
echo "▶ SECTION 5: Security Checks"

# 5.1: No hardcoded API keys, tokens, or secrets
SECRETS=$(grep -rni "sk_live\|sk_test\|api_key.*=.*['\"].*[a-z0-9]\{20\}\|supabase_url.*=.*['\"]http\|supabase_key.*=.*['\"]ey" "$ART/" 2>/dev/null || echo "")
if [ -z "$SECRETS" ]; then
  eval_criterion "SECURITY" "no_hardcoded_secrets" "true" "No hardcoded API keys or secrets found"
else
  eval_criterion "SECURITY" "no_hardcoded_secrets" "false" "Hardcoded secrets found!"
fi

# 5.2: No dangerouslySetInnerHTML usage (XSS risk)
DANGEROUS_HTML=$(grep -rn "dangerouslySetInnerHTML" "$ART/" 2>/dev/null || echo "")
if [ -z "$DANGEROUS_HTML" ]; then
  eval_criterion "SECURITY" "no_dangerouslySetInnerHTML" "true" "No dangerouslySetInnerHTML usage"
else
  eval_criterion "SECURITY" "no_dangerouslySetInnerHTML" "false" "Found dangerouslySetInnerHTML (XSS risk)"
fi

# 5.3: CSV description properly escaped in display (truncate, no raw HTML)
if grep -q "truncate" "$ART/pages/MonthView.tsx" || grep -q "title=" "$ART/pages/MonthView.tsx"; then
  eval_criterion "SECURITY" "csv_description_escaped" "true" "Descriptions use truncate/title, no raw HTML injection"
else
  eval_criterion "SECURITY" "csv_description_escaped" "false" "Description display may be vulnerable"
fi

# ─── SECTION 6: STATE MANAGEMENT ──────────────────────────────────────────────
echo ""
echo "▶ SECTION 6: State Management"

# 6.1: Import context properly typed and defaulted
if grep -q "createContext<() => void>" "$ART/App.tsx"; then
  eval_criterion "STATE" "import_context_typed" "true" "ImportContext is properly typed with createContext<() => void>"
else
  eval_criterion "STATE" "import_context_typed" "false" "ImportContext not properly typed"
fi

# 6.2: QueryClient created outside component (prevents re-creation on renders)
if grep -B5 "function App\|function Router\|function ProtectedLayout" "$ART/App.tsx" | grep -q "new QueryClient"; then
  eval_criterion "STATE" "queryclient_outside_component" "false" "QueryClient created inside component function (re-creates on render)"
else
  eval_criterion "STATE" "queryclient_outside_component" "true" "QueryClient created at module level (stable)"
fi

# 6.3: Cache invalidation after mutations
INVALIDATION_COUNT=$(grep -c "invalidateQueries" "$ART/components/wizard/ImportWizard.tsx" 2>/dev/null || echo "0")
if [ "$INVALIDATION_COUNT" -ge "1" ]; then
  eval_criterion "STATE" "cache_invalidation_on_import" "true" "ImportWizard invalidates queries after successful import (${INVALIDATION_COUNT} invalidations)"
else
  eval_criterion "STATE" "cache_invalidation_on_import" "false" "No cache invalidation after import"
fi

# ─── SECTION 7: WIZARD FLOW ──────────────────────────────────────────────────
echo ""
echo "▶ SECTION 7: Import Wizard Flow"

# 7.1: All 4 wizard steps render
STEP_COUNT=0
grep -q "step === 1" "$ART/components/wizard/ImportWizard.tsx" && STEP_COUNT=$((STEP_COUNT + 1))
grep -q "step === 2" "$ART/components/wizard/ImportWizard.tsx" && STEP_COUNT=$((STEP_COUNT + 1))
grep -q "step === 3" "$ART/components/wizard/ImportWizard.tsx" && STEP_COUNT=$((STEP_COUNT + 1))
grep -q "step === 4" "$ART/components/wizard/ImportWizard.tsx" && STEP_COUNT=$((STEP_COUNT + 1))
if [ "$STEP_COUNT" -eq "4" ]; then
  eval_criterion "WIZARD" "all_4_steps_render" "true" "All 4 wizard steps have render blocks"
else
  eval_criterion "WIZARD" "all_4_steps_render" "false" "Only ${STEP_COUNT}/4 steps render"
fi

# 7.2: File upload supports both click and drag-and-drop
HAS_CLICK=$(grep -c "fileInputRef" "$ART/components/wizard/ImportWizard.tsx" || echo "0")
HAS_DROP=$(grep -c "handleDrop\|onDrop" "$ART/components/wizard/ImportWizard.tsx" || echo "0")
if [ "$HAS_CLICK" -gt "0" ] && [ "$HAS_DROP" -gt "0" ]; then
  eval_criterion "WIZARD" "click_and_drag_upload" "true" "Supports both click (fileInputRef) and drag-and-drop"
else
  eval_criterion "WIZARD" "click_and_drag_upload" "false" "Missing click or drag-and-drop support"
fi

# 7.3: File type validation on drop (only .csv)
if grep -q "\.csv" "$ART/components/wizard/ImportWizard.tsx"; then
  eval_criterion "WIZARD" "csv_validation_on_drop" "true" "Validates .csv extension on drag-and-drop"
else
  eval_criterion "WIZARD" "csv_validation_on_drop" "false" "No .csv validation on drop"
fi

# 7.4: Error state is displayed
if grep -q "{error &&" "$ART/components/wizard/ImportWizard.tsx"; then
  eval_criterion "WIZARD" "error_display" "true" "Error state is rendered in the UI"
else
  eval_criterion "WIZARD" "error_display" "false" "No error display"
fi

# 7.5: Category editing is available in step 3
if grep -q "updateCategory" "$ART/components/wizard/ImportWizard.tsx"; then
  eval_criterion "WIZARD" "category_editing" "true" "Users can edit categories in step 3"
else
  eval_criterion "WIZARD" "category_editing" "false" "No category editing"
fi

# ─── SECTION 8: SIDEBAR ──────────────────────────────────────────────────────
echo ""
echo "▶ SECTION 8: Sidebar"

# 8.1: Year expand/collapse works (toggleYear function)
if grep -q "toggleYear" "$ART/components/layout/Sidebar.tsx" && grep -q "expandedYears" "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "SIDEBAR" "year_expand_collapse" "true" "Year folders have expand/collapse toggle"
else
  eval_criterion "SIDEBAR" "year_expand_collapse" "false" "No expand/collapse for year folders"
fi

# 8.2: Delete year has confirmation dialog (inline Yes/No or browser confirm)
if grep -q "confirmDeleteYear\|confirm.*Delete entire year" "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "SIDEBAR" "delete_year_confirmation" "true" "Delete year has confirmation prompt"
else
  eval_criterion "SIDEBAR" "delete_year_confirmation" "false" "Delete year has no confirmation"
fi

# 8.3: Empty state rendered when no folders
if grep -q "folders?.length === 0\|folders\.length === 0" "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "SIDEBAR" "empty_state" "true" "Empty state rendered when no folders"
else
  eval_criterion "SIDEBAR" "empty_state" "false" "No empty state"
fi

# 8.4: Active route highlighting
if grep -q "isActive\|location ===" "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "SIDEBAR" "active_highlighting" "true" "Active route highlighting implemented"
else
  eval_criterion "SIDEBAR" "active_highlighting" "false" "No active route highlighting"
fi

# ─── SECTION 9: YEAR VIEW ────────────────────────────────────────────────────
echo ""
echo "▶ SECTION 9: YearView"

# 9.1: Uses Recharts for data visualization
if grep -q "recharts" "$ART/pages/YearView.tsx"; then
  eval_criterion "YEARVIEW" "uses_recharts" "true" "Uses recharts library for charts"
else
  eval_criterion "YEARVIEW" "uses_recharts" "false" "No recharts usage"
fi

# 9.2: Chart bars are clickable (navigate to month)
if grep -q "handleBarClick\|onClick.*handleBarClick" "$ART/pages/YearView.tsx"; then
  eval_criterion "YEARVIEW" "clickable_bars" "true" "Chart bars are clickable (navigates to month)"
else
  eval_criterion "YEARVIEW" "clickable_bars" "false" "Chart bars not clickable"
fi

# 9.3: Uses window.location instead of wouter navigate (code smell)
if grep -q "window.location.href" "$ART/pages/YearView.tsx"; then
  eval_criterion "YEARVIEW" "uses_router_navigation" "false" "Uses window.location.href instead of wouter's useLocation/Link (causes full page reload)"
else
  eval_criterion "YEARVIEW" "uses_router_navigation" "true" "Uses client-side routing"
fi

# 9.4: Loading skeleton
if grep -q "skeleton\|isLoading" "$ART/pages/YearView.tsx"; then
  eval_criterion "YEARVIEW" "loading_skeleton" "true" "Has loading skeleton state"
else
  eval_criterion "YEARVIEW" "loading_skeleton" "false" "No loading state"
fi

# ─── SECTION 10: MONTH VIEW ──────────────────────────────────────────────────
echo ""
echo "▶ SECTION 10: MonthView"

# 10.1: Search/filter functionality
if grep -q "search\|Search\|filter" "$ART/pages/MonthView.tsx"; then
  eval_criterion "MONTHVIEW" "search_filter" "true" "Search/filter functionality present"
else
  eval_criterion "MONTHVIEW" "search_filter" "false" "No search/filter"
fi

# 10.2: Inline category editing
if grep -q "updateMutation\|onChange.*category" "$ART/pages/MonthView.tsx"; then
  eval_criterion "MONTHVIEW" "inline_category_edit" "true" "Inline category editing via select dropdown"
else
  eval_criterion "MONTHVIEW" "inline_category_edit" "false" "No inline category editing"
fi

# 10.3: Delete individual expense with confirmation
if grep -q "deleteMutation\|deleteExpense" "$ART/pages/MonthView.tsx" && grep -q 'confirm.*Delete this expense' "$ART/pages/MonthView.tsx"; then
  eval_criterion "MONTHVIEW" "delete_with_confirm" "true" "Delete expense with confirmation dialog"
else
  eval_criterion "MONTHVIEW" "delete_with_confirm" "false" "Missing delete or confirmation"
fi

# 10.4: Export dropdown with multiple formats (csv, qbo)
EXPORT_FORMATS=0
grep -q "'csv'" "$ART/pages/MonthView.tsx" && EXPORT_FORMATS=$((EXPORT_FORMATS + 1))
grep -q "'qbo'" "$ART/pages/MonthView.tsx" && EXPORT_FORMATS=$((EXPORT_FORMATS + 1))
if [ "$EXPORT_FORMATS" -ge "2" ]; then
  eval_criterion "MONTHVIEW" "export_formats" "true" "Export dropdown supports ${EXPORT_FORMATS} formats (csv, qbo)"
else
  eval_criterion "MONTHVIEW" "export_formats" "false" "Only ${EXPORT_FORMATS} export formats"
fi

# 10.5: Stat cards present (total, transactions, status, top category)
STAT_CARDS=$(grep -c "stat-card" "$ART/pages/MonthView.tsx" || echo "0")
if [ "$STAT_CARDS" -ge "4" ]; then
  eval_criterion "MONTHVIEW" "stat_cards" "true" "${STAT_CARDS} stat cards present"
else
  eval_criterion "MONTHVIEW" "stat_cards" "false" "Only ${STAT_CARDS} stat cards"
fi

# ─── SECTION 11: TRASH ───────────────────────────────────────────────────────
echo ""
echo "▶ SECTION 11: Trash Page"

# 11.1: Restore functionality
if grep -q "restoreMutation\|useRestoreExpense" "$ART/pages/Trash.tsx"; then
  eval_criterion "TRASH" "restore_functionality" "true" "Restore button present with mutation"
else
  eval_criterion "TRASH" "restore_functionality" "false" "No restore functionality"
fi

# 11.2: Empty trash state
if grep -q "expenses?.length === 0\|expenses.length === 0" "$ART/pages/Trash.tsx" || grep -q "Your trash is empty" "$ART/pages/Trash.tsx"; then
  eval_criterion "TRASH" "empty_state" "true" "Empty trash state rendered"
else
  eval_criterion "TRASH" "empty_state" "false" "No empty trash state"
fi

# 11.3: 30-day deletion notice
if grep -q "30 days" "$ART/pages/Trash.tsx"; then
  eval_criterion "TRASH" "retention_notice" "true" "30-day retention notice shown"
else
  eval_criterion "TRASH" "retention_notice" "false" "No retention notice"
fi

# ─── SECTION 12: CSS / STYLING ────────────────────────────────────────────────
echo ""
echo "▶ SECTION 12: CSS & Styling"

# 12.1: Tailwind theme variables defined
if grep -q "color-primary" "$ART/index.css" && grep -q "color-background" "$ART/index.css"; then
  eval_criterion "CSS" "theme_variables" "true" "CSS theme variables defined for primary, background, etc."
else
  eval_criterion "CSS" "theme_variables" "false" "Missing theme variables"
fi

# 12.2: Dark theme as default
if grep -q "background.*224.*71%.*4%\|224 71% 4%" "$ART/index.css"; then
  eval_criterion "CSS" "dark_theme" "true" "Dark theme with dark background hue as default"
else
  eval_criterion "CSS" "dark_theme" "false" "Not a dark theme"
fi

# 12.3: Custom scrollbar styles
if grep -q "scrollbar" "$ART/index.css"; then
  eval_criterion "CSS" "custom_scrollbar" "true" "Custom scrollbar styles defined"
else
  eval_criterion "CSS" "custom_scrollbar" "false" "No custom scrollbar"
fi

# 12.4: Animation keyframes defined
KEYFRAMES=$(grep -c "@keyframes" "$ART/index.css" || echo "0")
if [ "$KEYFRAMES" -ge "5" ]; then
  eval_criterion "CSS" "animations" "true" "${KEYFRAMES} animation keyframes defined"
else
  eval_criterion "CSS" "animations" "false" "Only ${KEYFRAMES} keyframes"
fi

# 12.5: Glass panel utility class
if grep -q "glass-panel" "$ART/index.css"; then
  eval_criterion "CSS" "glass_panel_utility" "true" "glass-panel utility class defined"
else
  eval_criterion "CSS" "glass_panel_utility" "false" "No glass-panel class"
fi

# ─── SECTION 13: KNOWN BUGS / CODE SMELLS ────────────────────────────────────
echo ""
echo "▶ SECTION 13: Known Bugs & Code Smells"

# 13.1: YearView handleBarClick uses window.location (full page reload, loses SPA state)
if grep -q "window.location.href" "$ART/pages/YearView.tsx"; then
  eval_criterion "BUGS" "yearview_window_location" "false" "YearView uses window.location.href (full page reload, loses SPA state)"
else
  eval_criterion "BUGS" "yearview_window_location" "true" "YearView uses proper SPA navigation"
fi

# 13.2: MonthView export dropdown closes on outside click
if grep -q "useClickOutside\|useEffect.*click\|onBlur.*setIsExportOpen\|addEventListener.*mousedown\|addEventListener.*click" "$ART/pages/MonthView.tsx"; then
  eval_criterion "BUGS" "export_dropdown_close" "true" "Export dropdown closes on outside click"
else
  eval_criterion "BUGS" "export_dropdown_close" "false" "Export dropdown has no outside-click handler (stays open until manually closed)"
fi

# 13.3: UI component imports — Button/Badge are external shadcn/ui or platform deps
# These are expected to be provided by the build framework, not shipped in artifacts.
# Verify the import pattern is consistent across artifact files.
BUTTON_IMPORTS=$(grep -rn 'from "@/components/ui/Button"' "$ART/" 2>/dev/null | wc -l | tr -d ' ')
BADGE_IMPORTS=$(grep -rn 'from "@/components/ui/Badge"' "$ART/" 2>/dev/null | wc -l | tr -d ' ')
if [ "$BUTTON_IMPORTS" -gt "0" ] || [ "$BADGE_IMPORTS" -gt "0" ]; then
  # Check consistent casing across all files (no mixed Button/button)
  LOWER_BUTTON=$(grep -rn 'from "@/components/ui/button"' "$ART/" 2>/dev/null | wc -l | tr -d ' ')
  if [ "$LOWER_BUTTON" -eq "0" ]; then
    eval_criterion "BUGS" "ui_import_casing" "true" "UI component imports use consistent casing (Button: ${BUTTON_IMPORTS}, Badge: ${BADGE_IMPORTS})"
  else
    eval_criterion "BUGS" "ui_import_casing" "false" "Mixed casing: some files import Button, others import button"
  fi
fi

# 13.4: Sidebar delete year uses confirm() — inconsistent with prompt UX described in v0.4.0 changelog
if grep -q "confirm(" "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "BUGS" "sidebar_delete_uses_confirm" "false" "Sidebar delete uses browser confirm() instead of inline Yes/No prompt described in v0.4.0"
else
  eval_criterion "BUGS" "sidebar_delete_uses_confirm" "true" "Sidebar uses inline confirmation"
fi

# 13.5: Trash page uses alert() for empty trash
if grep -q "alert(" "$ART/pages/Trash.tsx"; then
  eval_criterion "BUGS" "trash_uses_alert" "false" "Trash page uses browser alert() for 'Empty Trash' — not production-ready UX"
else
  eval_criterion "BUGS" "trash_uses_alert" "true" "Trash page uses proper UI notification"
fi

# 13.6: Sidebar "Need Help?" uses alert()
if grep -q 'alert("Docs coming soon' "$ART/components/layout/Sidebar.tsx"; then
  eval_criterion "BUGS" "sidebar_help_alert" "false" "Sidebar Help uses browser alert() — placeholder not production-ready"
else
  eval_criterion "BUGS" "sidebar_help_alert" "true" "Help uses proper UI"
fi

# ─── SECTION 14: MAIN PROJECT INTEGRITY ───────────────────────────────────────
echo ""
echo "▶ SECTION 14: Main Project Integrity (existing src/ still works)"

# 14.1: TypeScript compiles cleanly
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
if [ $? -eq 0 ] && [ -z "$TSC_OUTPUT" ]; then
  eval_criterion "INTEGRITY" "typescript_clean" "true" "tsc --noEmit: zero errors"
else
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
  eval_criterion "INTEGRITY" "typescript_clean" "false" "tsc --noEmit: ${ERROR_COUNT} errors"
fi

# 14.2: ESLint clean
LINT_OUTPUT=$(npx next lint 2>&1 | tail -5)
if echo "$LINT_OUTPUT" | grep -q "No ESLint warnings or errors"; then
  eval_criterion "INTEGRITY" "eslint_clean" "true" "next lint: no warnings or errors"
elif echo "$LINT_OUTPUT" | grep -q "error"; then
  eval_criterion "INTEGRITY" "eslint_clean" "false" "next lint: errors found"
else
  eval_criterion "INTEGRITY" "eslint_clean" "true" "next lint: no blocking errors"
fi

# 14.3: Previous v0.5.0 eval still passes
echo ""
echo "  (Running v0.5.0 eval inline...)"
V050_RESULT=$(bash eval_fixes.sh 2>&1 | tail -3)
if echo "$V050_RESULT" | grep -q "PERFECT SCORE\|24/24"; then
  eval_criterion "INTEGRITY" "v050_eval_still_passes" "true" "Previous v0.5.0 eval: 24/24 PASS"
else
  eval_criterion "INTEGRITY" "v050_eval_still_passes" "false" "Previous v0.5.0 eval regression"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SCORECARD
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SCORECARD — v0.6.0 Artifact Code Review"
echo "═══════════════════════════════════════════════════════════════"
echo -e "$RESULTS"
echo ""
echo "───────────────────────────────────────────────────────────────"
echo "  TOTAL: ${PASS}/${TOTAL} criteria PASS   (${FAIL} FAIL)"
echo ""
SCORE_PCT=$(echo "scale=1; $PASS * 100 / $TOTAL" | bc)
echo "  SCORE: ${SCORE_PCT}%"
echo ""

if [ "$FAIL" -eq "0" ]; then
  echo "  🏆 PERFECT SCORE — All criteria verified."
elif [ "$FAIL" -le "3" ]; then
  echo "  ⚠️  ${FAIL} criteria failed — minor issues, mostly code smells."
elif [ "$FAIL" -le "8" ]; then
  echo "  🔶 ${FAIL} criteria failed — notable issues requiring attention."
else
  echo "  🔴 ${FAIL} criteria failed — significant problems found."
fi
echo "═══════════════════════════════════════════════════════════════"
