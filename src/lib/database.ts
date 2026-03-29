import { supabase } from './supabase';
import { parseDateString, toDateString, getYear, getYearMonth } from './date-utils';
import type { CategorizedExpense, FolderNode, MonthNode, Receipt } from '@/types';

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
  _year: string,
  _month: string,
  expense: CategorizedExpense
): Promise<string> {
  const { dateStr, year, month } = canonicalize(expense);

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
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
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Bulk-insert expenses in a single round-trip. Returns the count of inserted rows.
 * Year and month are always derived from each expense's date.
 * Uses a deduplication key (date + description + amount + filename) to make
 * retries safe — duplicates are silently skipped via ON CONFLICT DO NOTHING
 * (requires the unique index below, or the caller deduplicates manually).
 */
export async function bulkCreateExpenses(
  userId: string,
  expenses: CategorizedExpense[]
): Promise<number> {
  if (expenses.length === 0) return 0;

  const rows = expenses.map((expense) => {
    const { dateStr, year, month } = canonicalize(expense);
    return {
      user_id: userId,
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
  });

  // Supabase/PostgREST supports batch insert natively.
  // Insert in chunks of 500 to stay within payload limits.
  const CHUNK_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from('expenses')
      .insert(chunk)
      .select('id');

    if (error) throw error;
    inserted += data?.length ?? 0;
  }

  return inserted;
}

/**
 * Fetches all non-deleted expenses for a given year/month.
 * Month is matched as "YYYY-MM" format.
 */
export async function getExpenses(
  userId: string,
  year: string,
  month: string
): Promise<CategorizedExpense[]> {
  const monthKey = month.includes('-') ? month : `${year}-${month}`;

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', monthKey)
    .is('deleted_at', null)
    .order('date', { ascending: true });

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
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

/**
 * Creates a year entry and ensures the folder record exists.
 */
export async function createYearFolders(userId: string, year: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .upsert(
      { user_id: userId, year },
      { onConflict: 'user_id,year' }
    );

  if (error) throw error;
}

/**
 * Fetches all years and computes month-level stats from expenses.
 * Returns sorted array of FolderNodes.
 */
export async function getUserFolders(userId: string): Promise<FolderNode[]> {
  // Get all folder years
  const { data: folderRows, error: foldersError } = await supabase
    .from('folders')
    .select('year')
    .eq('user_id', userId)
    .order('year', { ascending: true });

  if (foldersError) throw foldersError;
  if (!folderRows || folderRows.length === 0) return [];

  // Get all non-deleted expenses for this user to compute stats
  const { data: expenseRows, error: expensesError } = await supabase
    .from('expenses')
    .select('year, month, amount')
    .eq('user_id', userId)
    .is('deleted_at', null);

  if (expensesError) throw expensesError;

  // Build a lookup: year -> month -> { count, total }
  const stats: Record<string, Record<string, { count: number; total: number }>> = {};
  for (const row of expenseRows ?? []) {
    const y = row.year as string;
    // month is stored as "YYYY-MM", extract the MM part
    const monthStr = (row.month as string).split('-')[1] ?? '';
    if (!stats[y]) stats[y] = {};
    if (!stats[y][monthStr]) stats[y][monthStr] = { count: 0, total: 0 };
    stats[y][monthStr].count += 1;
    stats[y][monthStr].total += Number(row.amount);
  }

  // Build folder nodes with all 12 months per year
  const folders: FolderNode[] = folderRows.map((f) => {
    const year = f.year as string;
    const yearStats = stats[year] ?? {};

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

    return { year, months };
  });

  return folders;
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
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      expense_id: expenseId,
      user_id: userId,
      filename,
      storage_path: storagePath,
      file_type: fileType,
      size_bytes: sizeBytes,
      uploaded_by: userId,
      deleted_at: null,
    })
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
  year: string
): Promise<void> {
  // First, get all non-deleted expenses for this year
  const { data: expenses, error: fetchError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
    .eq('year', year)
    .is('deleted_at', null);

  if (fetchError) throw fetchError;

  // Soft delete all expenses in this year
  if (expenses && expenses.length > 0) {
    const expenseIds = expenses.map((e) => e.id);
    await softDeleteExpensesByIds(userId, expenseIds);
  }

  // Soft delete the year folder itself
  const { error: folderError } = await supabase
    .from('folders')
    .update({ deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('year', year);

  if (folderError) throw folderError;
}

/**
 * Gets soft-deleted expenses that belonged to a specific year.
 * Useful for organizing trash by year/month.
 */
export async function getDeletedExpensesByYear(
  userId: string,
  year: string
): Promise<CategorizedExpense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(rowToExpense);
}

/**
 * Soft-deletes all expenses in a specific month.
 */
export async function softDeleteMonth(
  userId: string,
  year: string,
  month: string
): Promise<void> {
  const monthKey = month.includes('-') ? month : `${year}-${month}`;

  const { data: expenses, error: fetchError } = await supabase
    .from('expenses')
    .select('id')
    .eq('user_id', userId)
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
  year: string
): Promise<void> {
  // Restore all soft-deleted expenses in this year
  const { error: expensesError } = await supabase
    .from('expenses')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('year', year)
    .not('deleted_at', 'is', null);

  if (expensesError) throw expensesError;

  // Restore the year folder itself
  const { error: folderError } = await supabase
    .from('folders')
    .update({ deleted_at: null })
    .eq('user_id', userId)
    .eq('year', year);

  if (folderError) throw folderError;
}
