'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuArrowRight, LuChefHat, LuChevronDown, LuChevronRight, LuSparkles } from 'react-icons/lu';
import { getAllCategories, getCategoryName } from '@/lib/categories';
import { buildCategoryMappingLookup, getCategoryMappings } from '@/lib/category-mappings';
import { categorizeAll, formatCurrency, formatDate } from '@/lib/expense-processor';
import { useAuth } from '@/lib/auth';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { CategorizedExpense } from '@/types';

interface StepCategorizeProps {
  expenses: CategorizedExpense[];
  onComplete: (_expenses: CategorizedExpense[]) => void;
}

const allCategories = getAllCategories();
const COOKIE_MESSAGES = [
  'Baking cookies for merchant matching...',
  'Reading labels and retailer hints...',
  'Dusting the ledger with AI category sugar...',
  'Plating the final category tray...',
];

export default function StepCategorize({ expenses, onComplete }: StepCategorizeProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [localExpenses, setLocalExpenses] = useState<CategorizedExpense[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [mappingError, setMappingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runCategorization() {
      setLoadingCategories(true);
      setMappingError(null);

      const delayMs = 2000 + Math.floor(Math.random() * 3000);
      const messageTimer = window.setInterval(() => {
        setLoadingMessageIndex((current) => (current + 1) % COOKIE_MESSAGES.length);
      }, 900);

      try {
        const [mappings] = await Promise.all([
          effectiveUserId ? getCategoryMappings(effectiveUserId) : Promise.resolve([]),
          new Promise((resolve) => window.setTimeout(resolve, delayMs)),
        ]);

        if (cancelled) return;

        const lookup = buildCategoryMappingLookup(mappings);
        const categorized = categorizeAll(expenses, lookup);
        setLocalExpenses(categorized);
      } catch (err) {
        if (!cancelled) {
          setLocalExpenses(expenses);
          setMappingError(err instanceof Error ? err.message : 'Failed to map categories automatically.');
        }
      } finally {
        window.clearInterval(messageTimer);
        if (!cancelled) {
          setLoadingCategories(false);
        }
      }
    }

    void runCategorization();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId, expenses]);

  const grouped = useMemo(() => {
    const map = new Map<string, CategorizedExpense[]>();
    localExpenses.forEach((expense) => {
      const existing = map.get(expense.category) || [];
      existing.push(expense);
      map.set(expense.category, existing);
    });
    return map;
  }, [localExpenses]);

  const sortedCategories = useMemo(() => {
    const entries = Array.from(grouped.entries());
    return entries.sort((left, right) => {
      if (left[0] === 'suspected_personal') return -1;
      if (right[0] === 'suspected_personal') return 1;
      return right[1].length - left[1].length;
    });
  }, [grouped]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  const handleCategoryChange = useCallback((expenseId: string, category: string) => {
    setLocalExpenses((current) =>
      current.map((expense) => (expense.id === expenseId ? { ...expense, category } : expense))
    );
  }, []);

  if (loadingCategories) {
    return (
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
            Step 3
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">
            Alladin AI is mapping your categories
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            Give us just a few seconds while we line up category suggestions from your rules and merchant patterns.
          </p>
        </div>

        <div className="rounded-2xl border border-border-primary bg-bg-secondary px-6 py-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
            <div className="relative">
              <LuChefHat className="h-8 w-8 animate-pulse" />
              <LuSparkles className="absolute -right-4 -top-2 h-4 w-4 animate-bounce" />
            </div>
          </div>
          <h3 className="mt-5 text-base font-semibold text-text-primary">Baking category cookies</h3>
          <p className="mt-2 text-sm text-text-muted">{COOKIE_MESSAGES[loadingMessageIndex]}</p>
          <div className="mx-auto mt-5 flex max-w-xs items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-primary [animation-delay:-0.3s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-primary/80 [animation-delay:-0.15s]" />
            <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-accent-primary/60" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
          Step 3
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          Review the AI category pass
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Alladin AI has proposed categories. Make any changes you want before the final commit step.
        </p>
      </div>

      {mappingError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-xs text-warning">
          {mappingError}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border-primary bg-bg-tertiary/30 px-4 py-3 text-xs text-text-secondary">
        <span>{localExpenses.length} entries categorized</span>
        <span className="text-text-muted">|</span>
        <span>{grouped.size} category groups</span>
      </div>

      <div className="space-y-2">
        {sortedCategories.map(([categoryId, categoryExpenses]) => {
          const total = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
          const isExpanded = expandedCategories.has(categoryId);

          return (
            <div key={categoryId} className="overflow-hidden rounded-xl border border-border-primary bg-bg-secondary">
              <button
                onClick={() => toggleCategory(categoryId)}
                className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-bg-tertiary/40"
              >
                <div className="flex items-center gap-2.5">
                  {isExpanded ? (
                    <LuChevronDown className="h-4 w-4 text-text-muted" />
                  ) : (
                    <LuChevronRight className="h-4 w-4 text-text-muted" />
                  )}
                  <span className="text-sm font-medium text-text-primary">{getCategoryName(categoryId)}</span>
                  <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-[10px] text-text-muted">
                    {categoryExpenses.length}
                  </span>
                </div>
                <span className="text-xs font-mono text-text-secondary">{formatCurrency(total)}</span>
              </button>

              {isExpanded ? (
                <div className="border-t border-border-primary/50 px-4 py-3">
                  <table className="w-full text-xs">
                    <tbody>
                      {categoryExpenses.map((expense) => (
                        <tr key={expense.id} className="border-b border-border-primary/30 last:border-b-0">
                          <td className="py-2 pr-3 whitespace-nowrap text-text-muted">{formatDate(expense.date)}</td>
                          <td className="py-2 pr-3 text-text-primary">{expense.description}</td>
                          <td className="py-2 pr-3 whitespace-nowrap text-right font-mono text-text-secondary">
                            {formatCurrency(expense.amount)}
                          </td>
                          <td className="py-2">
                            <select
                              value={expense.category}
                              onChange={(event) => handleCategoryChange(expense.id, event.target.value)}
                              className="w-full rounded-md border border-border-primary bg-bg-tertiary px-2 py-1.5 text-[11px] text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/30"
                            >
                              {allCategories.map((category) => (
                                <option key={category.id} value={category.id}>
                                  {category.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onComplete(localExpenses)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
        >
          Continue to commit
          <LuArrowRight className="h-3.5 w-3.5" />
        </button>
        <p className="text-xs text-text-muted">Next we will confirm the company and save the entries.</p>
      </div>
    </div>
  );
}
