'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { getTrash, restoreExpense, permanentDeleteExpense } from '@/lib/database';
import TrashBin from '@/components/TrashBin';
import type { CategorizedExpense } from '@/types';

export default function TrashPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<CategorizedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const trashed = await getTrash(user.id);
      setItems(trashed);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  /**
   * Extract year and month from the expense's own month/year fields.
   */
  function getExpenseLocation(expense: CategorizedExpense): {
    companyName: string;
    year: string;
    month: string;
  } {
    const companyName = expense.companyName ?? 'My Company';
    const year = expense.year ?? expense.month.split('-')[0];
    const month = expense.month.split('-')[1];
    return { companyName, year, month };
  }

  const handleRestore = useCallback(
    async (expense: CategorizedExpense) => {
      if (!user) return;
      const { companyName, year, month } = getExpenseLocation(expense);
      await restoreExpense(user.id, companyName, year, month, expense.id);
      await fetchTrash();
    },
    [user, fetchTrash]
  );

  const handlePermanentDelete = useCallback(
    async (expense: CategorizedExpense) => {
      if (!user) return;
      const { year, month } = getExpenseLocation(expense);
      await permanentDeleteExpense(user.id, year, month, expense.id);
      await fetchTrash();
    },
    [user, fetchTrash]
  );

  const handleEmptyTrash = useCallback(async () => {
    if (!user) return;
    for (const expense of items) {
      const { year, month } = getExpenseLocation(expense);
      await permanentDeleteExpense(user.id, year, month, expense.id);
    }
    await fetchTrash();
  }, [user, items, fetchTrash]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg-tertiary">
          <LuTrash2 className="h-5 w-5 text-text-muted" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-text-primary">Trash</h1>
          <p className="text-xs text-text-muted">
            Deleted expenses can be restored or permanently removed.
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-12 text-center">
          <LuTrash2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">No deleted expenses</p>
        </div>
      ) : (
        <TrashBin
          items={items}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onEmptyTrash={handleEmptyTrash}
        />
      )}
    </div>
  );
}
