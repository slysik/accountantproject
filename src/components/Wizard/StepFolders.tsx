'use client';

import { useState, useMemo, useCallback } from 'react';
import { LuCheck, LuFolderOpen } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { createYearFolders } from '@/lib/database';
import { formatMonth } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface StepFoldersProps {
  expenses: CategorizedExpense[];
  onComplete: (year: string, assignedExpenses: Map<string, CategorizedExpense[]>) => void;
}

export default function StepFolders({ expenses, onComplete }: StepFoldersProps) {
  const { user } = useAuth();

  // Detect most common year from the data
  const detectedYear = useMemo(() => {
    const yearCounts: Record<string, number> = {};
    expenses.forEach((e) => {
      const d = e.date instanceof Date ? e.date : new Date(e.date);
      const y = String(d.getFullYear());
      yearCounts[y] = (yearCounts[y] || 0) + 1;
    });
    let maxYear = String(new Date().getFullYear());
    let maxCount = 0;
    for (const [y, c] of Object.entries(yearCounts)) {
      if (c > maxCount) {
        maxYear = y;
        maxCount = c;
      }
    }
    return maxYear;
  }, [expenses]);

  const [year, setYear] = useState(detectedYear);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(false);

  // Group expenses by month
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

  const sortedMonths = useMemo(
    () => Array.from(byMonth.keys()).sort(),
    [byMonth]
  );

  const handleCreateFolders = useCallback(async () => {
    if (!user) return;
    setCreating(true);
    try {
      await createYearFolders(user.id, year);
      setCreated(true);
    } finally {
      setCreating(false);
    }
  }, [user, year]);

  const handleContinue = useCallback(() => {
    onComplete(year, byMonth);
  }, [year, byMonth, onComplete]);

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-text-primary">
        Organize into Folders
      </h2>

      {/* Year selector */}
      <div className="mb-5 flex items-center gap-3">
        <label className="text-xs text-text-muted">Year:</label>
        <input
          type="text"
          value={year}
          onChange={(e) => {
            setYear(e.target.value);
            setCreated(false);
          }}
          className="w-24 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
        />
      </div>

      {/* Months breakdown */}
      <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {sortedMonths.map((monthKey) => {
          const monthExpenses = byMonth.get(monthKey) || [];
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

      {/* Create folders */}
      {!created ? (
        <button
          onClick={handleCreateFolders}
          disabled={creating || !year}
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
              Create Folders for {year}
            </>
          )}
        </button>
      ) : (
        <div>
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-4 py-3">
            <LuCheck className="h-4 w-4 text-success" />
            <span className="text-xs font-medium text-success">
              Created 12 month folders for {year}
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
