'use client';

import { useMemo } from 'react';
import { LuDollarSign, LuReceipt, LuCalendar, LuTag } from 'react-icons/lu';
import { getCategoryName } from '@/lib/categories';
import { formatCurrency } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface SummaryCardsProps {
  expenses: CategorizedExpense[];
}

export default function SummaryCards({ expenses }: SummaryCardsProps) {
  const stats = useMemo(() => {
    if (expenses.length === 0) {
      return { total: 0, count: 0, months: 0, topCategory: 'N/A' };
    }

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const uniqueMonths = new Set(expenses.map(e => e.month)).size;

    // Find top category by total amount
    const catTotals: Record<string, number> = {};
    for (const e of expenses) {
      catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
    }
    const topCatId = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const topCategory = topCatId ? getCategoryName(topCatId) : 'N/A';

    return { total, count: expenses.length, months: uniqueMonths, topCategory };
  }, [expenses]);

  if (expenses.length === 0) return null;

  const cards = [
    {
      icon: LuDollarSign,
      label: 'Total Expenses',
      value: formatCurrency(stats.total),
    },
    {
      icon: LuReceipt,
      label: 'Transactions',
      value: stats.count.toLocaleString(),
    },
    {
      icon: LuCalendar,
      label: 'Months',
      value: String(stats.months),
    },
    {
      icon: LuTag,
      label: 'Top Category',
      value: stats.topCategory,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="rounded-xl border border-border-primary bg-bg-secondary p-4 transition-colors hover:bg-bg-tertiary/50"
        >
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-bg-tertiary">
            <card.icon className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="text-lg font-bold text-text-primary leading-tight truncate">
            {card.value}
          </p>
          <p className="mt-0.5 text-xs text-text-muted">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
