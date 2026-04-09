'use client';

import { useState, useMemo } from 'react';
import { LuArrowUpDown, LuTrash2, LuFilter, LuFile, LuImagePlus } from 'react-icons/lu';
import { getAllCategories, getCategoryName } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/expense-processor';
import ReceiptGallery from './ReceiptGallery';
import type { CategorizedExpense, Receipt } from '@/types';

interface ExpenseTableProps {
  expenses: CategorizedExpense[];
  receiptsByExpenseId?: Record<string, Receipt[]>;
  userId?: string;
  onCategoryChange: (_id: string, _category: string) => void;
  onDelete: (_id: string) => void;
  onReceiptsUpdated?: (_expenseId: string, _receipts: Receipt[]) => void;
}

type SortField = 'date' | 'description' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const allCategories = getAllCategories();

export default function ExpenseTable({
  expenses,
  receiptsByExpenseId = {},
  userId = '',
  onCategoryChange,
  onDelete,
  onReceiptsUpdated,
}: ExpenseTableProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);

  // Unique source files for filter dropdown
  const sourceFiles = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.filename))).sort();
  }, [expenses]);

  // Unique categories present in current data
  const presentCategories = useMemo(() => {
    return Array.from(new Set(expenses.map(e => e.category))).sort();
  }, [expenses]);

  // Filter and sort
  const filteredAndSorted = useMemo(() => {
    let result = [...expenses];

    // Apply filters
    if (filterCategory) {
      result = result.filter(e => e.category === filterCategory);
    }
    if (filterSource) {
      result = result.filter(e => e.filename === filterSource);
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'description':
          cmp = a.description.localeCompare(b.description);
          break;
        case 'amount':
          cmp = a.amount - b.amount;
          break;
        case 'category':
          cmp = getCategoryName(a.category).localeCompare(getCategoryName(b.category));
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [expenses, filterCategory, filterSource, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="cursor-pointer select-none pb-3 pr-4 text-left text-xs font-medium text-text-muted transition-colors hover:text-text-secondary"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <LuArrowUpDown className={`h-3 w-3 ${sortField === field ? 'text-accent-primary' : ''}`} />
      </div>
    </th>
  );

  if (expenses.length === 0) {
    return null;
  }

  return (
    <div>
      {/* Filter row */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <LuFilter className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
        >
          <option value="">All Categories</option>
          {presentCategories.map(catId => (
            <option key={catId} value={catId}>
              {getCategoryName(catId)}
            </option>
          ))}
        </select>

        <select
          value={filterSource}
          onChange={e => setFilterSource(e.target.value)}
          className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
        >
          <option value="">All Sources</option>
          {sourceFiles.map(f => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        {(filterCategory || filterSource) && (
          <button
            onClick={() => { setFilterCategory(''); setFilterSource(''); }}
            className="text-xs text-accent-primary hover:text-accent-dark transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table with horizontal scroll wrapper */}
      <div className="overflow-x-auto rounded-lg border border-border-primary">
        <table className="w-full text-xs">
          <thead className="border-b border-border-primary bg-bg-tertiary/50">
            <tr>
              <SortHeader field="date" label="Date" />
              <SortHeader field="description" label="Description" />
              <SortHeader field="amount" label="Amount" />
              <SortHeader field="category" label="IRS Category" />
              <th className="pb-3 pr-4 text-center text-xs font-medium text-text-muted">Receipts</th>
              <th className="pb-3 pr-4 text-right text-xs font-medium text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.map(expense => (
              <tr
                key={expense.id}
                className="border-b border-border-primary/50 transition-colors hover:bg-bg-tertiary/30"
              >
                <td className="py-2.5 pr-4 text-text-secondary whitespace-nowrap">
                  {formatDate(expense.date instanceof Date ? expense.date : new Date(expense.date))}
                </td>
                <td className="py-2.5 pr-4 text-text-primary max-w-[250px] truncate">
                  {expense.description}
                </td>
                <td className="py-2.5 pr-4 text-right text-text-primary font-mono whitespace-nowrap">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="py-2.5 pr-4">
                  <select
                    value={expense.category}
                    onChange={e => onCategoryChange(expense.id, e.target.value)}
                    className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                  >
                    {allCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2.5 pr-4 text-center">
                  {receiptsByExpenseId[expense.id]?.length ? (
                    <button
                      onClick={() => setSelectedExpenseId(expense.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-accent-primary/10 px-2.5 py-1 text-xs font-medium text-accent-primary transition-colors hover:bg-accent-primary/20"
                    >
                      <LuFile className="h-3 w-3" />
                      {receiptsByExpenseId[expense.id].length}
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedExpenseId(expense.id)}
                      className="inline-flex items-center justify-center rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-accent-primary"
                      title="Upload receipt"
                    >
                      <LuImagePlus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => onDelete(expense.id)}
                    className="rounded p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                    title="Delete expense"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Row count */}
      <div className="mt-3 text-xs text-text-muted">
        Showing {filteredAndSorted.length} of {expenses.length} expenses
      </div>

      {/* Receipt Gallery Modal */}
      {selectedExpenseId && (
        <ReceiptGallery
          receipts={receiptsByExpenseId[selectedExpenseId] ?? []}
          expenseId={selectedExpenseId}
          userId={userId}
          onReceiptDeleted={(receiptId) => {
            onReceiptsUpdated?.(
              selectedExpenseId,
              (receiptsByExpenseId[selectedExpenseId] ?? []).filter(r => r.id !== receiptId)
            );
          }}
          onReceiptsUploaded={(newReceipts) => {
            onReceiptsUpdated?.(
              selectedExpenseId,
              [...(receiptsByExpenseId[selectedExpenseId] ?? []), ...newReceipts]
            );
          }}
          onClose={() => setSelectedExpenseId(null)}
        />
      )}
    </div>
  );
}
