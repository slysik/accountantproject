'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { LuTable, LuChartPie, LuChartLine, LuInbox } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { getExpenses, updateExpenseCategory, softDeleteExpense } from '@/lib/database';
import CSVUploader from '@/components/CSVUploader';
import ExpenseTable from '@/components/ExpenseTable';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import SummaryCards from '@/components/SummaryCards';
import MonthlyChart from '@/components/MonthlyChart';
import ExportMenu from '@/components/ExportMenu';
import { SkeletonCard, SkeletonSection } from '@/components/Skeleton';
import type { CategorizedExpense } from '@/types';

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
  const year = params.year as string;
  const month = params.month as string;
  const monthName = MONTH_NAMES[month] ?? month;

  const { user } = useAuth();
  const [expenses, setExpenses] = useState<CategorizedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getExpenses(user.id, year, month);
      setExpenses(data);
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
      // Optimistic update
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
      // Optimistic removal
      setExpenses(prev => prev.filter(e => e.id !== expenseId));
    } catch (err) {
      console.error('Failed to delete expense:', err);
    }
  }, [user, year, month]);

  const hasExpenses = expenses.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">
        {monthName} {year}
      </h1>

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
              onCategoryChange={handleCategoryChange}
              onDelete={handleDelete}
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

        {/* Empty state (after loading, no expenses, no upload preview) */}
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
    </div>
  );
}
