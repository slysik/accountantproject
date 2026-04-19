'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuCheck, LuSave } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { getUserFolders } from '@/lib/database';
import { formatCurrency } from '@/lib/expense-processor';
import { bulkCreateIncome, INCOME_TYPE_LABELS } from '@/lib/income-database';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { Income } from '@/types';

interface StepCommitProps {
  rows: Income[];
  initialCompanyName?: string;
  onBack: () => void;
}

export default function IncomeStepCommit({ rows, initialCompanyName = '', onBack }: StepCommitProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [existingCompanies, setExistingCompanies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!effectiveUserId) return;
    getUserFolders(effectiveUserId)
      .then((folders) => {
        const names = Array.from(new Set(folders.map((f) => f.companyName))).sort();
        setExistingCompanies(names);
        if (!companyName && names.length === 1) setCompanyName(names[0]);
      })
      .catch(() => {});
  }, [effectiveUserId, companyName]);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  const typeCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.incomeType] = (acc[r.incomeType] ?? 0) + 1;
    return acc;
  }, {});

  const handleSave = useCallback(async () => {
    if (!effectiveUserId || !companyName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const tagged = rows.map((r) => ({ ...r, companyName: companyName.trim() }));
      await bulkCreateIncome(effectiveUserId, tagged);
      setSavedCount(tagged.length);
      setSaved(true);
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Failed to save income.';
      if (msg.includes('42P01')) {
        setError('The income table does not exist yet. Please run migration 026_income.sql in your Supabase SQL editor.');
      } else {
        setError(msg);
      }
    } finally {
      setSaving(false);
    }
  }, [effectiveUserId, companyName, rows]);

  if (saved) {
    return (
      <div className="flex flex-col items-center gap-5 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
          <LuCheck className="h-8 w-8 text-success" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-text-primary">Income saved!</h3>
          <p className="mt-1 text-sm text-text-secondary">
            {savedCount} transaction{savedCount !== 1 ? 's' : ''} totalling {formatCurrency(total)} committed to <strong>{companyName}</strong>.
          </p>
        </div>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark"
        >
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs text-text-muted">Transactions</p>
          <p className="mt-1 text-2xl font-bold text-text-primary">{rows.length}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <p className="text-xs text-text-muted">Total income</p>
          <p className="mt-1 text-2xl font-bold text-success">{formatCurrency(total)}</p>
        </div>
      </div>

      {/* Type breakdown */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Income breakdown by type</p>
        <div className="flex flex-col gap-2">
          {Object.entries(typeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">{INCOME_TYPE_LABELS[type as keyof typeof INCOME_TYPE_LABELS]}</span>
              <span className="font-semibold text-text-primary">{count} row{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Company selector */}
      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Assign to company</p>
        {existingCompanies.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {existingCompanies.map((c) => (
              <button
                key={c}
                onClick={() => setCompanyName(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${companyName === c ? 'border-accent-primary bg-accent-primary/10 text-accent-primary' : 'border-border-primary text-text-secondary hover:border-accent-primary/50'}`}
              >
                {c}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Company or entity name"
          className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-primary"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs text-text-muted hover:text-text-secondary">
          ← Back
        </button>
        <button
          disabled={saving || !companyName.trim()}
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark disabled:opacity-40"
        >
          <LuSave className="h-4 w-4" />
          {saving ? 'Saving…' : 'Commit income'}
        </button>
      </div>
    </div>
  );
}
