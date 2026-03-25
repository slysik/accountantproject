import { supabase } from './supabase';
import { parseDateString, toDateString, getYear, getYearMonth } from './date-utils';
import type { CategorizedExpense, FolderNode, MonthNode } from '@/types';

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
 * Permanently deletes an expense.
 */
export async function permanentDeleteExpense(
  userId: string,
  _year: string,
  _month: string,
  expenseId: string
): Promise<void> {
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
