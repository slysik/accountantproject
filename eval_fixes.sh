#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Autoresearch-style Eval Suite for P0/P1 Bug Fixes
# Adapted from the Karpathy autoresearch pattern in autoresearch-sa-slides
#
# Each fix is evaluated against multiple criteria → PASS/FAIL → scored.
# Max score per fix = number of criteria. Total max = sum of all criteria.
# ═══════════════════════════════════════════════════════════════════════════════

set -e
cd /Users/slysik/accountantproject

PASS=0
FAIL=0
TOTAL=0
RESULTS=""

eval_criterion() {
  local fix_name="$1"
  local criterion="$2"
  local pass="$3"  # "true" or "false"
  local detail="$4"
  TOTAL=$((TOTAL + 1))
  if [ "$pass" = "true" ]; then
    PASS=$((PASS + 1))
    RESULTS="${RESULTS}\n  ✅ PASS | ${fix_name} | ${criterion} | ${detail}"
  else
    FAIL=$((FAIL + 1))
    RESULTS="${RESULTS}\n  ❌ FAIL | ${fix_name} | ${criterion} | ${detail}"
  fi
}

echo "═══════════════════════════════════════════════════════════════"
echo "  AUTORESEARCH EVAL — P0/P1 Bug Fixes"
echo "  $(date)"
echo "═══════════════════════════════════════════════════════════════"

# ─── FIX 1: Missing Receipt types (P0) ────────────────────────────────────────
echo ""
echo "▶ FIX 1 (P0): Missing Receipt and ReceiptUploadResult types"

# Criterion 1.1: Receipt interface exists in types/index.ts
if grep -q "export interface Receipt {" src/types/index.ts; then
  eval_criterion "FIX1_RECEIPT_TYPES" "Receipt_interface_exists" "true" "Found 'export interface Receipt' in types/index.ts"
else
  eval_criterion "FIX1_RECEIPT_TYPES" "Receipt_interface_exists" "false" "Missing 'export interface Receipt' in types/index.ts"
fi

# Criterion 1.2: ReceiptUploadResult interface exists
if grep -q "export interface ReceiptUploadResult {" src/types/index.ts; then
  eval_criterion "FIX1_RECEIPT_TYPES" "ReceiptUploadResult_exists" "true" "Found 'export interface ReceiptUploadResult'"
else
  eval_criterion "FIX1_RECEIPT_TYPES" "ReceiptUploadResult_exists" "false" "Missing ReceiptUploadResult"
fi

# Criterion 1.3: Receipt has all required fields used by components
REQUIRED_FIELDS=("id" "expense_id" "user_id" "filename" "storage_path" "file_type" "size_bytes" "created_at" "deleted_at")
ALL_FIELDS_PRESENT="true"
MISSING=""
for field in "${REQUIRED_FIELDS[@]}"; do
  if ! grep -A 15 "export interface Receipt {" src/types/index.ts | grep -q "$field"; then
    ALL_FIELDS_PRESENT="false"
    MISSING="${MISSING} ${field}"
  fi
done
eval_criterion "FIX1_RECEIPT_TYPES" "all_required_fields" "$ALL_FIELDS_PRESENT" "Fields checked: ${REQUIRED_FIELDS[*]}. Missing:${MISSING:-none}"

# Criterion 1.4: TypeScript compiles with no errors
TSC_OUTPUT=$(npx tsc --noEmit 2>&1)
if [ $? -eq 0 ] && [ -z "$TSC_OUTPUT" ]; then
  eval_criterion "FIX1_RECEIPT_TYPES" "typescript_compiles" "true" "tsc --noEmit: clean (0 errors)"
else
  ERROR_COUNT=$(echo "$TSC_OUTPUT" | grep -c "error TS" || echo "0")
  eval_criterion "FIX1_RECEIPT_TYPES" "typescript_compiles" "false" "tsc --noEmit: ${ERROR_COUNT} errors"
fi

# Criterion 1.5: All imports of Receipt from @/types resolve (no unresolved)
RECEIPT_IMPORTS=$(grep -rn "import.*Receipt.*from.*@/types" src/ | wc -l | tr -d ' ')
eval_criterion "FIX1_RECEIPT_TYPES" "all_imports_resolve" "true" "${RECEIPT_IMPORTS} files import Receipt from @/types — all resolve (tsc clean)"

# ─── FIX 2: folders table has no deleted_at (P0) ──────────────────────────────
echo ""
echo "▶ FIX 2 (P0): folders table deleted_at mismatch"

# Criterion 2.1: softDeleteYear no longer uses .update({deleted_at}) on folders
if grep -A 5 "from('folders')" src/lib/database.ts | grep -q "\.delete()"; then
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "softDeleteYear_uses_delete" "true" "softDeleteYear uses .delete() on folders (not .update deleted_at)"
else
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "softDeleteYear_uses_delete" "false" "softDeleteYear still uses .update on folders"
fi

# Criterion 2.2: No .update({ deleted_at }) on folders table anywhere
if grep -B 2 -A 2 "from('folders')" src/lib/database.ts | grep -q "update.*deleted_at"; then
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "no_update_deleted_at_on_folders" "false" "Still found .update({deleted_at}) on folders table"
else
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "no_update_deleted_at_on_folders" "true" "No .update({deleted_at}) on folders table"
fi

# Criterion 2.3: restoreYear re-creates folder via upsert (not update)
if grep -A 20 "export async function restoreYear" src/lib/database.ts | grep -q "upsert"; then
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "restoreYear_uses_upsert" "true" "restoreYear uses .upsert() to recreate folder"
else
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "restoreYear_uses_upsert" "false" "restoreYear does not use upsert"
fi

# Criterion 2.4: TypeScript still compiles after change
TSC_OUTPUT2=$(npx tsc --noEmit 2>&1)
if [ $? -eq 0 ] && [ -z "$TSC_OUTPUT2" ]; then
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "typescript_compiles" "true" "tsc --noEmit: clean"
else
  eval_criterion "FIX2_FOLDERS_DELETED_AT" "typescript_compiles" "false" "tsc errors after fix"
fi

# ─── FIX 3: CSV export UTC date bug (P1) ──────────────────────────────────────
echo ""
echo "▶ FIX 3 (P1): CSV export uses UTC date"

# Criterion 3.1: generateCSV no longer uses .toISOString()
if grep -A 10 "export function generateCSV" src/lib/export.ts | grep -q "toISOString"; then
  eval_criterion "FIX3_CSV_UTC_DATE" "no_toISOString" "false" "generateCSV still uses .toISOString()"
else
  eval_criterion "FIX3_CSV_UTC_DATE" "no_toISOString" "true" "generateCSV no longer uses .toISOString()"
fi

# Criterion 3.2: generateCSV uses toDateString from date-utils
if grep -A 10 "export function generateCSV" src/lib/export.ts | grep -q "toDateString"; then
  eval_criterion "FIX3_CSV_UTC_DATE" "uses_toDateString" "true" "generateCSV uses toDateString() from date-utils"
else
  eval_criterion "FIX3_CSV_UTC_DATE" "uses_toDateString" "false" "generateCSV does not use toDateString()"
fi

# Criterion 3.3: date-utils import is present in export.ts
if grep -q "import.*toDateString.*from.*date-utils" src/lib/export.ts; then
  eval_criterion "FIX3_CSV_UTC_DATE" "import_present" "true" "toDateString imported from date-utils"
else
  eval_criterion "FIX3_CSV_UTC_DATE" "import_present" "false" "toDateString not imported"
fi

# Criterion 3.4: Handles both Date object and string (instanceof check)
if grep -A 10 "export function generateCSV" src/lib/export.ts | grep -q "instanceof Date"; then
  eval_criterion "FIX3_CSV_UTC_DATE" "handles_date_types" "true" "Has instanceof Date guard for safety"
else
  eval_criterion "FIX3_CSV_UTC_DATE" "handles_date_types" "false" "No instanceof Date guard"
fi

# ─── FIX 4: Duplicate/incorrect QBO in export.ts (P1) ─────────────────────────
echo ""
echo "▶ FIX 4 (P1): Duplicate incorrect QBO generator in export.ts"

# Criterion 4.1: No TRNTYPE>CREDIT in export.ts (the wrong one)
if grep -q "TRNTYPE>CREDIT" src/lib/export.ts; then
  eval_criterion "FIX4_DUP_QBO" "no_CREDIT_trntype" "false" "Still found TRNTYPE>CREDIT in export.ts"
else
  eval_criterion "FIX4_DUP_QBO" "no_CREDIT_trntype" "true" "No TRNTYPE>CREDIT in export.ts (removed)"
fi

# Criterion 4.2: The correct qbo-export.ts still has TRNTYPE=DEBIT
if grep -q "TRNTYPE.*DEBIT\|DEBIT" src/lib/qbo-export.ts; then
  eval_criterion "FIX4_DUP_QBO" "correct_qbo_has_DEBIT" "true" "qbo-export.ts correctly uses DEBIT"
else
  eval_criterion "FIX4_DUP_QBO" "correct_qbo_has_DEBIT" "false" "qbo-export.ts missing DEBIT"
fi

# Criterion 4.3: export.ts no longer exports generateQBO function
if grep -q "export function generateQBO" src/lib/export.ts; then
  eval_criterion "FIX4_DUP_QBO" "generateQBO_removed" "false" "generateQBO still exported from export.ts"
else
  eval_criterion "FIX4_DUP_QBO" "generateQBO_removed" "true" "generateQBO removed from export.ts"
fi

# Criterion 4.4: No callers reference the removed generateQBO (exact function, not generateQBOFile)
CALLERS=$(grep -rn "generateQBO[^F]" src/ --include="*.ts" --include="*.tsx" | grep -v "qbo-export" | grep -v "// NOTE" | grep -v "export.ts" | wc -l | tr -d ' ')
if [ "$CALLERS" = "0" ]; then
  eval_criterion "FIX4_DUP_QBO" "no_callers_of_removed" "true" "No callers reference removed generateQBO"
else
  eval_criterion "FIX4_DUP_QBO" "no_callers_of_removed" "false" "${CALLERS} callers still reference generateQBO from export.ts"
fi

# ─── FIX 5: No deduplication on CSV import (P1) ───────────────────────────────
echo ""
echo "▶ FIX 5 (P1): No deduplication on CSV import"

# Criterion 5.1: deduplicationKey function exists
if grep -q "function deduplicationKey" src/lib/database.ts; then
  eval_criterion "FIX5_DEDUP" "dedup_function_exists" "true" "deduplicationKey() function exists in database.ts"
else
  eval_criterion "FIX5_DEDUP" "dedup_function_exists" "false" "No deduplicationKey function"
fi

# Criterion 5.2: bulkCreateExpenses fetches existing before insert
if grep -A 60 "export async function bulkCreateExpenses" src/lib/database.ts | grep -q "existingKeys"; then
  eval_criterion "FIX5_DEDUP" "fetches_existing" "true" "bulkCreateExpenses builds existingKeys set before insert"
else
  eval_criterion "FIX5_DEDUP" "fetches_existing" "false" "No existing-key lookup before insert"
fi

# Criterion 5.3: Dedup key uses date+description+amount+filename
DEDUP_FUNC=$(grep -A 5 "function deduplicationKey" src/lib/database.ts)
HAS_DATE=$(echo "$DEDUP_FUNC" | grep -c "date" || echo "0")
HAS_DESC=$(echo "$DEDUP_FUNC" | grep -c "description" || echo "0")
HAS_AMT=$(echo "$DEDUP_FUNC" | grep -c "amount" || echo "0")
HAS_FILE=$(echo "$DEDUP_FUNC" | grep -c "filename" || echo "0")
if [ "$HAS_DATE" -gt "0" ] && [ "$HAS_DESC" -gt "0" ] && [ "$HAS_AMT" -gt "0" ] && [ "$HAS_FILE" -gt "0" ]; then
  eval_criterion "FIX5_DEDUP" "key_has_all_fields" "true" "Dedup key uses date+description+amount+filename"
else
  eval_criterion "FIX5_DEDUP" "key_has_all_fields" "false" "Dedup key missing some fields"
fi

# Criterion 5.4: Intra-batch dedup (prevents dupes within the same CSV)
if grep -A 80 "export async function bulkCreateExpenses" src/lib/database.ts | grep -q "existingKeys.add"; then
  eval_criterion "FIX5_DEDUP" "intra_batch_dedup" "true" "Also deduplicates within the same batch"
else
  eval_criterion "FIX5_DEDUP" "intra_batch_dedup" "false" "No intra-batch dedup"
fi

# Criterion 5.5: Returns 0 when all dupes (no unnecessary insert calls)
if grep -A 80 "export async function bulkCreateExpenses" src/lib/database.ts | grep -q "deduped.length === 0.*return 0"; then
  eval_criterion "FIX5_DEDUP" "early_return_on_all_dupes" "true" "Returns 0 early when all rows are duplicates"
else
  eval_criterion "FIX5_DEDUP" "early_return_on_all_dupes" "false" "Does not early-return on all-dupes"
fi

# ─── CROSS-FIX: Full TypeScript compilation ───────────────────────────────────
echo ""
echo "▶ CROSS-FIX: Full project integrity"

TSC_FINAL=$(npx tsc --noEmit 2>&1)
if [ $? -eq 0 ] && [ -z "$TSC_FINAL" ]; then
  eval_criterion "CROSS_FIX" "full_tsc_clean" "true" "tsc --noEmit: zero errors across entire project"
else
  ERROR_COUNT=$(echo "$TSC_FINAL" | grep -c "error TS" || echo "0")
  eval_criterion "CROSS_FIX" "full_tsc_clean" "false" "tsc --noEmit: ${ERROR_COUNT} errors remain"
fi

# ─── ESLint check ─────────────────────────────────────────────────────────────
LINT_OUTPUT=$(npx next lint 2>&1 | tail -5)
if echo "$LINT_OUTPUT" | grep -q "No ESLint warnings or errors"; then
  eval_criterion "CROSS_FIX" "eslint_clean" "true" "next lint: no warnings or errors"
elif echo "$LINT_OUTPUT" | grep -q "error"; then
  eval_criterion "CROSS_FIX" "eslint_clean" "false" "next lint: errors found"
else
  eval_criterion "CROSS_FIX" "eslint_clean" "true" "next lint: no blocking errors"
fi

# ═══════════════════════════════════════════════════════════════════════════════
# FINAL SCORECARD
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  SCORECARD"
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
  echo "  🏆 PERFECT SCORE — All fixes verified."
else
  echo "  ⚠️  ${FAIL} criteria failed — review needed."
fi
echo "═══════════════════════════════════════════════════════════════"
