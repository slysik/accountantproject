'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { LuTable, LuChartPie, LuChartLine, LuInbox, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import {
  getExpenses,
  updateExpenseCategory,
  softDeleteExpense,
  softDeleteMonth,
  getReceiptsByExpenseIds,
} from '@/lib/database';
import CSVUploader from '@/components/CSVUploader';
import ExpenseTable from '@/components/ExpenseTable';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import SummaryCards from '@/components/SummaryCards';
import MonthlyChart from '@/components/MonthlyChart';
import ExportMenu from '@/components/ExportMenu';
import { SkeletonCard, SkeletonSection } from '@/components/Skeleton';
import ExpenseChat from '@/components/ExpenseChat';
import type { CategorizedExpense, Receipt } from '@/types';

const MONTH_NAMES: Record<string, string> = {
  '01': 'January',
  '02': 'February',
  '03': 'March',
  '04': 'April',
  '05': 'May',
  '06': 'June',
  '07': 'July',
  '08': 'August',
  '09': 'September',
  '10': 'October',
  '11': 'November',
  '12': 'December',
};

export default function MonthPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;
  const month = params.month as string;
  const monthName = MONTH_NAMES[month] ?? month;

  const { user } = useAuth();
  const [expenses, setExpenses] = useState<CategorizedExpense[]>([]);
  const [receiptsByExpenseId, setReceiptsByExpenseId] = useState<Record<string, Receipt[]>>({});
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getExpenses(user.id, year, month);
      setExpenses(data);

      if (data.length > 0) {
        const ids = data.map((e) => e.id);
        const receipts = await getReceiptsByExpenseIds(user.id, ids);
        setReceiptsByExpenseId(receipts);
      } else {
        setReceiptsByExpenseId({});
      }
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, year, month]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCategoryChange = useCallback(async (expenseId: string, category: string) => {
    if (!user) return;
    try {
      await updateExpenseCategory(user.id, year, month, expenseId, category);
      setExpenses(prev =>
        prev.map(e => (e.id === expenseId ? { ...e, category } : e))
      );
    } catch (err) {
      console.error('Failed to update category:', err);
    }
  }, [user, year, month]);

  const handleDelete = useCallback(async (expenseId: string) => {
    if (!user) return;
    try {
      await softDeleteExpense(user.id, year, month, expenseId);
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
      setReceiptsByExpenseId(prev => {
        const next = { ...prev };
        delete next[expenseId];
        return next;
      });
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  }, [user, year, month]);

  const handleDeleteMonth = useCallback(async () => {
    if (!user) return;
    setDeletingMonth(true);
    try {
      await softDeleteMonth(user.id, year, month);
      router.push(`/dashboard/${year}/01`);
    } catch (err) {
      console.error('Failed to delete month:', err);
      setDeletingMonth(false);
      setShowDeleteConfirm(false);
    }
  }, [user, year, month, router]);

  const handleReceiptsUpdated = useCallback((expenseId: string, receipts: Receipt[]) => {
    setReceiptsByExpenseId(prev => ({ ...prev, [expenseId]: receipts }));
  }, []);

  const hasExpenses = expenses.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">
          {monthName} {year}
        </h1>

        {/* Delete Month */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/10"
          >
            <LuTrash2 className="h-3.5 w-3.5" />
            Delete Month
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-error/30 bg-error/5 px-3 py-1.5">
            <span className="text-xs text-error">
              Move all {monthName} expenses to trash?
            </span>
            <button
              onClick={handleDeleteMonth}
              disabled={deletingMonth}
              className="rounded px-2 py-1 text-xs font-semibold text-error bg-error/20 hover:bg-error/30 disabled:opacity-50 transition-colors"
            >
              {deletingMonth ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingMonth}
              className="rounded px-2 py-1 text-xs font-medium text-text-muted hover:bg-bg-tertiary transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {/* Summary cards */}
        <SummaryCards expenses={expenses} />

        {/* CSV Upload */}
        <CSVUploader year={year} month={month} onUploadComplete={fetchExpenses} />

        {/* Monthly spending chart */}
        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartLine className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">
                Monthly Spending
              </h2>
            </div>
            <MonthlyChart expenses={expenses} />
          </section>
        )}

        {/* Category Breakdown */}
        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartPie className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">
                Category Breakdown
              </h2>
            </div>
            <CategoryBreakdown expenses={expenses} />
          </section>
        )}

        {/* Expense Table */}
        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuTable className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">
                  Expenses
                </h2>
              </div>
              <ExportMenu expenses={expenses} />
            </div>
            <ExpenseTable
              expenses={expenses}
              receiptsByExpenseId={receiptsByExpenseId}
              userId={user?.id ?? ''}
              onCategoryChange={handleCategoryChange}
              onDelete={handleDelete}
              onReceiptsUpdated={handleReceiptsUpdated}
            />
          </section>
        )}

        {/* Loading skeletons */}
        {loading && !hasExpenses && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <SkeletonSection rows={6} />
          </div>
        )}

        {/* Empty state */}
        {!loading && !hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary py-16 px-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary">
                <LuInbox className="h-7 w-7 text-text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">
                No expenses yet
              </h3>
              <p className="max-w-xs text-xs text-text-muted">
                Upload a CSV file above or try the sample data to see your
                expenses organized and categorized.
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Expense chatbot */}
      <ExpenseChat year={year} month={month} />
    </div>
  );
}
