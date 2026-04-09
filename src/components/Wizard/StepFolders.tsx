'use client';

import { useState, useMemo, useCallback } from 'react';
import { LuCheck, LuFolderOpen } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { createYearFolders } from '@/lib/database';
import { DEFAULT_COMPANY_NAME } from '@/lib/company';
import { formatMonth } from '@/lib/expense-processor';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { CategorizedExpense } from '@/types';

interface StepFoldersProps {
  expenses: CategorizedExpense[];
  onComplete: (_companyName: string, _year: string, _assignedExpenses: Map<string, CategorizedExpense[]>) => void;
}

export default function StepFolders({ expenses, onComplete }: StepFoldersProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [companyName, setCompanyName] = useState(DEFAULT_COMPANY_NAME);

  // Detect ALL unique years from the data (sorted), plus identify the most common one
  const { allYears, primaryYear } = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    expenses.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const y = String(d.getFullYear());
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    });
    const sorted = Object.entries(yearCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([year, count]) => ({ year, count }));

    let primary = String(new Date().getFullYear());
    let maxCount = 0;
    for (const { year, count } of sorted) {
      if (count > maxCount) {
        primary = year;
        maxCount = count;
      }
    }
    return { allYears: sorted, primaryYear: primary };
  }, [expenses]);

  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Group expenses by year then month for display
  const byYearMonth = useMemo(() => {
    const map = new Map<string, Map<string, CategorizedExpense[]>>();
    expenses.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const y = String(d.getFullYear());
      const monthKey = String(d.getMonth() + 1).padStart(2, '0');
      if (!map.has(y)) map.set(y, new Map());
      const yearMap = map.get(y)!;
      const existing = yearMap.get(monthKey) || [];
      existing.push(e);
      yearMap.set(monthKey, existing);
    });
    return map;
  }, [expenses]);

  // Flat month map (for backward-compatible onComplete signature)
  const byMonth = useMemo(() => {
    const map = new Map<string, CategorizedExpense[]>();
    expenses.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const monthKey = String(d.getMonth() + 1).padStart(2, '0');
      const existing = map.get(monthKey) || [];
      existing.push(e);
      map.set(monthKey, existing);
    });
    return map;
  }, [expenses]);

  const handleCreateFolders = useCallback(async () => {
    if (!effectiveUserId) return;
    setCreating(true);
    try {
      // Create folder records for EVERY year found in the data
      for (const { year } of allYears) {
        await createYearFolders(effectiveUserId, companyName.trim(), year);
      }
      setCreated(true);
    } finally {
      setCreating(false);
    }
  }, [effectiveUserId, allYears, companyName]);

  const handleContinue = useCallback(() => {
    onComplete(companyName.trim(), primaryYear, byMonth);
  }, [companyName, primaryYear, byMonth, onComplete]);

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-text-primary">
        Organize into Folders
      </h2>

      {/* Year summary */}
      <div className="mb-5">
        <label className="mb-2 block text-xs text-text-muted">Company name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="My Company"
          className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
        />
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-xs text-text-muted">
          {allYears.length === 1
            ? 'Detected year:'
            : `Detected ${allYears.length} years:`}
        </label>
        <div className="flex flex-wrap gap-2">
          {allYears.map(({ year, count }) => (
            <span
              key={year}
              className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary"
            >
              {year}{' '}
              <span className="text-text-muted">
                ({count} expense{count !== 1 ? 's' : ''})
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Months breakdown per year */}
      {allYears.map(({ year }) => {
        const yearMonths = byYearMonth.get(year);
        if (!yearMonths) return null;
        const sortedMonths = Array.from(yearMonths.keys()).sort();
        return (
          <div key={year} className="mb-5">
            {allYears.length > 1 && (
              <h3 className="mb-2 text-xs font-semibold text-text-secondary">
                {year}
              </h3>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {sortedMonths.map((monthKey) => {
                const monthExpenses = yearMonths.get(monthKey) || [];
                const monthLabel = formatMonth(`${year}-${monthKey}`);
                return (
                  <div
                    key={monthKey}
                    className="rounded-lg border border-border-primary bg-bg-tertiary p-3"
                  >
                    <div className="flex items-center gap-2">
                      <LuFolderOpen className="h-3.5 w-3.5 text-accent-primary" />
                      <span className="text-xs font-medium text-text-primary">
                        {monthLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {monthExpenses.length} expense
                      {monthExpenses.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Create folders */}
      {!created ? (
        <button
          onClick={handleCreateFolders}
          disabled={creating || allYears.length === 0 || !companyName.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {creating ? (
            <>
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-bg-primary border-t-transparent" />
              Creating...
            </>
          ) : (
            <>
              <LuFolderOpen className="h-3.5 w-3.5" />
              {allYears.length === 1
                ? `Create Folders for ${allYears[0].year}`
                : `Create Folders for ${allYears.length} Years`}
            </>
          )}
        </button>
      ) : (
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">
              {allYears.length === 1
                ? `Created 12 month folders for ${allYears[0].year}`
                : `Created folders for ${allYears.map((y) => y.year).join(', ')}`}
            </span>
          </div>
          <button
            onClick={handleContinue}
            className="rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Continue to Categorize
          </button>
        </div>
      )}
    </div>
  );
}
