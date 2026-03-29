'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { getUserFolders, createYearFolders, softDeleteYear, softDeleteMonth } from '@/lib/database';
import type { FolderNode } from '@/types';
import {
  LuFolder,
  LuFolderOpen,
  LuCalendar,
  LuChevronRight,
  LuChevronDown,
  LuPlus,
  LuCheck,
  LuX,
  LuTrash2,
} from 'react-icons/lu';
import { SkeletonFolderTree } from './Skeleton';

type DeleteTarget =
  | { type: 'year'; year: string }
  | { type: 'month'; year: string; month: string };

interface FolderTreeProps {
  collapsed?: boolean;
}

export default function FolderTree({ collapsed = false }: FolderTreeProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showAddYear, setShowAddYear] = useState(false);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [addingYear, setAddingYear] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserFolders(user.id);
      setFolders(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  // Auto-expand the year from the current pathname
  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 2) {
      setExpandedYears((prev) => {
        const next = new Set(prev);
        next.add(segments[1]);
        return next;
      });
    }
  }, [pathname]);

  const toggleYear = (year: string) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

  const handleAddYear = async () => {
    if (!user || !newYear.trim()) return;
    setAddingYear(true);
    try {
      await createYearFolders(user.id, newYear.trim());
      await fetchFolders();
      setExpandedYears((prev) => {
        const next = new Set(prev);
        next.add(newYear.trim());
        return next;
      });
      setShowAddYear(false);
      setNewYear(String(new Date().getFullYear()));
    } catch (err) {
      console.error('Failed to create year folders:', err);
    } finally {
      setAddingYear(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'year') {
        await softDeleteYear(user.id, deleteTarget.year);
        // Navigate away if currently viewing this year
        if (pathname.startsWith(`/dashboard/${deleteTarget.year}`)) {
          router.push('/dashboard');
        }
      } else {
        await softDeleteMonth(user.id, deleteTarget.year, deleteTarget.month);
        // Navigate away if currently viewing this month
        if (pathname === `/dashboard/${deleteTarget.year}/${deleteTarget.month}`) {
          router.push('/dashboard');
        }
      }
      await fetchFolders();
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete:', err);
    } finally {
      setDeleting(false);
    }
  };

  const isActiveMonth = (year: string, month: string) => {
    return pathname === `/dashboard/${year}/${month}`;
  };

  if (loading) {
    return <SkeletonFolderTree />;
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Add Year Button / Input */}
      {!collapsed && (
        <div className="mb-2">
          {showAddYear ? (
            <div className="flex items-center gap-1 px-2">
              <input
                type="text"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                placeholder="Year"
                maxLength={4}
                className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddYear();
                  if (e.key === 'Escape') setShowAddYear(false);
                }}
                autoFocus
                disabled={addingYear}
              />
              <button
                onClick={handleAddYear}
                disabled={addingYear}
                className="rounded p-1 text-success transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                title="Confirm"
              >
                <LuCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowAddYear(false)}
                className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                title="Cancel"
              >
                <LuX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddYear(true)}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
            >
              <LuPlus className="h-3.5 w-3.5" />
              Add Year
            </button>
          )}
        </div>
      )}

      {/* Collapsed: just show add button as icon */}
      {collapsed && (
        <button
          onClick={() => setShowAddYear(true)}
          className="mx-auto mb-2 flex items-center justify-center rounded-md p-2 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
          title="Add Year"
        >
          <LuPlus className="h-4 w-4" />
        </button>
      )}

      {/* Folder Tree */}
      {folders.length === 0 && !collapsed && (
        <p className="px-2 py-4 text-center text-xs text-text-muted">
          No folders yet. Add a year to get started.
        </p>
      )}

      {folders.map((folder) => {
        const isExpanded = expandedYears.has(folder.year);
        const isPendingYearDelete =
          deleteTarget?.type === 'year' && deleteTarget.year === folder.year;

        return (
          <div key={folder.year}>
            {/* Year Node */}
            {isPendingYearDelete && !collapsed ? (
              <div className="flex items-center gap-1 rounded-md border border-error/30 bg-error/5 px-2 py-1.5 text-xs">
                <span className="flex-1 truncate text-error">Delete {folder.year}?</span>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-error bg-error/20 hover:bg-error/30 disabled:opacity-50 transition-colors"
                >
                  {deleting ? '...' : 'Yes'}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted hover:bg-bg-tertiary transition-colors"
                >
                  No
                </button>
              </div>
            ) : (
              <div className="group flex items-center">
                <button
                  onClick={() => toggleYear(folder.year)}
                  className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                  title={collapsed ? folder.year : undefined}
                >
                  {collapsed ? (
                    <>
                      {isExpanded ? (
                        <LuFolderOpen className="mx-auto h-4 w-4 text-accent-primary" />
                      ) : (
                        <LuFolder className="mx-auto h-4 w-4" />
                      )}
                    </>
                  ) : (
                    <>
                      {isExpanded ? (
                        <LuChevronDown className="h-3.5 w-3.5 text-text-muted" />
                      ) : (
                        <LuChevronRight className="h-3.5 w-3.5 text-text-muted" />
                      )}
                      {isExpanded ? (
                        <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                      ) : (
                        <LuFolder className="h-4 w-4" />
                      )}
                      <span>{folder.year}</span>
                    </>
                  )}
                </button>
                {!collapsed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget({ type: 'year', year: folder.year });
                    }}
                    className="mr-1 rounded p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-error/10 hover:text-error"
                    title={`Delete ${folder.year}`}
                  >
                    <LuTrash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}

            {/* Month Nodes */}
            {isExpanded && !collapsed && (
              <div className="ml-2">
                {folder.months.map((month) => {
                  const active = isActiveMonth(folder.year, month.month);
                  const isPendingMonthDelete =
                    deleteTarget?.type === 'month' &&
                    deleteTarget.year === folder.year &&
                    deleteTarget.month === month.month;

                  if (isPendingMonthDelete) {
                    return (
                      <div
                        key={month.month}
                        className="flex items-center gap-1 rounded-md border border-error/30 bg-error/5 py-1.5 pl-6 pr-2 text-xs"
                      >
                        <span className="flex-1 truncate text-error">Delete {month.name}?</span>
                        <button
                          onClick={handleConfirmDelete}
                          disabled={deleting}
                          className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-error bg-error/20 hover:bg-error/30 disabled:opacity-50 transition-colors"
                        >
                          {deleting ? '...' : 'Yes'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(null)}
                          disabled={deleting}
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted hover:bg-bg-tertiary transition-colors"
                        >
                          No
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div key={month.month} className="group flex items-center">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/${folder.year}/${month.month}`)
                        }
                        className={`flex flex-1 items-center gap-2 rounded-md py-1.5 pl-6 pr-2 text-xs transition-colors ${
                          active
                            ? 'border-l-2 border-accent-primary text-accent-primary bg-bg-tertiary/50'
                            : 'text-text-muted hover:bg-bg-tertiary hover:text-text-secondary'
                        }`}
                      >
                        <LuCalendar className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="flex-1 text-left">{month.name}</span>
                        {month.expenseCount > 0 && (
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              active
                                ? 'bg-accent-primary/20 text-accent-primary'
                                : 'bg-bg-tertiary text-text-muted'
                            }`}
                          >
                            {month.expenseCount}
                          </span>
                        )}
                      </button>
                      {month.expenseCount > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget({
                              type: 'month',
                              year: folder.year,
                              month: month.month,
                            });
                          }}
                          className="mr-1 rounded p-1 text-text-muted opacity-0 transition-all group-hover:opacity-100 hover:bg-error/10 hover:text-error"
                          title={`Delete ${month.name}`}
                        >
                          <LuTrash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
