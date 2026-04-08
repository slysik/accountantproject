'use client';

import { useState, useEffect, useCallback } from 'react';
import { LuTrash2 } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { getDeletedCompanies, getTrash, permanentDeleteCompany, permanentDeleteExpense, restoreCompany, restoreExpense } from '@/lib/database';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import TrashBin from '@/components/TrashBin';
import type { CategorizedExpense, TrashCompanyItem } from '@/types';

export default function TrashPage() {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [items, setItems] = useState<CategorizedExpense[]>([]);
  const [companies, setCompanies] = useState<TrashCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrash = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const [trashedCompanies, trashed] = await Promise.all([
        getDeletedCompanies(effectiveUserId),
        getTrash(effectiveUserId),
      ]);
      setCompanies(trashedCompanies);
      setItems(trashed);
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

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
      if (!effectiveUserId) return;
      await restoreExpense(effectiveUserId, companyName, year, month, expense.id);
      await fetchTrash();
    },
    [effectiveUserId, user, fetchTrash]
  );

  const handleRestoreCompany = useCallback(
    async (company: TrashCompanyItem) => {
      if (!effectiveUserId) return;
      await restoreCompany(effectiveUserId, company.name);
      await fetchTrash();
    },
    [effectiveUserId, fetchTrash]
  );

  const handlePermanentDelete = useCallback(
    async (expense: CategorizedExpense) => {
      if (!user) return;
      const { year, month } = getExpenseLocation(expense);
      if (!effectiveUserId) return;
      await permanentDeleteExpense(effectiveUserId, year, month, expense.id);
      await fetchTrash();
    },
    [effectiveUserId, user, fetchTrash]
  );

  const handlePermanentDeleteCompany = useCallback(
    async (company: TrashCompanyItem) => {
      if (!effectiveUserId) return;
      await permanentDeleteCompany(effectiveUserId, company.name);
      await fetchTrash();
    },
    [effectiveUserId, fetchTrash]
  );

  const handleEmptyTrash = useCallback(async () => {
    if (!user) return;
    if (!effectiveUserId) return;
    for (const company of companies) {
      await permanentDeleteCompany(effectiveUserId, company.name);
    }
    for (const expense of items) {
      const { year, month } = getExpenseLocation(expense);
      await permanentDeleteExpense(effectiveUserId, year, month, expense.id);
    }
    await fetchTrash();
  }, [companies, effectiveUserId, user, items, fetchTrash]);

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
      ) : items.length === 0 && companies.length === 0 ? (
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-12 text-center">
          <LuTrash2 className="mx-auto mb-3 h-8 w-8 text-text-muted" />
          <p className="text-sm text-text-muted">Trash is empty</p>
        </div>
      ) : (
        <TrashBin
          companies={companies}
          items={items}
          onRestoreCompany={handleRestoreCompany}
          onPermanentDeleteCompany={handlePermanentDeleteCompany}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
          onEmptyTrash={handleEmptyTrash}
        />
      )}
    </div>
  );
}
