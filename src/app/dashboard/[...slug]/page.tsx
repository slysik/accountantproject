'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LuCalendar,
  LuChartLine,
  LuChartPie,
  LuCirclePlus,
  LuFolderOpen,
  LuInbox,
  LuReceipt,
  LuTable,
  LuTrash2,
  LuTrendingUp,
} from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { DEFAULT_COMPANY_NAME, decodeCompanySlug, decodeFolderSlug, encodeCompanySlug, encodeFolderSlug, isMonthSegment, isYearSegment } from '@/lib/company';
import {
  getExpenses,
  getAllExpenses,
  getReceiptsByExpenseIds,
  getUserFolders,
  softDeleteExpense,
  softDeleteMonth,
  updateExpenseCategory,
} from '@/lib/database';
import CSVUploader from '@/components/CSVUploader';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import ExpenseTable from '@/components/ExpenseTable';
import ExportMenu from '@/components/ExportMenu';
import MonthlyChart from '@/components/MonthlyChart';
import SummaryCards from '@/components/SummaryCards';
import { SkeletonCard, SkeletonSection } from '@/components/Skeleton';
import type { CategorizedExpense, MonthNode, Receipt, SubfolderNode } from '@/types';

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

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

function DashboardPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="shell-panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent-primary/12 text-accent-primary ring-1 ring-accent-primary/20">{icon}</span>
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function DashboardSlugPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const slug = (params.slug as string[]) ?? [];

  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<string[]>([]);
  const [months, setMonths] = useState<MonthNode[]>([]);
  const [subfolders, setSubfolders] = useState<SubfolderNode[]>([]);
  const [yearExpenses, setYearExpenses] = useState<CategorizedExpense[]>([]);
  const [expenses, setExpenses] = useState<CategorizedExpense[]>([]);
  const [receiptsByExpenseId, setReceiptsByExpenseId] = useState<Record<string, Receipt[]>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMonth, setDeletingMonth] = useState(false);
  const [selectedMissingMonth, setSelectedMissingMonth] = useState('');

  const companySlug = slug[0];
  const year = slug[1];
  const month = slug[2];
  const subfolderName = slug[3] === 'subfolder' && slug[4] ? decodeFolderSlug(slug[4]) : undefined;
  const companyName = companySlug ? decodeCompanySlug(companySlug) : DEFAULT_COMPANY_NAME;
  const isLegacyYearRoute = slug.length === 1 && isYearSegment(companySlug ?? '');
  const isLegacyMonthRoute = slug.length === 2 && isYearSegment(companySlug ?? '') && isMonthSegment(year ?? '');
  const isCompanyView = slug.length === 1 && !isLegacyYearRoute;
  const isYearView = slug.length === 2 && !isLegacyMonthRoute && isYearSegment(year ?? '');
  const isMonthView = slug.length === 3 && isYearSegment(year ?? '') && isMonthSegment(month ?? '');
  const isSubfolderView = slug.length === 5 && isYearSegment(year ?? '') && slug[3] === 'subfolder' && !!slug[4];

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
    if (!user || (!isYearView && !isSubfolderView) || !year) return;
    setLoading(true);
    Promise.all([getUserFolders(user.id), getAllExpenses(user.id)])
      .then(([companies, allExpenses]) => {
        const company = companies.find((item) => item.companyName === companyName);
        const yearFolder = company?.years.find((folder) => folder.year === year);
        setMonths(yearFolder?.months ?? []);
        setSubfolders(yearFolder?.subfolders ?? []);
        setYearExpenses(
          allExpenses.filter((expense) => expense.companyName === companyName && expense.year === year)
        );
      })
      .catch((err) => console.error('Failed to load year data:', err))
      .finally(() => setLoading(false));
  }, [companyName, isSubfolderView, isYearView, user, year]);

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

  const yearSummary = useMemo(() => {
    if (!isYearView) return null;
    const activeMonths = months.filter((item) => item.expenseCount > 0);
    const total = activeMonths.reduce((sum, item) => sum + item.total, 0);
    const transactionCount = activeMonths.reduce((sum, item) => sum + item.expenseCount, 0);
    const topMonth = [...activeMonths].sort((a, b) => b.total - a.total)[0] ?? null;

    return {
      total,
      transactionCount,
      activeMonths: activeMonths.length,
      topMonth,
      maxMonthTotal: Math.max(...months.map((item) => item.total), 1),
    };
  }, [isYearView, months]);

  const yearAnalytics = useMemo(() => {
    if (!isYearView) return null;

    const sortedExpenses = [...yearExpenses].sort((a, b) => b.amount - a.amount);
    const topTransactions = sortedExpenses.slice(0, 5);

    const topMonths = [...months]
      .filter((item) => item.expenseCount > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    const quarterTotals: Array<{ label: string; total: number; count: number }> = [
      { label: 'Q1', total: 0, count: 0 },
      { label: 'Q2', total: 0, count: 0 },
      { label: 'Q3', total: 0, count: 0 },
      { label: 'Q4', total: 0, count: 0 },
    ];

    for (const expense of yearExpenses) {
      const monthIndex = Number(expense.month.split('-')[1] ?? '1') - 1;
      const quarterIndex = Math.max(0, Math.min(3, Math.floor(monthIndex / 3)));
      quarterTotals[quarterIndex].total += expense.amount;
      quarterTotals[quarterIndex].count += 1;
    }

    const activeMonths = months.filter((item) => item.expenseCount > 0);
    const averagePerActiveMonth =
      activeMonths.length > 0
        ? activeMonths.reduce((sum, item) => sum + item.total, 0) / activeMonths.length
        : 0;

    const categoryTotals = new Map<string, { total: number; count: number }>();
    for (const expense of yearExpenses) {
      const current = categoryTotals.get(expense.category) ?? { total: 0, count: 0 };
      current.total += expense.amount;
      current.count += 1;
      categoryTotals.set(expense.category, current);
    }

    const topCategory = Array.from(categoryTotals.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.total - a.total)[0] ?? null;

    return {
      topTransactions,
      topMonths,
      quarterTotals,
      averagePerActiveMonth,
      topCategory,
    };
  }, [isYearView, months, yearExpenses]);

  const missingMonths = useMemo(
    () => months.filter((item) => item.expenseCount === 0),
    [months]
  );

  useEffect(() => {
    if (!isYearView) return;
    setSelectedMissingMonth((current) => {
      if (current && missingMonths.some((item) => item.month === current)) return current;
      return missingMonths[0]?.month ?? '';
    });
  }, [isYearView, missingMonths]);

  const monthSummary = useMemo(() => {
    if (!isMonthView) return null;
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const average = expenses.length > 0 ? total / expenses.length : 0;
    const topExpense = [...expenses].sort((a, b) => b.amount - a.amount)[0] ?? null;

    return { total, average, topExpense };
  }, [expenses, isMonthView]);

  const activeSubfolder = useMemo(
    () => subfolders.find((item) => item.name === subfolderName) ?? null,
    [subfolderName, subfolders]
  );

  if (isLegacyYearRoute || isLegacyMonthRoute) return null;

  if (isCompanyView) {
    return (
      <div className="mx-auto max-w-5xl">
        <section className="hero-surface mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_34%),linear-gradient(135deg,var(--bg-secondary),var(--bg-primary))] px-6 py-7">
            <p className="section-kicker mb-3">Company Workspace</p>
            <h1 className="font-display text-4xl font-bold text-text-primary">{companyName}</h1>
            <p className="mt-3 max-w-2xl text-sm text-text-secondary">Choose a year folder to review trends, imports, and exported reports for this company.</p>
          </div>
        </section>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : years.length === 0 ? (
          <p className="text-sm text-text-muted">Use the sidebar to add a year folder for this company.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {years.map((companyYear) => (
              <button
                key={companyYear}
                onClick={() => router.push(`/dashboard/${encodeCompanySlug(companyName)}/${companyYear}`)}
                className="shell-panel p-5 text-left transition-all hover:-translate-y-0.5 hover:border-accent-primary/40"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/12 ring-1 ring-accent-primary/18">
                  <LuFolderOpen className="h-5 w-5 text-accent-primary" />
                </div>
                <div className="font-display text-2xl font-bold text-text-primary">{companyYear}</div>
                <div className="mt-1 text-xs text-text-muted">Open year workspace</div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (isSubfolderView && year && subfolderName) {
    return (
      <div className="mx-auto max-w-5xl">
        <section className="hero-surface mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_34%),linear-gradient(135deg,var(--bg-secondary),var(--bg-primary))] px-6 py-7">
            <p className="section-kicker mb-3">Customer Subfolder</p>
            <h1 className="font-display text-4xl font-bold text-text-primary">{subfolderName}</h1>
            <p className="mt-3 max-w-2xl text-sm text-text-secondary">
              Organize customer-specific work for {companyName} in {year}. This subfolder is ready for your records and workflow.
            </p>
          </div>
        </section>

        {loading ? (
          <SkeletonSection />
        ) : !activeSubfolder ? (
          <section className="shell-panel p-6">
            <p className="text-sm text-text-muted">That subfolder could not be found for this year.</p>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="shell-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Subfolder Workspace</h2>
              </div>
              <p className="text-sm text-text-secondary">
                Use this area to keep customer folders visible and easy to revisit from the sidebar. This first release adds customer subfolder organization under each year, with room to expand what lives inside each folder next.
              </p>
            </section>

            <section className="shell-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <LuInbox className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Year Context</h2>
              </div>
              <div className="space-y-3 text-sm text-text-secondary">
                <p><span className="font-medium text-text-primary">Company:</span> {companyName}</p>
                <p><span className="font-medium text-text-primary">Year:</span> {year}</p>
                <p><span className="font-medium text-text-primary">Subfolder:</span> {subfolderName}</p>
                <button
                  onClick={() => router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}`)}
                  className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
                >
                  Back to Year View
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    );
  }

  if (isYearView && year) {
    return (
      <div className="mx-auto max-w-6xl">
        <section className="hero-surface mb-6">
          <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_45%),linear-gradient(135deg,var(--bg-secondary),var(--bg-primary))] px-6 py-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent-primary">Year View</p>
                <h1 className="font-display text-4xl font-bold text-text-primary md:text-5xl">{year}</h1>
                <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                  {companyName} yearly command view with high-signal analytics, pacing, and a guided path into each month.
                </p>
              </div>
              <div className="hidden rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4 md:block">
                <LuFolderOpen className="h-8 w-8 text-accent-primary" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                  <LuTrendingUp className="h-3.5 w-3.5 text-accent-primary" />
                  Annual Spend
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  ${yearSummary?.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
                </p>
              </div>
              <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                  <LuReceipt className="h-3.5 w-3.5 text-accent-primary" />
                  Transactions
                </div>
                <p className="text-2xl font-bold text-text-primary">
                  {yearSummary?.transactionCount.toLocaleString() ?? '0'}
                </p>
              </div>
              <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                  <LuCalendar className="h-3.5 w-3.5 text-accent-primary" />
                  Active Months
                </div>
                <p className="text-2xl font-bold text-text-primary">{yearSummary?.activeMonths ?? 0}</p>
                <p className="mt-1 text-xs text-text-muted">
                  {yearSummary?.topMonth ? `Peak month: ${yearSummary.topMonth.name}` : 'No activity yet'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {!loading && missingMonths.length > 0 && (
          <section className="shell-panel mb-6 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <LuCirclePlus className="h-4 w-4 text-accent-primary" />
                  <h2 className="text-sm font-semibold text-text-primary">Add Missing Month</h2>
                </div>
                <p className="text-sm text-text-muted">
                  Open an empty month workspace for {companyName} and start importing transactions right away.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <select
                  value={selectedMissingMonth}
                  onChange={(e) => setSelectedMissingMonth(e.target.value)}
                  className="rounded-xl border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                >
                  {missingMonths.map((monthNode) => (
                    <option key={monthNode.month} value={monthNode.month}>
                      {monthNode.name} {year}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (!selectedMissingMonth) return;
                    router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}/${selectedMissingMonth}`);
                  }}
                  disabled={!selectedMissingMonth}
                  className="rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Open Month
                </button>
              </div>
            </div>
          </section>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : months.length === 0 ? (
          <section className="rounded-2xl border border-border-primary bg-bg-secondary px-6 py-16 text-center">
            <div className="mx-auto max-w-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-bg-tertiary">
                <LuCalendar className="h-6 w-6 text-text-muted" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">No months found for this year</h2>
              <p className="mt-2 text-sm text-text-muted">
                Add expenses or import a CSV to start building out the {year} timeline for {companyName}.
              </p>
            </div>
          </section>
        ) : (
          <>
            <div className="mb-6 grid gap-6 xl:grid-cols-2">
              <DashboardPanel title="Year Snapshot" icon={<LuInbox className="h-4 w-4" />}>
                <SummaryCards expenses={yearExpenses} />
              </DashboardPanel>

              <DashboardPanel title="Spend Trend" icon={<LuChartLine className="h-4 w-4" />}>
                <MonthlyChart expenses={yearExpenses} />
              </DashboardPanel>

              <DashboardPanel title="Expense by Category" icon={<LuChartPie className="h-4 w-4" />}>
                {yearExpenses.length > 0 ? (
                  <CategoryBreakdown expenses={yearExpenses} />
                ) : (
                  <p className="text-sm text-text-muted">Add transactions to see which categories drive the year.</p>
                )}
              </DashboardPanel>

              <DashboardPanel title="Top Spending Months" icon={<LuCalendar className="h-4 w-4" />}>
                <div className="space-y-3">
                  {(yearAnalytics?.topMonths ?? []).map((monthNode, index) => (
                    <div key={monthNode.month} className="rounded-xl bg-bg-tertiary p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {index + 1}. {monthNode.name}
                          </p>
                          <p className="text-xs text-text-muted">
                            {monthNode.expenseCount} transaction{monthNode.expenseCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(monthNode.total)}</p>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-primary/70">
                        <div
                          className="h-full rounded-full bg-accent-primary"
                          style={{ width: `${((monthNode.total || 0) / (yearSummary?.maxMonthTotal || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {(yearAnalytics?.topMonths.length ?? 0) === 0 && (
                    <p className="text-sm text-text-muted">No monthly activity yet for this year.</p>
                  )}
                </div>
              </DashboardPanel>

              <DashboardPanel title="Largest Transactions" icon={<LuReceipt className="h-4 w-4" />}>
                <div className="space-y-3">
                  {(yearAnalytics?.topTransactions ?? []).map((expense) => (
                    <div key={expense.id} className="rounded-xl bg-bg-tertiary p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{expense.description}</p>
                          <p className="mt-1 text-xs text-text-muted">
                            {MONTH_NAMES[expense.month.split('-')[1] ?? ''] ?? expense.month} {year}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-text-primary">{formatCurrency(expense.amount)}</p>
                      </div>
                    </div>
                  ))}
                  {(yearAnalytics?.topTransactions.length ?? 0) === 0 && (
                    <p className="text-sm text-text-muted">No transactions yet for this year.</p>
                  )}
                </div>
              </DashboardPanel>

              <DashboardPanel title="Year Insights" icon={<LuTrendingUp className="h-4 w-4" />}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-bg-tertiary p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.16em] text-text-muted">Avg Active Month</p>
                    <p className="text-lg font-semibold text-text-primary">
                      {formatCurrency(yearAnalytics?.averagePerActiveMonth ?? 0)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-bg-tertiary p-4">
                    <p className="mb-1 text-xs uppercase tracking-[0.16em] text-text-muted">Top Category</p>
                    <p className="text-sm font-semibold text-text-primary">
                      {yearAnalytics?.topCategory ? yearAnalytics.topCategory.category : 'No category data yet'}
                    </p>
                    <p className="mt-1 text-xs text-text-muted">
                      {yearAnalytics?.topCategory ? formatCurrency(yearAnalytics.topCategory.total) : 'No spend yet'}
                    </p>
                  </div>
                  {(yearAnalytics?.quarterTotals ?? []).map((quarter) => (
                    <div key={quarter.label} className="rounded-xl bg-bg-tertiary p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-text-primary">{quarter.label}</p>
                        <p className="text-xs text-text-muted">{quarter.count} txns</p>
                      </div>
                      <p className="mt-2 text-base font-semibold text-text-primary">{formatCurrency(quarter.total)}</p>
                    </div>
                  ))}
                </div>
              </DashboardPanel>
            </div>

            <section className="mb-4">
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2">
                  <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                  <h2 className="text-sm font-semibold text-text-primary">Subfolders</h2>
                </div>
                {subfolders.length === 0 ? (
                  <div className="rounded-2xl border border-border-primary bg-bg-secondary/70 px-5 py-4">
                    <p className="text-sm text-text-muted">
                      Use the sidebar&apos;s <span className="font-medium text-text-secondary">Add Subfolder</span> action to create customer folders for this year.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {subfolders.map((subfolder) => (
                      <button
                        key={subfolder.id}
                        onClick={() =>
                          router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}/subfolder/${encodeFolderSlug(subfolder.name)}`)
                        }
                        className="group overflow-hidden rounded-2xl border border-border-primary bg-bg-secondary text-left transition-all hover:-translate-y-0.5 hover:border-accent-primary/50 hover:shadow-[0_18px_50px_rgba(37,99,235,0.08)]"
                      >
                        <div className="border-b border-border-primary bg-[linear-gradient(135deg,var(--bg-secondary),var(--bg-tertiary))] px-5 py-4">
                          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-primary/70">
                            <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                          </div>
                          <p className="text-lg font-semibold text-text-primary">{subfolder.name}</p>
                          <p className="mt-1 text-xs text-text-muted">Customer subfolder</p>
                        </div>
                        <div className="px-5 py-4">
                          <span className="text-xs font-medium text-accent-primary transition-transform group-hover:translate-x-0.5">
                            Open subfolder
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-3 flex items-center gap-2">
                <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Monthly Folders</h2>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {months.map((monthNode) => (
                  <button
                    key={monthNode.month}
                    onClick={() => router.push(`/dashboard/${encodeCompanySlug(companyName)}/${year}/${monthNode.month}`)}
                    className="group overflow-hidden rounded-2xl border border-border-primary bg-bg-secondary text-left transition-all hover:-translate-y-0.5 hover:border-accent-primary/50 hover:shadow-[0_18px_50px_rgba(37,99,235,0.08)]"
                  >
                    <div className="border-b border-border-primary bg-[linear-gradient(135deg,var(--bg-secondary),var(--bg-tertiary))] px-5 py-4">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-bg-primary/70">
                        <LuCalendar className="h-4 w-4 text-accent-primary" />
                      </div>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-text-primary">{monthNode.name}</p>
                          <p className="mt-1 text-xs text-text-muted">{year}</p>
                        </div>
                        <div className="rounded-full bg-bg-primary/70 px-2.5 py-1 text-[11px] font-medium text-text-secondary">
                          {monthNode.expenseCount} item{monthNode.expenseCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="px-5 py-4">
                      <div className="mb-3 flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-text-muted">Total Spend</p>
                          <p className="mt-1 text-xl font-bold text-text-primary">
                            {formatCurrency(monthNode.total)}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-accent-primary transition-transform group-hover:translate-x-0.5">
                          Open month
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-bg-tertiary">
                        <div
                          className="h-full rounded-full bg-accent-primary transition-all duration-500"
                          style={{
                            width: `${((monthNode.total || 0) / (yearSummary?.maxMonthTotal || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </>
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
    <div className="mx-auto max-w-6xl">
      <section className="hero-surface mb-6">
        <div className="bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.2),_transparent_42%),linear-gradient(135deg,var(--bg-secondary),var(--bg-primary))] px-6 py-7">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent-primary">Month View</p>
              <h1 className="font-display text-4xl font-bold text-text-primary md:text-5xl">{monthName} {year}</h1>
              <p className="mt-3 max-w-2xl text-sm text-text-secondary">
                {companyName} monthly operating view with imports, category cleanup, exports, and expense-level detail.
              </p>
            </div>
            <div className="flex items-center justify-end">
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-error/30 bg-bg-primary/60 px-3 py-2 text-xs font-medium text-error transition-colors hover:bg-error/10"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                  Delete Month
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-error/30 bg-error/5 px-3 py-2">
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
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                <LuTrendingUp className="h-3.5 w-3.5 text-accent-primary" />
                Month Total
              </div>
              <p className="text-2xl font-bold text-text-primary">
                ${monthSummary?.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </p>
            </div>
            <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                <LuReceipt className="h-3.5 w-3.5 text-accent-primary" />
                Transactions
              </div>
              <p className="text-2xl font-bold text-text-primary">{expenses.length.toLocaleString()}</p>
              <p className="mt-1 text-xs text-text-muted">
                Avg ${monthSummary?.average.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? '0.00'}
              </p>
            </div>
            <div className="rounded-2xl border border-border-primary/70 bg-bg-primary/60 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-text-muted">
                <LuChartPie className="h-3.5 w-3.5 text-accent-primary" />
                Largest Expense
              </div>
              <p className="truncate text-base font-semibold text-text-primary">
                {monthSummary?.topExpense?.description ?? 'No expenses yet'}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {monthSummary?.topExpense
                  ? `$${monthSummary.topExpense.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : 'Import a CSV to populate this view'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {hasExpenses && <SummaryCards expenses={expenses} />}

        <section className="shell-panel p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Import & Refresh</h2>
            <p className="mt-1 text-xs text-text-muted">
              Add new expenses straight into {companyName} / {monthName} {year}.
            </p>
          </div>
          <CSVUploader companyName={companyName} year={year} month={month} onUploadComplete={fetchExpenses} />
        </section>

        {hasExpenses && (
          <section className="shell-panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartLine className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Monthly Spending</h2>
            </div>
            <MonthlyChart expenses={expenses} />
          </section>
        )}

        {hasExpenses && (
          <section className="shell-panel p-6">
            <div className="mb-4 flex items-center gap-2">
              <LuChartPie className="h-4 w-4 text-accent-primary" />
              <h2 className="text-sm font-semibold text-text-primary">Category Breakdown</h2>
            </div>
            <CategoryBreakdown expenses={expenses} />
          </section>
        )}

        {hasExpenses && (
          <section className="shell-panel p-6">
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
          <section className="shell-panel px-6 py-16">
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
    </div>
  );
}
