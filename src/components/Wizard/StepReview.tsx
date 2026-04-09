'use client';

import { useCallback, useMemo, useState } from 'react';
import { LuArrowRight, LuTrash2 } from 'react-icons/lu';
import { formatCurrency, formatDate } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface StepReviewProps {
  expenses: CategorizedExpense[];
  onComplete: (_expenses: CategorizedExpense[]) => void;
}

export default function StepReview({ expenses, onComplete }: StepReviewProps) {
  const [localExpenses, setLocalExpenses] = useState<CategorizedExpense[]>(expenses);

  const totalAmount = useMemo(
    () => localExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [localExpenses]
  );

  const handleDelete = useCallback((expenseId: string) => {
    setLocalExpenses((current) => current.filter((expense) => expense.id !== expenseId));
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
          Step 2
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          Review the mapped entries
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Remove anything you do not want committed. This is the clean list that will go through category mapping next.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border-primary bg-bg-tertiary/30 px-4 py-3 text-xs text-text-secondary">
        <span>{localExpenses.length} entries ready</span>
        <span className="text-text-muted">|</span>
        <span className="font-medium text-accent-primary">{formatCurrency(totalAmount)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-primary bg-bg-secondary">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border-primary bg-bg-tertiary/50 text-left text-text-muted">
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Description</th>
              <th className="px-3 py-2 font-medium text-right">Amount</th>
              <th className="px-3 py-2 font-medium">Imported Category</th>
              <th className="px-3 py-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {localExpenses.map((expense) => (
              <tr key={expense.id} className="border-b border-border-primary/40 last:border-b-0">
                <td className="px-3 py-2 text-text-secondary">{formatDate(expense.date)}</td>
                <td className="px-3 py-2 text-text-primary">{expense.description}</td>
                <td className="px-3 py-2 text-right font-mono text-text-primary">{formatCurrency(expense.amount)}</td>
                <td className="px-3 py-2 text-text-secondary">{expense.originalCategory || '-'}</td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-error"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onComplete(localExpenses)}
          disabled={localExpenses.length === 0}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
        >
          Let AI map categories
          <LuArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs text-text-muted">You can still fine-tune categories after the AI pass.</p>
      </div>
    </div>
  );
}
