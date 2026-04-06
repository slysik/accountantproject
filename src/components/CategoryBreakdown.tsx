'use client';

import { useMemo } from 'react';
import { getCategoryName } from '@/lib/categories';
import { formatCurrency } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface CategoryBreakdownProps {
  expenses: CategorizedExpense[];
}

interface CategoryTotal {
  id: string;
  name: string;
  total: number;
  count: number;
  percentage: number;
}

export default function CategoryBreakdown({ expenses }: CategoryBreakdownProps) {
  const categoryTotals = useMemo((): CategoryTotal[] => {
    if (expenses.length === 0) return [];

    const totals: Record<string, { total: number; count: number }> = {};

    for (const expense of expenses) {
      if (!totals[expense.category]) {
        totals[expense.category] = { total: 0, count: 0 };
      }
      totals[expense.category].total += expense.amount;
      totals[expense.category].count++;
    }

    const grandTotal = Object.values(totals).reduce((sum, cat) => sum + cat.total, 0);

    return Object.entries(totals)
      .map(([id, data]) => ({
        id,
        name: getCategoryName(id),
        total: data.total,
        count: data.count,
        percentage: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  if (expenses.length === 0) return null;

  const maxTotal = categoryTotals[0]?.total ?? 1;

  return (
    <div className="space-y-3">
      {categoryTotals.map(cat => (
        <div key={cat.id} className="group rounded-2xl border border-border-primary/60 bg-bg-tertiary/50 p-4 transition-all duration-200 hover:border-accent-primary/35 hover:bg-bg-tertiary/70">
          <div className="mb-2 flex items-start justify-between gap-3">
            <div>
              <span className="text-sm font-semibold text-text-primary">{cat.name}</span>
              <p className="mt-1 text-xs text-text-muted">{cat.count} transaction{cat.count === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right">
              <span className="block text-sm font-semibold text-text-primary">{formatCurrency(cat.total)}</span>
              <span className="text-[11px] uppercase tracking-[0.14em] text-text-muted">{cat.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg-primary/70">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,var(--accent-primary),var(--success))] transition-all duration-500"
              style={{ width: `${(cat.total / maxTotal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
