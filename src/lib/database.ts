import { supabase } from './supabase';
import type { CategorizedExpense, FolderNode, MonthNode } from '@/types';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Converts a DB row to a CategorizedExpense.
 */
function rowToExpense(row: Record<string, unknown>): CategorizedExpense {
  return {
    id: row.id as string,
    date: new Date(row.date as string),
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
 * Creates an expense row. Returns the new row ID.
 */
export async function createExpense(
  userId: string,
  year: string,
  month: string,
  expense: CategorizedExpense
): Promise<string> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      user_id: userId,
      date: expense.date instanceof Date
        ? expense.date.toISOString().split('T')[0]
        : new Date(expense.date).toISOString().split('T')[0],
      month: expense.month || `${year}-${month}`,
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
 * Fetches all non-deleted expenses for a given year/month.
 */
export async function getExpenses(
  userId: string,
  year: string,
  month: string
): Promise<CategorizedExpense[]> {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', userId)
    .eq('year', year)
    .eq('month', `${year}-${month}`)
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
