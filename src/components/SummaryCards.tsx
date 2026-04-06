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
      hint: stats.count > 0 ? `${formatCurrency(stats.total / stats.count)} avg transaction` : 'No transactions yet',
    },
    {
      icon: LuReceipt,
      label: 'Transactions',
      value: stats.count.toLocaleString(),
      hint: `${stats.months} active month${stats.months === 1 ? '' : 's'}`,
    },
    {
      icon: LuCalendar,
      label: 'Months',
      value: String(stats.months),
      hint: stats.months > 0 ? 'Months with recorded activity' : 'Waiting for imports',
    },
    {
      icon: LuTag,
      label: 'Top Category',
      value: stats.topCategory,
      hint: 'Largest share of spend',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="group overflow-hidden rounded-[24px] border border-border-primary/80 bg-bg-secondary/85 p-4 shadow-[0_18px_50px_rgba(0,0,0,0.14)] backdrop-blur-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary/40"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-primary/12 ring-1 ring-accent-primary/20">
              <card.icon className="h-4 w-4 text-accent-primary" />
            </div>
            <span className="rounded-full border border-border-primary/70 bg-bg-primary/60 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-text-muted">
              Live
            </span>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            {card.label}
          </p>
          <p className="mt-2 font-display text-2xl font-bold leading-tight text-text-primary">
            {card.value}
          </p>
          <p className="mt-2 text-xs text-text-secondary">{card.hint}</p>
        </div>
      ))}
    </div>
  );
}
