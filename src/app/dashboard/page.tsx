'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { LuChartLine, LuDatabase, LuFileText, LuSparkles, LuTrendingUp, LuWand } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { getCategoryName } from '@/lib/categories';
import { getAllExpenses } from '@/lib/database';
import { formatCurrency } from '@/lib/expense-processor';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import CategoryBreakdown from '@/components/CategoryBreakdown';
import MonthlyChart from '@/components/MonthlyChart';
import SummaryCards from '@/components/SummaryCards';
import type { CategorizedExpense } from '@/types';

function YearBars({ expenses }: { expenses: CategorizedExpense[] }) {
  const rows = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const expense of expenses) {
      const year = expense.year ?? expense.month.slice(0, 4);
      totals[year] = (totals[year] || 0) + expense.amount;
    }

    const entries = Object.entries(totals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, total], index, arr) => {
        const previous = index > 0 ? arr[index - 1][1] : null;
        const deltaPct = previous && previous > 0 ? ((total - previous) / previous) * 100 : null;
        return { year, total, deltaPct };
      });

    const max = Math.max(...entries.map((entry) => entry.total), 1);
    return { entries, max };
  }, [expenses]);

  if (rows.entries.length === 0) return null;

  return (
    <div className="space-y-4">
      {rows.entries.map((entry) => (
        <div key={entry.year} className="rounded-xl border border-border-primary bg-bg-secondary/70 p-4">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-text-primary">{entry.year}</p>
              <p className="text-xs text-text-muted">Total categorized spend</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-text-primary">{formatCurrency(entry.total)}</p>
              <p className={`text-xs ${entry.deltaPct === null ? 'text-text-muted' : entry.deltaPct >= 0 ? 'text-accent-primary' : 'text-success'}`}>
                {entry.deltaPct === null ? 'Baseline year' : `${entry.deltaPct >= 0 ? '+' : ''}${entry.deltaPct.toFixed(1)}% vs prior year`}
              </p>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-bg-tertiary">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-500"
              style={{ width: `${(entry.total / rows.max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightPanel({ expenses, isSample }: { expenses: CategorizedExpense[]; isSample: boolean }) {
  const insights = useMemo(() => {
    if (expenses.length === 0) return [];

    const totalsByYear: Record<string, number> = {};
    const totalsByCategory: Record<string, number> = {};
    for (const expense of expenses) {
      const year = expense.year ?? expense.month.slice(0, 4);
      totalsByYear[year] = (totalsByYear[year] || 0) + expense.amount;
      totalsByCategory[expense.category] = (totalsByCategory[expense.category] || 0) + expense.amount;
    }

    const years = Object.entries(totalsByYear).sort(([a], [b]) => a.localeCompare(b));
    const latestYear = years[years.length - 1];
    const priorYear = years[years.length - 2];
    const topCategory = Object.entries(totalsByCategory).sort((a, b) => b[1] - a[1])[0];
    const recentRunRate = years.length > 0 ? latestYear[1] / new Set(expenses.filter((e) => (e.year ?? e.month.slice(0, 4)) === latestYear[0]).map((e) => e.month)).size : 0;

    return [
      latestYear
        ? {
            label: 'Current focus',
            value: `${latestYear[0]} spend is ${formatCurrency(latestYear[1])}`,
          }
        : null,
      topCategory
        ? {
            label: 'Largest category',
            value: `${getCategoryName(topCategory[0])} leads at ${formatCurrency(topCategory[1])}`,
          }
        : null,
      latestYear && priorYear
        ? {
            label: 'Year-over-year',
            value: `${(((latestYear[1] - priorYear[1]) / priorYear[1]) * 100).toFixed(1)}% change from ${priorYear[0]} to ${latestYear[0]}`,
          }
        : null,
      recentRunRate
        ? {
            label: 'Monthly run rate',
            value: `About ${formatCurrency(recentRunRate)} per active month`,
          }
        : null,
    ].filter(Boolean) as Array<{ label: string; value: string }>;
  }, [expenses]);

  return (
    <section className="shell-panel p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LuSparkles className="h-4 w-4 text-accent-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Analysis Snapshot</h2>
        </div>
        {isSample && (
          <span className="rounded-full bg-accent-primary/10 px-2.5 py-1 text-[11px] font-medium text-accent-primary">
            Sample data
          </span>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.label} className="rounded-xl bg-bg-tertiary p-4">
            <p className="mb-1 text-xs uppercase tracking-[0.16em] text-text-muted">{insight.label}</p>
            <p className="text-sm font-medium text-text-primary">{insight.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';
  const [expenses, setExpenses] = useState<CategorizedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!effectiveUserId) return;
    getAllExpenses(effectiveUserId)
      .then((rows) => setExpenses(rows))
      .catch((err) => console.error('Failed to load dashboard expenses:', err))
      .finally(() => setLoading(false));
  }, [effectiveUserId]);

  const hasData = expenses.length > 0;

  return (
    <div className="mx-auto max-w-7xl">
      <section className="mb-8 overflow-hidden rounded-2xl border" style={{borderColor:'#e8e4df',background:'linear-gradient(135deg,#faf9f7 0%,#f5f0ea 100%)'}}>
        <div style={{background:'radial-gradient(900px 500px at 90% -10%,rgba(217,119,6,.08),transparent 60%)',padding:'28px 32px 28px'}}>
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p style={{fontSize:11,fontWeight:700,letterSpacing:'.22em',textTransform:'uppercase',color:'#9a8570',marginBottom:10}}>Control Center</p>
              <h1 style={{fontSize:'clamp(28px,3.6vw,42px)',fontWeight:800,letterSpacing:'-.03em',lineHeight:1.05,color:'#1a1208',margin:0}}>
                Welcome back, {displayName}
              </h1>
              <p style={{marginTop:10,maxWidth:600,fontSize:15,color:'#7a6a55',lineHeight:1.55}}>
                {hasData
                  ? 'Your live finance pulse across categories, trends, and year-over-year movement.'
                  : 'Import a CSV to start tracking expenses. Use the wizard to upload, categorize, and commit transactions to a company.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/wizard"
                className="inline-flex items-center gap-2"
                style={{background:'#d97706',color:'#fff',padding:'11px 20px',borderRadius:12,fontWeight:700,fontSize:14,boxShadow:'0 10px 28px -10px rgba(217,119,6,.55)',textDecoration:'none'}}
              >
                <LuWand className="h-4 w-4" />
                Start Wizard
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {[
              {label:'Live reporting', value: hasData ? 'Active' : '—', sub: hasData ? 'Your analysis reflects current categorized expenses.' : 'No expense data yet.'},
              {label:'Coverage', value: hasData ? `${new Set(expenses.map((item) => item.month)).size} months` : '0 months', sub: hasData ? 'Cross-year visibility for planning and cleanup.' : 'Import expenses to see coverage.'},
              {label:'Next best move', value: hasData ? 'Review trends' : 'Import data', sub: hasData ? 'Use the year and month views to drill into spend shifts.' : 'Use the wizard to upload and categorize your first CSV.'},
            ].map(card => (
              <div key={card.label} style={{background:'#fff',border:'1px solid #e8e4df',borderRadius:16,padding:'18px 20px'}}>
                <p style={{fontSize:10,fontWeight:700,letterSpacing:'.2em',textTransform:'uppercase',color:'#9a8570',margin:'0 0 8px'}}>{card.label}</p>
                <p style={{fontSize:22,fontWeight:800,color:'#1a1208',margin:0,letterSpacing:'-.02em'}}>{card.value}</p>
                <p style={{marginTop:6,fontSize:12,color:'#7a6a55',lineHeight:1.5}}>{card.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-bg-secondary" />
          ))}
        </div>
      ) : (
        <>
          <SummaryCards expenses={expenses} />

          {!hasData && (
            <div className="mt-6 shell-panel p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-primary/12 ring-1 ring-accent-primary/18">
                    <LuDatabase className="h-5 w-5 text-accent-primary" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-bold text-text-primary">No expense data yet</h2>
                    <p className="mt-1 text-sm text-text-secondary">
                      You&apos;re viewing sample analytics. Import a CSV to replace these visuals with your real books.
                    </p>
                  </div>
                </div>
                <Link
                  href="/dashboard/wizard"
                  className="inline-flex items-center gap-2 rounded-full bg-bg-primary px-4 py-2 text-xs font-semibold text-text-primary transition-colors hover:bg-bg-tertiary"
                >
                  <LuFileText className="h-3.5 w-3.5 text-accent-primary" />
                  Import Sample or CSV
                </Link>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="shell-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <LuChartLine className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Spend Trend</h2>
              </div>
              <MonthlyChart expenses={expenses} />
            </section>

            <InsightPanel expenses={expenses} isSample={!hasData} />
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="shell-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <LuTrendingUp className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Year-over-Year</h2>
              </div>
              <YearBars expenses={expenses} />
            </section>

            <section className="shell-panel p-6">
              <div className="mb-4 flex items-center gap-2">
                <LuFileText className="h-4 w-4 text-accent-primary" />
                <h2 className="text-sm font-semibold text-text-primary">Expense by Category</h2>
              </div>
              <CategoryBreakdown expenses={expenses} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
