'use client';

import { useState, useMemo, useCallback } from 'react';
import { LuChevronDown, LuChevronRight } from 'react-icons/lu';
import { getAllCategories, getCategoryName } from '@/lib/categories';
import { formatCurrency, formatDate } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface StepCategorizeProps {
  expenses: CategorizedExpense[];
  onComplete: (expenses: CategorizedExpense[]) => void;
}

const allCategories = getAllCategories();

export default function StepCategorize({ expenses, onComplete }: StepCategorizeProps) {
  const [localExpenses, setLocalExpenses] = useState<CategorizedExpense[]>(expenses);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, CategorizedExpense[]>();
    localExpenses.forEach((e) => {
      const existing = map.get(e.category) || [];
      existing.push(e);
      map.set(e.category, existing);
    });
    return map;
  }, [localExpenses]);

  // Sort categories: suspected_personal first, then by count descending
  const sortedCategories = useMemo(() => {
    const entries = Array.from(grouped.entries());
    return entries.sort((a, b) => {
      if (a[0] === 'suspected_personal') return -1;
      if (b[0] === 'suspected_personal') return 1;
      return b[1].length - a[1].length;
    });
  }, [grouped]);

  const personalCount = grouped.get('suspected_personal')?.length ?? 0;

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback(
    (expenseId: string, newCategory: string) => {
      setLocalExpenses((prev) =>
        prev.map((e) =>
          e.id === expenseId ? { ...e, category: newCategory } : e
        )
      );
    },
    []
  );

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-text-primary">
        Review Categories
      </h2>

      {/* Summary stats */}
      <div className="mb-5 flex flex-wrap items-center gap-4 text-xs text-text-muted">
        <span>{localExpenses.length} total expenses</span>
        <span className="text-text-muted">|</span>
        <span>{grouped.size} categories</span>
        {personalCount > 0 && (
          <>
            <span className="text-text-muted">|</span>
            <span className="text-warning">
              {personalCount} suspected personal
            </span>
          </>
        )}
      </div>

      {/* Category sections */}
      <div className="mb-5 space-y-2">
        {sortedCategories.map(([categoryId, catExpenses]) => {
          const isExpanded = expandedCategories.has(categoryId);
          const isSuspectedPersonal = categoryId === 'suspected_personal';
          const total = catExpenses.reduce((s, e) => s + e.amount, 0);

          return (
            <div
              key={categoryId}
              className={`rounded-lg border ${
                isSuspectedPersonal
                  ? 'border-warning/30 bg-warning/5'
                  : 'border-border-primary bg-bg-tertiary/30'
              }`}
            >
              {/* Category header */}
              <button
                onClick={() => toggleCategory(categoryId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <LuChevronDown className="h-3.5 w-3.5 text-text-muted" />
                  ) : (
                    <LuChevronRight className="h-3.5 w-3.5 text-text-muted" />
                  )}
                  <span
                    className={`text-xs font-medium ${
                      isSuspectedPersonal
                        ? 'text-warning'
                        : 'text-text-primary'
                    }`}
                  >
                    {getCategoryName(categoryId)}
                  </span>
                  <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] text-text-muted">
                    {catExpenses.length}
                  </span>
                </div>
                <span className="text-xs font-mono text-text-secondary">
                  {formatCurrency(total)}
                </span>
              </button>

              {/* Expanded expense list */}
              {isExpanded && (
                <div className="border-t border-border-primary/50 px-4 py-2">
                  <table className="w-full text-xs">
                    <tbody>
                      {catExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-border-primary/30 last:border-b-0"
                        >
                          <td className="py-1.5 pr-3 whitespace-nowrap text-text-muted">
                            {formatDate(
                              expense.date instanceof Date
                                ? expense.date
                                : new Date(expense.date)
                            )}
                          </td>
                          <td className="py-1.5 pr-3 max-w-[180px] truncate text-text-primary">
                            {expense.description}
                          </td>
                          <td className="py-1.5 pr-3 text-right font-mono whitespace-nowrap text-text-secondary">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-1.5">
                            <select
                              value={expense.category}
                              onChange={(e) =>
                                handleCategoryChange(
                                  expense.id,
                                  e.target.value
                                )
                              }
                              className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-[11px] text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                            >
                              {allCategories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => onComplete(localExpenses)}
        className="rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
      >
        Continue to Export
      </button>
    </div>
  );
}
