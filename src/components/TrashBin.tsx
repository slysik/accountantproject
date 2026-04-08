'use client';

import { useState } from 'react';
import { LuBuilding2, LuTrash2, LuUndo2 } from 'react-icons/lu';
import { getCategoryName } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/expense-processor';
import type { CategorizedExpense, TrashCompanyItem } from '@/types';

interface TrashBinProps {
  companies: TrashCompanyItem[];
  items: CategorizedExpense[];
  onRestoreCompany: (company: TrashCompanyItem) => void;
  onPermanentDeleteCompany: (company: TrashCompanyItem) => void;
  onRestore: (expense: CategorizedExpense) => void;
  onPermanentDelete: (expense: CategorizedExpense) => void;
  onEmptyTrash: () => void;
}

export default function TrashBin({
  companies,
  items,
  onRestoreCompany,
  onPermanentDeleteCompany,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: TrashBinProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCompanyId, setConfirmDeleteCompanyId] = useState<string | null>(null);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);

  // Sort by deletedAt descending (most recent first)
  const sorted = [...items].sort((a, b) => {
    const aTime = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const bTime = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return bTime - aTime;
  });

  return (
    <div>
      {/* Empty Trash button */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-text-muted">
          {companies.length} deleted compan{companies.length === 1 ? 'y' : 'ies'} and {items.length} deleted expense{items.length !== 1 ? 's' : ''}
        </p>

        {confirmEmptyTrash ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-warning">
              Delete all trash items permanently?
            </span>
            <button
              onClick={() => {
                onEmptyTrash();
                setConfirmEmptyTrash(false);
              }}
              className="rounded-lg bg-error px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-error/80"
            >
              Yes, delete all
            </button>
            <button
              onClick={() => setConfirmEmptyTrash(false)}
              className="rounded-lg border border-border-primary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmEmptyTrash(true)}
            className="flex items-center gap-1.5 rounded-lg border border-error/30 bg-error/10 px-3 py-1.5 text-xs font-medium text-error transition-colors hover:bg-error/20"
          >
            <LuTrash2 className="h-3.5 w-3.5" />
            Empty Trash
          </button>
        )}
      </div>

      {companies.length > 0 && (
        <div className="mb-6 rounded-lg border border-border-primary">
          <div className="border-b border-border-primary bg-bg-tertiary/50 px-4 py-3">
            <p className="text-xs font-medium text-text-muted">Deleted Companies</p>
          </div>
          <div className="divide-y divide-border-primary/50">
            {companies.map((company) => (
              <div key={company.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0 flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-bg-tertiary text-accent-primary">
                    <LuBuilding2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{company.name}</p>
                    <p className="mt-1 text-xs text-text-muted">
                      {company.yearCount} year{company.yearCount !== 1 ? 's' : ''}, {company.subfolderCount} subfolder{company.subfolderCount !== 1 ? 's' : ''}, {company.expenseCount} expense{company.expenseCount !== 1 ? 's' : ''}
                    </p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      Deleted {company.deletedAt ? formatDate(company.deletedAt) : '-'}
                    </p>
                  </div>
                </div>

                {confirmDeleteCompanyId === company.id ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-warning whitespace-nowrap">Cannot be undone</span>
                    <button
                      onClick={() => {
                        onPermanentDeleteCompany(company);
                        setConfirmDeleteCompanyId(null);
                      }}
                      className="rounded px-2 py-1 text-[10px] font-medium bg-error text-white transition-colors hover:bg-error/80"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCompanyId(null)}
                      className="rounded px-2 py-1 text-[10px] font-medium border border-border-primary text-text-secondary transition-colors hover:bg-bg-tertiary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRestoreCompany(company)}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-accent-primary/10 hover:text-accent-primary"
                      title="Restore company"
                    >
                      <LuUndo2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteCompanyId(company.id)}
                      className="rounded p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                      title="Delete company forever"
                    >
                      <LuTrash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border-primary">
        <table className="w-full text-xs">
          <thead className="border-b border-border-primary bg-bg-tertiary/50">
            <tr>
              <th className="pb-3 pr-4 text-left text-xs font-medium text-text-muted">
                Date
              </th>
              <th className="pb-3 pr-4 text-left text-xs font-medium text-text-muted">
                Description
              </th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-text-muted">
                Amount
              </th>
              <th className="pb-3 pr-4 text-left text-xs font-medium text-text-muted">
                Category
              </th>
              <th className="pb-3 pr-4 text-left text-xs font-medium text-text-muted">
                Deleted
              </th>
              <th className="pb-3 text-right text-xs font-medium text-text-muted">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((expense) => (
              <tr
                key={expense.id}
                className="border-b border-border-primary/50 transition-colors hover:bg-bg-tertiary/30"
              >
                <td className="py-2.5 pr-4 whitespace-nowrap text-text-secondary">
                  {formatDate(
                    expense.date instanceof Date
                      ? expense.date
                      : new Date(expense.date)
                  )}
                </td>
                <td className="py-2.5 pr-4 max-w-[200px] truncate text-text-primary">
                  {expense.description}
                </td>
                <td className="py-2.5 pr-4 text-right font-mono whitespace-nowrap text-text-primary">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="py-2.5 pr-4 text-text-secondary">
                  {getCategoryName(expense.category)}
                </td>
                <td className="py-2.5 pr-4 whitespace-nowrap text-text-muted">
                  {expense.deletedAt
                    ? formatDate(
                        expense.deletedAt instanceof Date
                          ? expense.deletedAt
                          : new Date(expense.deletedAt)
                      )
                    : '-'}
                </td>
                <td className="py-2.5 text-right">
                  {confirmDeleteId === expense.id ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[10px] text-warning whitespace-nowrap">
                        Cannot be undone
                      </span>
                      <button
                        onClick={() => {
                          onPermanentDelete(expense);
                          setConfirmDeleteId(null);
                        }}
                        className="rounded px-2 py-1 text-[10px] font-medium bg-error text-white transition-colors hover:bg-error/80"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded px-2 py-1 text-[10px] font-medium border border-border-primary text-text-secondary transition-colors hover:bg-bg-tertiary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onRestore(expense)}
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-accent-primary/10 hover:text-accent-primary"
                        title="Restore expense"
                      >
                        <LuUndo2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(expense.id)}
                        className="rounded p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                        title="Delete forever"
                      >
                        <LuTrash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
