'use client';

import { useState, useCallback } from 'react';
import { LuArrowRight, LuCircleAlert } from 'react-icons/lu';
import { formatCurrency } from '@/lib/expense-processor';
import { INCOME_TYPE_LABELS, detectIncomeType } from '@/lib/income-database';
import type { Income, IncomeType } from '@/types';

interface StepReviewProps {
  rows: Income[];
  onComplete: (_rows: Income[]) => void;
  onBack: () => void;
}

const INCOME_TYPES: IncomeType[] = ['check', 'bank_deposit', 'cash', 'credit', 'other'];

export default function IncomeStepReview({ rows, onComplete, onBack }: StepReviewProps) {
  const [items, setItems] = useState<Income[]>(() =>
    rows.map((r) => ({
      ...r,
      incomeType: r.incomeType !== 'other' ? r.incomeType : detectIncomeType(r.description),
    }))
  );

  const unknownSource = items.filter((r) => !r.source.trim());
  const hasUnresolved = unknownSource.length > 0;

  const updateType = useCallback((idx: number, type: IncomeType) => {
    setItems((prev) => prev.map((r, i) => i === idx ? { ...r, incomeType: type } : r));
  }, []);

  const updateSource = useCallback((idx: number, source: string) => {
    setItems((prev) => prev.map((r, i) => i === idx ? { ...r, source } : r));
  }, []);

  const removeRow = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const total = items.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs text-text-muted">Transactions</p>
          <p className="mt-1 text-xl font-bold text-text-primary">{items.length}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs text-text-muted">Total income</p>
          <p className="mt-1 text-xl font-bold text-success">{formatCurrency(total)}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs text-text-muted">Source needed</p>
          <p className={`mt-1 text-xl font-bold ${hasUnresolved ? 'text-accent-primary' : 'text-success'}`}>
            {unknownSource.length}
          </p>
        </div>
      </div>

      {hasUnresolved && (
        <div className="flex items-start gap-3 rounded-xl border border-accent-primary/20 bg-accent-primary/8 px-4 py-3">
          <LuCircleAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent-primary" />
          <p className="text-xs text-text-secondary">
            <span className="font-semibold text-text-primary">{unknownSource.length} row{unknownSource.length !== 1 ? 's' : ''}</span> need a source — enter who or where the income came from so your records are complete.
          </p>
        </div>
      )}

      {/* Row table */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary">
        <div className="border-b border-border-primary px-4 py-3">
          <p className="text-xs font-semibold text-text-primary">Review each transaction</p>
          <p className="text-xs text-text-muted">Adjust income type and enter source for any unknown rows.</p>
        </div>
        <div className="divide-y divide-border-primary/50">
          {items.map((row, idx) => (
            <div key={idx} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start">
              {/* Left: date + description + amount */}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-xs text-text-muted">{row.date}</span>
                  <span className="text-sm font-medium text-text-primary truncate">{row.description}</span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-success">{formatCurrency(row.amount)}</p>
              </div>

              {/* Right: type selector + source input */}
              <div className="flex flex-col gap-2 sm:w-64">
                <select
                  value={row.incomeType}
                  onChange={(e) => updateType(idx, e.target.value as IncomeType)}
                  className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary"
                >
                  {INCOME_TYPES.map((t) => (
                    <option key={t} value={t}>{INCOME_TYPE_LABELS[t]}</option>
                  ))}
                </select>

                <input
                  type="text"
                  value={row.source}
                  onChange={(e) => updateSource(idx, e.target.value)}
                  placeholder={row.source ? undefined : '⚠ Who/where is this from?'}
                  className={`rounded-lg border px-3 py-1.5 text-xs text-text-primary outline-none focus:border-accent-primary ${!row.source.trim() ? 'border-accent-primary/50 bg-accent-primary/5 placeholder:text-accent-primary/70' : 'border-border-primary bg-bg-tertiary'}`}
                />
              </div>

              <button
                onClick={() => removeRow(idx)}
                className="text-xs text-text-muted hover:text-error"
                title="Remove row"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-text-muted hover:text-text-secondary">
          ← Back
        </button>
        <button
          disabled={items.length === 0}
          onClick={() => onComplete(items)}
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark disabled:opacity-40"
        >
          Continue to commit
          <LuArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
