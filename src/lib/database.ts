import { supabase } from './supabase';
import { parseDateString, toDateString, getYear, getYearMonth } from './date-utils';
import { DEFAULT_COMPANY_NAME } from './company';
import { buildSampleExpenses, SAMPLE_COMPANY_NAME } from './sample-data';
import type { CategorizedExpense, CompanyNode, FolderNode, MonthNode, Receipt, SubfolderNode, TrashCompanyItem } from '@/types';

/**
 * Resolves the active account_id for a user via the account_users junction table.
 * Returns undefined if no account is found. Used to scope queries by account_id.
 */
async function getUserAccountId(userId: string): Promise<string | undefined> {
  const { data, error } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error || !data) return undefined;
  return data.account_id as string;
}

/** Exported version for use by other modules. */
export { getUserAccountId };

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Converts a DB row to a CategorizedExpense.
 * Uses parseDateString to avoid the UTC-offset off-by-one bug.
 */
function rowToExpense(row: Record<string, unknown>): CategorizedExpense {
  const date = parseDateString(row.date as string);
  return {
    id: row.id as string,
    date,
    companyName: (row.company_name as string) ?? DEFAULT_COMPANY_NAME,
    month: row.month as string,
    year: row.year as string,
    description: row.description as string,
    amount: Number(row.amount),
    originalCategory: (row.original_category as string) ?? '',
    category: row.category as string,
    filename: (row.filename as string) ?? '',
    rawData: (row.raw_data as string[]) ?? [],
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
  };
}

/**
 * Derive the canonical date string, year, and month from an expense's date.
 * This is the SINGLE source of truth — ignores any pre-existing month/year
 * fields on the expense object.
 */
function canonicalize(expense: CategorizedExpense) {
  const d = expense.date instanceof Date ? expense.date : new Date(expense.date);
  return {
    dateStr: toDateString(d),
    year: getYear(d),
    month: getYearMonth(d), // "YYYY-MM"
  };
}

/**
 * Creates a single expense row. Returns the new row ID.
 * Year and month are always derived from the expense date.
 */
export async function createExpense(
  userId: string,
  companyName: string,
  _year: string,
  _month: string,
  expense: CategorizedExpense
): Promise<string> {
  const { dateStr, year, month } = canonicalize(expense);

  // Ensure the year folder exists so the expense is visible in the sidebar
  await createYearFolders(userId, companyName, year);

  const accountId = await getUserAccountId(userId);

  const insertPayload: Record<string, unknown> = {
    user_id: userId,
    company_name: companyName,
    date: dateStr,
    month,
    year,
    description: expense.description,
    amount: expense.amount,
    original_category: expense.originalCategory,
    category: expense.category,
    filename: expense.filename,
    raw_data: expense.rawData,
    deleted_at: null,
  };
  if (accountId) insertPayload.account_id = accountId;

  const { data, error } = await supabase
    .from('expenses')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Generate a deduplication key for an expense row.
 * Used to prevent re-importing identical transactions.
 */
function deduplicationKey(row: { date: string; description: string; amount: number; filename: string }): string {
  return `${row.date}|${row.description}|${row.amount}|${row.filename}`;
}

/**
 * Bulk-insert expenses in a single round-trip. Returns the count of inserted rows.
 * Year and month are always derived from each expense's date.
 *
 * Client-side deduplication: before inserting, fetches existing expenses for the
 * same user+year(s) and filters out rows that match on (date, description, amount,
 * filename). This prevents duplicate imports even without a DB unique index.
 */
export async function bulkCreateExpenses(
  userId: string,
  companyName: string,
  expenses: CategorizedExpense[]
): Promise<number> {
  if (expenses.length === 0) return 0;

  const accountId = await getUserAccountId(userId);

  const rows = expenses.map((expense) => {
    const { dateStr, year, month } = canonicalize(expense);
    const row: Record<string, unknown> = {
      user_id: userId,
      company_name: companyName,
      date: dateStr,
      month,
      year,
      description: expense.description,
      amount: expense.amount,
      original_category: expense.originalCategory,
      category: expense.category,
      filename: expense.filename,
      raw_data: expense.rawData,
      deleted_at: null,
    };
    if (accountId) row.account_id = accountId;
    return row;
  });

  // ── Client-side dedup: fetch existing keys for the affected years ──
  const years = Array.from(new Set(rows.map((r) => r.year as string)));

  // Ensure folder records exist for all affected years so expenses are visible
  for (const year of years) {
    await createYearFolders(userId, companyName, year);
  }

  const existingKeys = new Set<string>();

  for (const year of years) {
    const { data: existing, error: fetchErr } = await supabase
      .from('expenses')
      .select('date, description, amount, filename')
      .eq('user_id', userId)
      .eq('company_name', companyName)
      .eq('year', year)
      .is('deleted_at', null);

    if (fetchErr) throw fetchErr;
    for (const e of existing ?? []) {
      existingKeys.add(
        deduplicationKey({
          date: e.date as string,
          description: e.description as string,
          amount: Number(e.amount),
          filename: (e.filename as string) ?? '',
        })
      );
    }
  }

  // Filter out duplicates
  const deduped = rows.filter((r) => {
    const key = deduplicationKey({ date: r.date as string, description: r.description as string, amount: r.amount as number, filename: (r.filename as string) ?? '' });
    if (existingKeys.has(key)) return false;
    // Also dedup within the batch itself
    existingKeys.add(key);
    return true;
  });

  if (deduped.length === 0) return 0;

  // Supabase/PostgREST supports batch insert natively.
  // Insert in chunks of 500 to stay within payload limits.
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < deduped.length; i += CHUNK_SIZE) {
    const chunk = deduped.slice(i, i + CHUNK_SIZE);
    // Use upsert with ON CONFLICT DO NOTHING for DB-level dedup (requires
    // the unique index from migrations/001_add_expense_dedup_index.sql).
    // Falls back to plain insert if the index hasn't been applied yet.
    const { data, error } = await supabase
      .from('expenses')
      .upsert(chunk, {
        onConflict: 'user_id,date,description,amount,filename',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      // Index may not exist yet — fall back to plain insert
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('expenses')
        .insert(chunk)
        .select('id');
      if (fallbackError) throw fallbackError;
      inserted += fallbackData?.length ?? 0;
    } else {
      inserted += data?.length ?? 0;
    }
  }

  return inserted;
}

/**
 * Fetches all non-deleted expenses for a given year/month.
 * Month is matched as "YYYY-MM" format.
 */
export async function getExpenses(
  userId: string,
  companyName: string,
  year: string,
  month: string
): Promise<CategorizedExpense[]> {
  const accountId = await getUserAccountId(userId);

  let companyQuery = supabase
    .from('companies')
    .select('deleted_at')
    .eq('name', companyName);
  companyQuery = accountId ? companyQuery.eq('account_id', accountId) : companyQuery.eq('user_id', userId);

  const { data: companyRow, error: companyError } = await companyQuery.maybeSingle();

  if (companyError) throw companyError;
  if (companyRow?.deleted_at) return [];

  const monthKey = month.includes('-') ? month : `${year}-${month}`;

  let expenseQuery = supabase
    .from('expenses')
    .select('*')
    .eq('company_name', companyName)
    .eq('year', year)
    .eq('month', monthKey)
    .is('deleted_at', null)
    .order('date', { ascending: true });
  expenseQuery = accountId ? expenseQuery.eq('account_id', accountId) : expenseQuery.eq('user_id', userId);

  const { data, error } = await expenseQuery;

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

/**
 * Updates the category field of a specific expense.
 */
export async function updateExpenseCategory(
  userId: string,
  _year: string,
  _month: string,
  expenseId: string,
  category: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ category })
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Soft-deletes an expense by setting deleted_at to now.
 */
export async function softDeleteExpense(
  userId: string,
  _year: string,
  _month: string,
  expenseId: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Restores a soft-deleted expense by setting deleted_at to null.
 */
export async function restoreExpense(
  userId: string,
  companyName: string,
  _year: string,
  _month: string,
  expenseId: string
): Promise<void> {
  const { error } = await supabase
    .from('expenses')
    .update({ deleted_at: null })
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) throw error;

  // Ensure the year folder exists so the restored expense is visible in the
  // sidebar.  The folder row may have been hard-deleted when the year was trashed.
  if (_year) {
    await createYearFolders(userId, companyName, _year);
  }
}

/**
 * Permanently deletes an expense and all associated receipts.
 */
export async function permanentDeleteExpense(
  userId: string,
  _year: string,
  _month: string,
  expenseId: string
): Promise<void> {
  // First permanently delete all receipts for this expense
  const allReceipts = await getAllReceiptsForExpense(userId, expenseId);
  if (allReceipts.length > 0) {
    await permanentDeleteReceipts(userId, allReceipts.map((r) => r.id));
  }

  // Then delete the expense
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', expenseId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Fetches all soft-deleted expenses for a user.
 */
export async function getTrash(userId: string): Promise<CategorizedExpense[]> {
  const accountId = await getUserAccountId(userId);

  let companiesQuery = supabase
    .from('companies')
    .select('name')
    .is('deleted_at', null);
  companiesQuery = accountId ? companiesQuery.eq('account_id', accountId) : companiesQuery.eq('user_id', userId);

  const { data: activeCompanies, error: companiesError } = await companiesQuery;

  if (companiesError) throw companiesError;

  const activeCompanyNames = new Set((activeCompanies ?? []).map((row) => row.name as string));

  let expensesQuery = supabase
    .from('expenses')
    .select('*')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  expensesQuery = accountId ? expensesQuery.eq('account_id', accountId) : expensesQuery.eq('user_id', userId);

  const { data, error } = await expensesQuery;

  if (error) throw error;
  return (data ?? [])
    .filter((row) => activeCompanyNames.has(((row.company_name as string) ?? DEFAULT_COMPANY_NAME)))
    .map(rowToExpense);
}

/**
 * Fetches all non-deleted expenses across the user's account.
 */
export async function getAllExpenses(userId: string): Promise<CategorizedExpense[]> {
  const accountId = await getUserAccountId(userId);

  let companiesQuery = supabase
    .from('companies')
    .select('name')
    .is('deleted_at', null);
  companiesQuery = accountId ? companiesQuery.eq('account_id', accountId) : companiesQuery.eq('user_id', userId);

  const { data: activeCompanies, error: companiesError } = await companiesQuery;

  if (companiesError) throw companiesError;

  const activeCompanyNames = new Set((activeCompanies ?? []).map((row) => row.name as string));

  let expensesQuery = supabase
    .from('expenses')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: false });
  expensesQuery = accountId ? expensesQuery.eq('account_id', accountId) : expensesQuery.eq('user_id', userId);

  const { data, error } = await expensesQuery;

  if (error) throw error;
  return (data ?? [])
    .filter((row) => activeCompanyNames.has(((row.company_name as string) ?? DEFAULT_COMPANY_NAME)))
    .map(rowToExpense);
}

/**
 * Creates a year entry and ensures the folder record exists.
 */
export async function createCompany(userId: string, companyName: string): Promise<void> {
  const normalized = companyName.trim();
  if (!normalized) throw new Error('Company name is required.');

  const accountId = await getUserAccountId(userId);
  const upsertPayload: Record<string, unknown> = { user_id: userId, name: normalized, deleted_at: null };
  if (accountId) upsertPayload.account_id = accountId;

  const { error } = await supabase
    .from('companies')
    .upsert(upsertPayload, { onConflict: 'user_id,name' });

  if (error) throw error;
}

export async function ensureSampleCompanyForFirstLogin(userId: string): Promise<boolean> {
  const [
    { data: companies, error: companiesError },
    { data: folders, error: foldersError },
    { data: expenses, error: expensesError },
  ] = await Promise.all([
    supabase.from('companies').select('name').eq('user_id', userId).limit(1),
    supabase.from('folders').select('year').eq('user_id', userId).limit(1),
    supabase.from('expenses').select('id').eq('user_id', userId).limit(1),
  ]);

  if (companiesError) throw companiesError;
  if (foldersError) throw foldersError;
  if (expensesError) throw expensesError;

  if ((companies?.length ?? 0) > 0 || (folders?.length ?? 0) > 0 || (expenses?.length ?? 0) > 0) {
    return false;
  }

  await bulkCreateExpenses(userId, SAMPLE_COMPANY_NAME, buildSampleExpenses());
  return true;
}

export async function renameCompany(
  userId: string,
  currentName: string,
  nextName: string
): Promise<void> {
  const from = currentName.trim();
  const to = nextName.trim();

  if (!from || !to) throw new Error('Company name is required.');
  if (from === to) return;

  const { data: existing, error: existingError } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .eq('name', to)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) {
    throw new Error('A company with that name already exists.');
  }

  const { error: companiesError } = await supabase
    .from('companies')
    .update({ name: to })
    .eq('user_id', userId)
    .eq('name', from);

  if (companiesError) throw companiesError;

  const { error: foldersError } = await supabase
    .from('folders')
    .update({ company_name: to })
    .eq('user_id', userId)
    .eq('company_name', from);

  if (foldersError) throw foldersError;

  const { error: expensesError } = await supabase
    .from('expenses')
    .update({ company_name: to })
    .eq('user_id', userId)
    .eq('company_name', from);

  if (expensesError) throw expensesError;
}

/**
 * Creates a year entry within a company and ensures the folder record exists.
 */
export async function createYearFolders(userId: string, companyName: string, year: string): Promise<void> {
  await createCompany(userId, companyName);

  const accountId = await getUserAccountId(userId);
  const upsertPayload: Record<string, unknown> = { user_id: userId, company_name: companyName, year };
  if (accountId) upsertPayload.account_id = accountId;

  const { error } = await supabase
    .from('folders')
    .upsert(upsertPayload, { onConflict: 'user_id,company_name,year' });

  if (error) throw error;
}

export async function createCustomerSubfolder(
  userId: string,
  companyName: string,
  year: string,
  name: string
): Promise<void> {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Subfolder name is required.');

  await createYearFolders(userId, companyName, year);

  const accountId = await getUserAccountId(userId);
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    company_name: companyName,
    year,
    name: normalizedName,
  };
  if (accountId) upsertPayload.account_id = accountId;

  const { error } = await supabase
    .from('customer_subfolders')
    .upsert(upsertPayload, { onConflict: 'user_id,company_name,year,name' });

  if (error) throw error;
}

/** Creates a custom folder directly under a company (not tied to a year). */
export async function createCompanyRootFolder(
  userId: string,
  companyName: string,
  name: string
): Promise<void> {
  const normalizedName = name.trim();
  if (!normalizedName) throw new Error('Folder name is required.');

  const accountId = await getUserAccountId(userId);
  const upsertPayload: Record<string, unknown> = {
    user_id: userId,
    company_name: companyName,
    year: '__root__',
    name: normalizedName,
  };
  if (accountId) upsertPayload.account_id = accountId;

  const { error } = await supabase
    .from('customer_subfolders')
    .upsert(upsertPayload, { onConflict: 'user_id,company_name,year,name' });
  if (error) throw error;
}

/** Deletes a custom subfolder (year-level or root-level). */
export async function deleteCustomerSubfolder(
  userId: string,
  companyName: string,
  year: string,
  name: string
): Promise<void> {
  const { error } = await supabase
    .from('customer_subfolders')
    .delete()
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year)
    .eq('name', name);
  if (error) throw error;
}

/**
 * Fetches all companies, years, and month-level stats.
 */
export async function getUserFolders(userId: string): Promise<CompanyNode[]> {
  const accountId = await getUserAccountId(userId);

  let companyQueryByUser = supabase
    .from('companies')
    .select('user_id, name')
    .is('deleted_at', null)
    .order('name', { ascending: true });
  companyQueryByUser = accountId ? companyQueryByUser.eq('account_id', accountId) : companyQueryByUser.eq('user_id', userId);

  const { data: companyRowsByUser, error: companiesError } = await companyQueryByUser;

  if (companiesError) throw companiesError;

  let companyRows = companyRowsByUser ?? [];
  let useVisibleFallback = companyRows.length === 0;

  if (useVisibleFallback) {
    const { data: visibleCompanyRows, error: visibleCompaniesError } = await supabase
      .from('companies')
      .select('user_id, name')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (visibleCompaniesError) throw visibleCompaniesError;
    companyRows = visibleCompanyRows ?? [];
  }

  const activeCompanyNames = new Set(companyRows.map((row) => row.name as string));
  if (activeCompanyNames.size === 0) return [];

  const folderQuery = supabase
    .from('folders')
    .select('user_id, company_name, year')
    .order('company_name', { ascending: true })
    .order('year', { ascending: true });

  const { data: folderRows, error: foldersError } = useVisibleFallback
    ? await folderQuery
    : await folderQuery.eq('user_id', userId);

  if (foldersError) throw foldersError;

  const subfolderQuery = supabase
    .from('customer_subfolders')
    .select('id, user_id, company_name, year, name')
    .order('company_name', { ascending: true })
    .order('year', { ascending: true })
    .order('name', { ascending: true });

  const { data: subfolderRows, error: subfoldersError } = useVisibleFallback
    ? await subfolderQuery
    : await subfolderQuery.eq('user_id', userId);

  if (subfoldersError) throw subfoldersError;

  // Get all non-deleted expenses for this user to compute stats
  const expensesQuery = supabase
    .from('expenses')
    .select('user_id, company_name, year, month, amount')
    .is('deleted_at', null);

  const { data: expenseRows, error: expensesError } = useVisibleFallback
    ? await expensesQuery
    : await expensesQuery.eq('user_id', userId);

  if (expensesError) throw expensesError;

  const folderRowsForActiveCompanies = (folderRows ?? []).filter((row) =>
    activeCompanyNames.has(((row.company_name as string) ?? DEFAULT_COMPANY_NAME))
  );
  const subfolderRowsForActiveCompanies = (subfolderRows ?? []).filter((row) =>
    activeCompanyNames.has(((row.company_name as string) ?? DEFAULT_COMPANY_NAME))
  );
  const expenseRowsForActiveCompanies = (expenseRows ?? []).filter((row) =>
    activeCompanyNames.has(((row.company_name as string) ?? DEFAULT_COMPANY_NAME))
  );

  // Build a lookup: company -> year -> month -> { count, total }
  const stats: Record<string, Record<string, Record<string, { count: number; total: number }>>> = {};
  for (const row of expenseRowsForActiveCompanies) {
    const companyName = (row.company_name as string) ?? DEFAULT_COMPANY_NAME;
    const y = row.year as string;
    const monthStr = (row.month as string).split('-')[1] ?? '';
    if (!stats[companyName]) stats[companyName] = {};
    if (!stats[companyName][y]) stats[companyName][y] = {};
    if (!stats[companyName][y][monthStr]) stats[companyName][y][monthStr] = { count: 0, total: 0 };
    stats[companyName][y][monthStr].count += 1;
    stats[companyName][y][monthStr].total += Number(row.amount);
  }

  return Array.from(activeCompanyNames)
    .sort((a, b) => a.localeCompare(b))
    .map((companyName) => {
      const years = folderRowsForActiveCompanies
        .filter((row) => ((row.company_name as string) ?? DEFAULT_COMPANY_NAME) === companyName)
        .map((row) => row.year as string);

      const uniqueYears = Array.from(new Set(years)).sort((a, b) => a.localeCompare(b));

      const yearNodes: FolderNode[] = uniqueYears.map((year) => {
        const yearStats = stats[companyName]?.[year] ?? {};
        const subfolders: SubfolderNode[] = subfolderRowsForActiveCompanies
          .filter(
            (row) =>
              ((row.company_name as string) ?? DEFAULT_COMPANY_NAME) === companyName &&
              (row.year as string) === year &&
              (row.year as string) !== '__root__'
          )
          .map((row) => ({
            id: row.id as string,
            name: row.name as string,
          }));

        const months: MonthNode[] = MONTH_NAMES.map((name, index) => {
          const monthNum = String(index + 1).padStart(2, '0');
          const monthStat = yearStats[monthNum] ?? { count: 0, total: 0 };
          return {
            month: monthNum,
            name,
            expenseCount: monthStat.count,
            total: monthStat.total,
          };
        });

        return { year, months, subfolders };
      });

      const rootFolders: SubfolderNode[] = subfolderRowsForActiveCompanies
        .filter(
          (row) =>
            ((row.company_name as string) ?? DEFAULT_COMPANY_NAME) === companyName &&
            (row.year as string) === '__root__'
        )
        .map((row) => ({ id: row.id as string, name: row.name as string }));

      return { companyName, years: yearNodes, rootFolders };
    });
}

/**
 * Creates a receipt record in the database.
 */
export async function createReceipt(
  userId: string,
  expenseId: string,
  filename: string,
  storagePath: string,
  fileType: string,
  sizeBytes: number
): Promise<Receipt> {
  const accountId = await getUserAccountId(userId);

  const insertPayload: Record<string, unknown> = {
    expense_id: expenseId,
    user_id: userId,
    filename,
    storage_path: storagePath,
    file_type: fileType,
    size_bytes: sizeBytes,
    uploaded_by: userId,
    deleted_at: null,
  };
  if (accountId) insertPayload.account_id = accountId;

  const { data, error } = await supabase
    .from('receipts')
    .insert(insertPayload)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    created_at: new Date(data.created_at),
    deleted_at: data.deleted_at ? new Date(data.deleted_at) : null,
  };
}

/**
 * Gets all non-deleted receipts for an expense.
 */
export async function getReceiptsForExpense(
  userId: string,
  expenseId: string
): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .eq('expense_id', expenseId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    created_at: new Date(r.created_at),
    deleted_at: r.deleted_at ? new Date(r.deleted_at) : null,
  }));
}

/**
 * Soft-deletes a receipt by setting deleted_at timestamp.
 */
export async function softDeleteReceipt(
  userId: string,
  receiptId: string
): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', receiptId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Permanently deletes receipts by IDs.
 */
export async function permanentDeleteReceipts(
  userId: string,
  receiptIds: string[]
): Promise<void> {
  if (receiptIds.length === 0) return;

  // Fetch storage paths before deleting DB rows so we can clean up Storage
  const { data: receipts, error: fetchError } = await supabase
    .from('receipts')
    .select('storage_path')
    .eq('user_id', userId)
    .in('id', receiptIds);

  if (fetchError) throw fetchError;

  // Delete blobs from Supabase Storage
  const storagePaths = (receipts ?? [])
    .map((r) => r.storage_path as string)
    .filter(Boolean);

  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from('expense-receipts')
      .remove(storagePaths);

    if (storageError) {
      // Log but don't block — the DB rows should still be removed so the
      // user isn't stuck.  Orphaned blobs can be cleaned up separately.
      console.error('Failed to delete receipt files from storage:', storageError);
    }
  }

  // Delete DB rows
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('user_id', userId)
    .in('id', receiptIds);

  if (error) throw error;
}

/**
 * Gets all receipts (including soft-deleted) for an expense.
 */
export async function getAllReceiptsForExpense(
  userId: string,
  expenseId: string
): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .eq('expense_id', expenseId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    created_at: new Date(r.created_at),
    deleted_at: r.deleted_at ? new Date(r.deleted_at) : null,
  }));
}

/**
 * Soft-deletes multiple expenses in bulk by setting deleted_at timestamp.
 * Processes in chunks of 500 to respect payload limits.
 */
export async function softDeleteExpensesByIds(
  userId: string,
  expenseIds: string[]
): Promise<number> {
  if (expenseIds.length === 0) return 0;

  let deleted = 0;
  const CHUNK_SIZE = 500;

  for (let i = 0; i < expenseIds.length; i += CHUNK_SIZE) {
    const chunk = expenseIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', chunk);

    if (error) throw error;
    deleted += chunk.length;
  }

  return deleted;
}

/**
 * Soft-deletes an entire year folder and all its expenses.
 * Sets deleted_at on the year folder and all expenses in that year.
 */
export async function softDeleteYear(
  userId: string,
  companyName: string,
  year: string
): Promise<void> {
  // First, get all non-deleted expenses for this year
  const { data: expenses, error: fetchError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year)
    .is('deleted_at', null);

  if (fetchError) throw fetchError;

  // Soft delete all expenses in this year
  if (expenses && expenses.length > 0) {
    const expenseIds = expenses.map((e) => e.id);
    await softDeleteExpensesByIds(userId, expenseIds);
  }

  // Delete the year folder record (folders table has no deleted_at column)
  const { error: folderError } = await supabase
    .from('folders')
    .delete()
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year);

  if (folderError) throw folderError;
}

/**
 * Gets soft-deleted expenses that belonged to a specific year.
 * Useful for organizing trash by year/month.
 */
export async function getDeletedExpensesByYear(
  userId: string,
  companyName: string,
  year: string
): Promise<CategorizedExpense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

export async function getDeletedCompanies(userId: string): Promise<TrashCompanyItem[]> {
  const accountId = await getUserAccountId(userId);

  let query = supabase
    .from('companies')
    .select('id, name, deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });
  query = accountId ? query.eq('account_id', accountId) : query.eq('user_id', userId);

  const { data: deletedCompanies, error: deletedCompaniesError } = await query;

  if (deletedCompaniesError) throw deletedCompaniesError;
  if (!deletedCompanies || deletedCompanies.length === 0) return [];

  const deletedCompanyNames = deletedCompanies.map((row) => row.name as string);

  const [
    { data: folderRows, error: foldersError },
    { data: subfolderRows, error: subfoldersError },
    { data: expenseRows, error: expensesError },
  ] = await Promise.all([
    supabase
      .from('folders')
      .select('company_name, year')
      .eq('user_id', userId)
      .in('company_name', deletedCompanyNames),
    supabase
      .from('customer_subfolders')
      .select('company_name')
      .eq('user_id', userId)
      .in('company_name', deletedCompanyNames),
    supabase
      .from('expenses')
      .select('company_name, id')
      .eq('user_id', userId)
      .in('company_name', deletedCompanyNames),
  ]);

  if (foldersError) throw foldersError;
  if (subfoldersError) throw subfoldersError;
  if (expensesError) throw expensesError;

  return deletedCompanies.map((row) => {
    const companyName = row.name as string;
    return {
      id: row.id as string,
      name: companyName,
      deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
      yearCount: new Set(
        (folderRows ?? [])
          .filter((folder) => (folder.company_name as string) === companyName)
          .map((folder) => folder.year as string)
      ).size,
      subfolderCount: (subfolderRows ?? []).filter((subfolder) => (subfolder.company_name as string) === companyName).length,
      expenseCount: (expenseRows ?? []).filter((expense) => (expense.company_name as string) === companyName).length,
    };
  });
}

export async function softDeleteCompany(userId: string, companyName: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('name', companyName)
    .is('deleted_at', null);

  if (error) throw error;
}

export async function restoreCompany(userId: string, companyName: string): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('name', companyName)
    .not('deleted_at', 'is', null);

  if (error) throw error;
}

export async function permanentDeleteCompany(userId: string, companyName: string): Promise<void> {
  const { data: expenseIds, error: expenseIdsError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .eq('company_name', companyName);

  if (expenseIdsError) throw expenseIdsError;

  for (const expense of expenseIds ?? []) {
    await permanentDeleteExpense(userId, '', '', expense.id as string);
  }

  const { error: subfolderError } = await supabase
    .from('customer_subfolders')
    .delete()
    .eq('user_id', userId)
    .eq('company_name', companyName);

  if (subfolderError) throw subfolderError;

  const { error: folderError } = await supabase
    .from('folders')
    .delete()
    .eq('user_id', userId)
    .eq('company_name', companyName);

  if (folderError) throw folderError;

  const { error: companyError } = await supabase
    .from('companies')
    .delete()
    .eq('user_id', userId)
    .eq('name', companyName);

  if (companyError) throw companyError;
}

/**
 * Soft-deletes all expenses in a specific month.
 */
export async function softDeleteMonth(
  userId: string,
  companyName: string,
  year: string,
  month: string
): Promise<void> {
  const monthKey = month.includes('-') ? month : `${year}-${month}`;

  const { data: expenses, error: fetchError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year)
    .eq('month', monthKey)
    .is('deleted_at', null);

  if (fetchError) throw fetchError;

  if (expenses && expenses.length > 0) {
    await softDeleteExpensesByIds(userId, expenses.map((e) => e.id as string));
  }
}

/**
 * Fetches all non-deleted receipts for a set of expense IDs.
 * Returns a map of expenseId -> receipts[].
 */
export async function getReceiptsByExpenseIds(
  userId: string,
  expenseIds: string[]
): Promise<Record<string, Receipt[]>> {
  if (expenseIds.length === 0) return {};

  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('user_id', userId)
    .in('expense_id', expenseIds)
    .is('deleted_at', null);

  if (error) throw error;

  const byId: Record<string, Receipt[]> = {};
  for (const r of data ?? []) {
    if (!byId[r.expense_id]) byId[r.expense_id] = [];
    byId[r.expense_id].push({
      ...r,
      created_at: new Date(r.created_at),
      deleted_at: r.deleted_at ? new Date(r.deleted_at) : null,
    });
  }
  return byId;
}

/**
 * Restores a soft-deleted year folder and all its expenses.
 * Sets deleted_at to null for the folder and all its expenses.
 */
export async function restoreYear(
  userId: string,
  companyName: string,
  year: string
): Promise<void> {
  // Restore all soft-deleted expenses in this year
  const { error: expensesError } = await supabase
    .from('expenses')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('company_name', companyName)
    .eq('year', year)
    .not('deleted_at', 'is', null);

  if (expensesError) throw expensesError;

  // Re-create the year folder record (it was hard-deleted since folders has no deleted_at)
  const { error: folderError } = await supabase
    .from('folders')
    .upsert(
      { user_id: userId, company_name: companyName, year },
      { onConflict: 'user_id,company_name,year' }
    );

  if (folderError) throw folderError;
}
