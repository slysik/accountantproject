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
        <div key={cat.id} className="group">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-text-primary font-medium">{cat.name}</span>
            <div className="flex items-center gap-3">
              <span className="text-text-primary font-mono">{formatCurrency(cat.total)}</span>
              <span className="w-12 text-right text-text-muted">{cat.percentage.toFixed(1)}%</span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-bg-tertiary overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-primary transition-all duration-500 group-hover:bg-accent-dark"
              style={{ width: `${(cat.total / maxTotal) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
