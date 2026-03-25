'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getUserFolders } from '@/lib/database';
import type { MonthNode } from '@/types';
import { LuCalendar } from 'react-icons/lu';
import { SkeletonCard } from '@/components/Skeleton';

export default function YearPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const year = params.year as string;

  const [months, setMonths] = useState<MonthNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadData() {
      try {
        const folders = await getUserFolders(user!.id);
        const yearFolder = folders.find((f) => f.year === year);
        if (yearFolder) {
          setMonths(yearFolder.months);
        }
      } catch (err) {
        console.error('Failed to load year data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, year]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 h-8 w-20 animate-pulse rounded-lg bg-bg-tertiary" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-2xl font-bold text-text-primary">{year}</h1>

      {months.length === 0 ? (
        <p className="text-sm text-text-muted">
          No months found for this year. Try adding the year from the sidebar.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {months.map((month) => (
            <button
              key={month.month}
              onClick={() => router.push(`/dashboard/${year}/${month.month}`)}
              className="group flex flex-col items-start rounded-xl border border-border-primary bg-bg-secondary p-4 text-left transition-colors hover:border-accent-primary/50 hover:bg-bg-tertiary"
            >
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-bg-tertiary group-hover:bg-bg-secondary">
                <LuCalendar className="h-4 w-4 text-accent-primary" />
              </div>
              <span className="text-sm font-semibold text-text-primary">
                {month.name}
              </span>
              <div className="mt-1 flex items-center gap-2">
                {month.expenseCount === 0 ? (
                  <span className="text-xs text-text-muted italic">
                    No expenses
                  </span>
                ) : (
                  <>
                    <span className="text-xs text-text-muted">
                      {month.expenseCount} expense{month.expenseCount !== 1 ? 's' : ''}
                    </span>
                    {month.total > 0 && (
                      <span className="text-xs font-medium text-accent-primary">
                        ${month.total.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
