'use client';

import { useState } from 'react';
import { LuTrash2, LuUndo2 } from 'react-icons/lu';
import { getCategoryName } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface TrashBinProps {
  items: CategorizedExpense[];
  onRestore: (expense: CategorizedExpense) => void;
  onPermanentDelete: (expense: CategorizedExpense) => void;
  onEmptyTrash: () => void;
}

export default function TrashBin({
  items,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}: TrashBinProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
          {items.length} deleted expense{items.length !== 1 ? 's' : ''}
        </p>

        {confirmEmptyTrash ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-warning">
              Delete all {items.length} items permanently?
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
