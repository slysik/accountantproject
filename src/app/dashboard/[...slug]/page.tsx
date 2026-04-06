'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { LuCalendar, LuChartLine, LuChartPie, LuInbox, LuTable, LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { DEFAULT_COMPANY_NAME, decodeCompanySlug, encodeCompanySlug, isMonthSegment, isYearSegment } from '@/lib/company';
import {
  getExpenses,
  getReceiptsByExpenseIds,
  getUserFolders,
  softDeleteExpense,
  softDeleteMonth,
  updateExpenseCategory,
} from '@/lib/database';
import CSVUploader from '@/components/CSVUploader';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import ExpenseChat from '@/components/ExpenseChat';
import ExpenseTable from '@/components/ExpenseTable';
import ExportMenu from '@/components/ExportMenu';
import MonthlyChart from '@/components/MonthlyChart';
import SummaryCards from '@/components/SummaryCards';
import { SkeletonCard, SkeletonSection } from '@/components/Skeleton';
import type { CategorizedExpense, MonthNode, Receipt } from '@/types';

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

export default function DashboardSlugPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = (params.slug as string[]) ?? [];

  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<MonthNode[]>([]);
  const [expenses, setExpenses] = useState<CategorizedExpense[]>([]);
  const [receiptsByExpenseId, setReceiptsByExpenseId] = useState<Record<string, Receipt[]>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);

  const companySlug = slug[0];
  const year = slug[1];
  const month = slug[2];
  const companyName = companySlug ? decodeCompanySlug(companySlug) : DEFAULT_COMPANY_NAME;
  const isLegacyYearRoute = slug.length === 1 && isYearSegment(companySlug ?? '');
  const isLegacyMonthRoute = slug.length === 2 && isYearSegment(companySlug ?? '') && isMonthSegment(year ?? '');
  const isCompanyView = slug.length === 1 && !isLegacyYearRoute;
  const isYearView = slug.length === 2 && !isLegacyMonthRoute && isYearSegment(year ?? '');
  const isMonthView = slug.length === 3 && isYearSegment(year ?? '') && isMonthSegment(month ?? '');

  useEffect(() => {
    if (isLegacyYearRoute) {
      router.replace(`/dashboard/${encodeCompanySlug(DEFAULT_COMPANY_NAME)}/${companySlug}`);
    } else if (isLegacyMonthRoute) {
      router.replace(`/dashboard/${encodeCompanySlug(DEFAULT_COMPANY_NAME)}/${companySlug}/${year}`);
    }
  }, [companySlug, isLegacyMonthRoute, isLegacyYearRoute, router, year]);

  useEffect(() => {
    if (!user || !isCompanyView) return;
    setLoading(true);
    getUserFolders(user.id)
      .then((companies) => {
        const company = companies.find((item) => item.companyName === companyName);
        setYears(company?.years.map((folder) => folder.year) ?? []);
      })
      .catch((err) => console.error('Failed to load company data:', err))
      .finally(() => setLoading(false));
  }, [companyName, isCompanyView, user]);

  useEffect(() => {
    if (!user || !isYearView || !year) return;
    setLoading(true);
    getUserFolders(user.id)
      .then((companies) => {
        const company = companies.find((item) => item.companyName === companyName);
        const yearFolder = company?.years.find((folder) => folder.year === year);
        setMonths(yearFolder?.months ?? []);
      })
      .catch((err) => console.error('Failed to load year data:', err))
      .finally(() => setLoading(false));
  }, [companyName, isYearView, user, year]);

  const fetchExpenses = useCallback(async () => {
    if (!user || !isMonthView || !year || !month) return;
    setLoading(true);
    try {
      const data = await getExpenses(user.id, companyName, year, month);
      setExpenses(data);
      if (data.length > 0) {
        const ids = data.map((expense) => expense.id);
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
  }, [companyName, isMonthView, month, user, year]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleCategoryChange = useCallback(async (expenseId: string, category: string) => {
    if (!user || !year || !month) return;
    await updateExpenseCategory(user.id, year, month, expenseId, category);
    setExpenses((prev) => prev.map((expense) => (expense.id === expenseId ? { ...expense, category } : expense)));
  }, [month, user, year]);

  const handleDelete = useCallback(async (expenseId: string) => {
    if (!user || !year || !month) return;
    await softDeleteExpense(user.id, year, month, expenseId);
    setExpenses((prev) => prev.filter((expense) => expense.id !== expenseId));
    setReceiptsByExpenseId((prev) => {
      const next = { ...prev };
      delete next[expenseId];
      return next;
    });
  }, [month, user, year]);

  const handleDeleteMonth = useCallback(async () => {
    if (!user || !year || !month) return;
    setDeletingMonth(true);
    try {
      await softDeleteMonth(user.id, companyName, year, month);
      router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}`);
    } catch (err) {
      console.error('Failed to delete month:', err);
      setDeletingMonth(false);
      setShowDeleteConfirm(false);
    }
  }, [companyName, month, router, user, year]);

  const handleReceiptsUpdated = useCallback((expenseId: string, receipts: Receipt[]) => {
    setReceiptsByExpenseId((prev) => ({ ...prev, [expenseId]: receipts }));
  }, []);

  if (isLegacyYearRoute || isLegacyMonthRoute) return null;

  if (isCompanyView) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-text-primary">{companyName}</h1>
        <p className="mb-6 text-sm text-text-muted">Choose a year folder to view expenses for this company.</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          years.length === 0 ? (
            <p className="text-sm text-text-muted">Use the sidebar to add a year folder for this company.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {years.map((companyYear) => (
                <button
                  key={companyYear}
                  onClick={() => router.push(`/dashboard/${encodeCompanySlug(companyName)}/${companyYear}`)}
                  className="rounded-xl border border-border-primary bg-bg-secondary p-4 text-left transition-colors hover:border-accent-primary/50 hover:bg-bg-tertiary"
                >
                  <div className="mb-2 text-sm font-semibold text-text-primary">{companyYear}</div>
                  <div className="text-xs text-text-muted">Open year folder</div>
                </button>
              ))}
            </div>
          )
        )}
      </div>
    );
  }

  if (isYearView && year) {
    return (
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-text-primary">{companyName}</h1>
        <p className="mb-6 text-sm text-text-muted">{year}</p>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : months.length === 0 ? (
          <p className="text-sm text-text-muted">No months found for this year.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {months.map((monthNode) => (
              <button
                key={monthNode.month}
                onClick={() => router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}/${monthNode.month}`)}
                className="group flex flex-col items-start rounded-xl border border-border-primary bg-bg-secondary p-4 text-left transition-colors hover:border-accent-primary/50 hover:bg-bg-tertiary"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-tertiary group-hover:bg-bg-secondary">
                  <LuCalendar className="h-4 w-4 text-accent-primary" />
                </div>
                <span className="text-sm font-semibold text-text-primary">{monthNode.name}</span>
                <div className="mt-1 flex items-center gap-2">
                  {monthNode.expenseCount === 0 ? (
                    <span className="text-xs italic text-text-muted">No expenses</span>
                  ) : (
                    <>
                      <span className="text-xs text-text-muted">
                        {monthNode.expenseCount} expense{monthNode.expenseCount !== 1 ? 's' : ''}
                      </span>
                      {monthNode.total > 0 && (
                        <span className="text-xs font-medium text-accent-primary">
                          ${monthNode.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!isMonthView || !year || !month) {
    return <div className="text-sm text-text-muted">Page not found.</div>;
  }

  const monthName = MONTH_NAMES[month] ?? month;
  const hasExpenses = expenses.length > 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-text-primary">{companyName}</h1>
        <p className="text-sm text-text-muted">{monthName} {year}</p>
      </div>

      <div className="mb-6 flex items-center justify-end">
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
            <span className="text-xs text-error">Move all {monthName} expenses to trash?</span>
            <button
              onClick={handleDeleteMonth}
              disabled={deletingMonth}
              className="rounded bg-error/20 px-2 py-1 text-xs font-semibold text-error transition-colors hover:bg-error/30 disabled:opacity-50"
            >
              {deletingMonth ? 'Deleting...' : 'Confirm'}
            </button>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deletingMonth}
              className="rounded px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:bg-bg-tertiary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6">
        <SummaryCards expenses={expenses} />
        <CSVUploader companyName={companyName} year={year} month={month} onUploadComplete={fetchExpenses} />

        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartLine className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Monthly Spending</h2>
            </div>
            <MonthlyChart expenses={expenses} />
          </section>
        )}

        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartPie className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Category Breakdown</h2>
            </div>
            <CategoryBreakdown expenses={expenses} />
          </section>
        )}

        {hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LuTable className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Expenses</h2>
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

        {loading && !hasExpenses && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
            <SkeletonSection rows={6} />
          </div>
        )}

        {!loading && !hasExpenses && (
          <section className="rounded-xl border border-border-primary bg-bg-secondary px-6 py-16">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary">
                <LuInbox className="h-7 w-7 text-text-muted" />
              </div>
              <h3 className="text-sm font-semibold text-text-primary">No expenses yet</h3>
              <p className="max-w-xs text-xs text-text-muted">
                Upload a CSV file above to add expenses to {companyName}.
              </p>
            </div>
          </section>
        )}
      </div>

      <ExpenseChat year={year} month={month} />
    </div>
  );
}
