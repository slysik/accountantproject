'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { createCompany, createCustomerSubfolder, createYearFolders, getUserFolders, renameCompany, softDeleteMonth, softDeleteYear } from '@/lib/database';
import { decodeCompanySlug, encodeCompanySlug, encodeFolderSlug } from '@/lib/company';
import type { CompanyNode } from '@/types';
import {
  LuBuilding2,
  LuCalendar,
  LuCheck,
  LuChevronDown,
  LuChevronRight,
  LuPencil,
  LuFolder,
  LuFolderOpen,
  LuFolders,
  LuPlus,
  LuTrash2,
  LuX,
} from 'react-icons/lu';
import { SkeletonFolderTree } from './Skeleton';

type DeleteTarget =
  | { type: 'year'; companyName: string; year: string }
  | { type: 'month'; companyName: string; year: string; month: string };

interface FolderTreeProps {
  collapsed?: boolean;
}

export default function FolderTree({ collapsed = false }: FolderTreeProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [companies, setCompanies] = useState<CompanyNode[]>([]);
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const [showAddCompany, setShowAddCompany] = useState(false);
  const [newCompany, setNewCompany] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [editedCompanyName, setEditedCompanyName] = useState('');
  const [renamingCompany, setRenamingCompany] = useState(false);

  const [addingYearCompany, setAddingYearCompany] = useState<string | null>(null);
  const [newYear, setNewYear] = useState(String(new Date().getFullYear()));
  const [addingYear, setAddingYear] = useState(false);
  const [addingSubfolderKey, setAddingSubfolderKey] = useState<string | null>(null);
  const [newSubfolder, setNewSubfolder] = useState('');
  const [addingSubfolder, setAddingSubfolder] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFolders = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getUserFolders(user.id);
      setCompanies(data);
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean);
    if (segments[0] !== 'dashboard') return;
    if (segments[1] && segments[1] !== 'trash' && segments[1] !== 'wizard') {
      const companyName = decodeCompanySlug(segments[1]);
      setExpandedCompanies((prev) => new Set(prev).add(companyName));
      if (segments[2]) {
        const yearKey = `${companyName}::${segments[2]}`;
        setExpandedYears((prev) => new Set(prev).add(yearKey));
      }
    }
  }, [pathname]);

  const toggleCompany = (companyName: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev);
      if (next.has(companyName)) next.delete(companyName);
      else next.add(companyName);
      return next;
    });
  };

  const toggleYear = (companyName: string, year: string) => {
    const key = `${companyName}::${year}`;
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleAddCompany = async () => {
    if (!user || !newCompany.trim()) return;
    setAddingCompany(true);
    try {
      const companyName = newCompany.trim();
      await createCompany(user.id, companyName);
      await fetchFolders();
      setExpandedCompanies((prev) => new Set(prev).add(companyName));
      setShowAddCompany(false);
      setNewCompany('');
    } catch (err) {
      console.error('Failed to create company:', err);
    } finally {
      setAddingCompany(false);
    }
  };

  const handleAddYear = async (companyName: string) => {
    if (!user || !newYear.trim()) return;
    setAddingYear(true);
    try {
      await createYearFolders(user.id, companyName, newYear.trim());
      await fetchFolders();
      setExpandedCompanies((prev) => new Set(prev).add(companyName));
      setExpandedYears((prev) => new Set(prev).add(`${companyName}::${newYear.trim()}`));
      setAddingYearCompany(null);
      setNewYear(String(new Date().getFullYear()));
    } catch (err) {
      console.error('Failed to create year folders:', err);
    } finally {
      setAddingYear(false);
    }
  };

  const handleStartRenameCompany = (companyName: string) => {
    setEditingCompany(companyName);
    setEditedCompanyName(companyName);
    setShowAddCompany(false);
  };

  const handleAddSubfolder = async (companyName: string, year: string) => {
    if (!user || !newSubfolder.trim()) return;
    setAddingSubfolder(true);
    try {
      await createCustomerSubfolder(user.id, companyName, year, newSubfolder.trim());
      await fetchFolders();
      setExpandedCompanies((prev) => new Set(prev).add(companyName));
      setExpandedYears((prev) => new Set(prev).add(`${companyName}::${year}`));
      setAddingSubfolderKey(null);
      setNewSubfolder('');
    } catch (err) {
      console.error('Failed to create subfolder:', err);
    } finally {
      setAddingSubfolder(false);
    }
  };

  const handleRenameCompany = async (currentName: string) => {
    if (!user || !editedCompanyName.trim()) return;
    setRenamingCompany(true);
    try {
      const nextName = editedCompanyName.trim();
      await renameCompany(user.id, currentName, nextName);
      await fetchFolders();
      setExpandedCompanies((prev) => {
        const next = new Set(prev);
        if (next.has(currentName)) {
          next.delete(currentName);
          next.add(nextName);
        }
        return next;
      });
      setExpandedYears((prev) => {
        const next = new Set<string>();
        prev.forEach((key) => {
          if (key.startsWith(`${currentName}::`)) {
            next.add(key.replace(`${currentName}::`, `${nextName}::`));
          } else {
            next.add(key);
          }
        });
        return next;
      });
      if (pathname.startsWith(`/dashboard/${encodeCompanySlug(currentName)}`)) {
        router.push(pathname.replace(`/dashboard/${encodeCompanySlug(currentName)}`, `/dashboard/${encodeCompanySlug(nextName)}`));
      }
      setEditingCompany(null);
      setEditedCompanyName('');
    } catch (err) {
      console.error('Failed to rename company:', err);
    } finally {
      setRenamingCompany(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === 'year') {
        await softDeleteYear(user.id, deleteTarget.companyName, deleteTarget.year);
        if (pathname.startsWith(`/dashboard/${encodeCompanySlug(deleteTarget.companyName)}/${deleteTarget.year}`)) {
          router.push(`/dashboard/${encodeCompanySlug(deleteTarget.companyName)}`);
        }
      } else {
        await softDeleteMonth(user.id, deleteTarget.companyName, deleteTarget.year, deleteTarget.month);
        if (pathname === `/dashboard/${encodeCompanySlug(deleteTarget.companyName)}/${deleteTarget.year}/${deleteTarget.month}`) {
          router.push(`/dashboard/${encodeCompanySlug(deleteTarget.companyName)}/${deleteTarget.year}`);
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

  const isActiveMonth = (companyName: string, year: string, month: string) =>
    pathname === `/dashboard/${encodeCompanySlug(companyName)}/${year}/${month}`;
  const isActiveSubfolder = (companyName: string, year: string, subfolderName: string) =>
    pathname === `/dashboard/${encodeCompanySlug(companyName)}/${year}/subfolder/${encodeFolderSlug(subfolderName)}`;

  if (loading) return <SkeletonFolderTree />;

  return (
    <div className="flex flex-col gap-1.5">
      {!collapsed && (
        <div className="mb-3">
          {showAddCompany ? (
            <div className="flex items-center gap-1 px-2">
              <input
                type="text"
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Company name"
                className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCompany();
                  if (e.key === 'Escape') setShowAddCompany(false);
                }}
                autoFocus
                disabled={addingCompany}
              />
              <button
                onClick={handleAddCompany}
                disabled={addingCompany}
                className="rounded p-1 text-success transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                title="Confirm"
              >
                <LuCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowAddCompany(false)}
                className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                title="Cancel"
              >
                <LuX className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCompany(true)}
              className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border-primary/80 bg-bg-primary/35 px-3 py-2 text-xs font-semibold text-text-muted transition-all hover:border-accent-primary/40 hover:bg-bg-tertiary/70 hover:text-text-secondary"
            >
              <LuPlus className="h-3.5 w-3.5" />
              Add Company
            </button>
          )}
        </div>
      )}

      {companies.length === 0 && !collapsed && (
        <p className="px-2 py-4 text-center text-xs text-text-muted">
          No companies yet. Add one to get started.
        </p>
      )}

      {companies.map((company) => {
        const companyExpanded = expandedCompanies.has(company.companyName);
        const companySlug = encodeCompanySlug(company.companyName);

        return (
          <div key={company.companyName}>
            <div className="group flex items-center gap-1">
              {editingCompany === company.companyName && !collapsed ? (
                <div className="flex flex-1 items-center gap-1 px-2 py-1">
                  <input
                    type="text"
                    value={editedCompanyName}
                    onChange={(e) => setEditedCompanyName(e.target.value)}
                    className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCompany(company.companyName);
                      if (e.key === 'Escape') {
                        setEditingCompany(null);
                        setEditedCompanyName('');
                      }
                    }}
                    autoFocus
                    disabled={renamingCompany}
                  />
                  <button
                    onClick={() => handleRenameCompany(company.companyName)}
                    disabled={renamingCompany}
                    className="rounded p-1 text-success transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                    title="Save"
                  >
                    <LuCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCompany(null);
                      setEditedCompanyName('');
                    }}
                    disabled={renamingCompany}
                    className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                    title="Cancel"
                  >
                    <LuX className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => toggleCompany(company.companyName)}
                  className="flex flex-1 items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:border-border-primary/70 hover:bg-bg-tertiary/70 hover:text-text-primary"
                  title={collapsed ? company.companyName : undefined}
                >
                  {collapsed ? (
                    <LuBuilding2 className="mx-auto h-4 w-4 text-accent-primary" />
                  ) : (
                    <>
                      {companyExpanded ? (
                        <LuChevronDown className="h-3.5 w-3.5 text-text-muted" />
                      ) : (
                        <LuChevronRight className="h-3.5 w-3.5 text-text-muted" />
                      )}
                      <LuBuilding2 className="h-4 w-4 text-accent-primary" />
                      <span className="truncate">{company.companyName}</span>
                    </>
                  )}
                </button>
              )}
              {!collapsed && editingCompany !== company.companyName && (
                <button
                  onClick={() => handleStartRenameCompany(company.companyName)}
                  className="opacity-0 rounded-xl p-2 text-text-muted transition-all hover:bg-bg-tertiary hover:text-text-primary group-hover:opacity-100"
                  title={`Rename ${company.companyName}`}
                >
                  <LuPencil className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {!collapsed && companyExpanded && (
              <div className="ml-4 mt-1 flex flex-col gap-1.5 border-l border-border-primary/50 pl-3">
                {addingYearCompany === company.companyName ? (
                  <div className="flex items-center gap-1 px-2">
                    <input
                      type="text"
                      value={newYear}
                      onChange={(e) => setNewYear(e.target.value)}
                      placeholder="Year"
                      maxLength={4}
                      className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddYear(company.companyName);
                        if (e.key === 'Escape') setAddingYearCompany(null);
                      }}
                      autoFocus
                      disabled={addingYear}
                    />
                    <button
                      onClick={() => handleAddYear(company.companyName)}
                      disabled={addingYear}
                      className="rounded p-1 text-success transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                    >
                      <LuCheck className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setAddingYearCompany(null)}
                      className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                    >
                      <LuX className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingYearCompany(company.companyName)}
                    className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                  >
                    <LuPlus className="h-3 w-3" />
                    Add Year
                  </button>
                )}

                {company.years.length === 0 && (
                  <button
                    onClick={() => router.push(`/dashboard/${companySlug}`)}
                    className="rounded-md px-2 py-1 text-left text-xs text-text-muted transition-colors hover:bg-bg-tertiary"
                  >
                    No years yet
                  </button>
                )}

                {company.years.map((folder) => {
                  const yearKey = `${company.companyName}::${folder.year}`;
                  const yearExpanded = expandedYears.has(yearKey);
                  const isPendingYearDelete =
                    deleteTarget?.type === 'year' &&
                    deleteTarget.companyName === company.companyName &&
                    deleteTarget.year === folder.year;

                  return (
                    <div key={yearKey}>
                      {isPendingYearDelete ? (
                        <div className="flex items-center gap-1 rounded-md border border-error/30 bg-error/5 px-2 py-1.5 text-xs">
                          <span className="flex-1 truncate text-error">Delete {folder.year}?</span>
                          <button
                            onClick={handleConfirmDelete}
                            disabled={deleting}
                            className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-semibold text-error transition-colors hover:bg-error/30 disabled:opacity-50"
                          >
                            {deleting ? '...' : 'Yes'}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(null)}
                            disabled={deleting}
                            className="rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted transition-colors hover:bg-bg-tertiary"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <div className="group flex items-center gap-1">
                          <button
                            onClick={() => {
                              toggleYear(company.companyName, folder.year);
                              router.push(`/dashboard/${companySlug}/${folder.year}`);
                            }}
                            className="flex flex-1 items-center gap-2 rounded-2xl border border-transparent px-3 py-2 text-sm font-medium text-text-secondary transition-all hover:border-border-primary/70 hover:bg-bg-tertiary/70 hover:text-text-primary"
                          >
                            {yearExpanded ? (
                              <LuChevronDown className="h-3.5 w-3.5 text-text-muted" />
                            ) : (
                              <LuChevronRight className="h-3.5 w-3.5 text-text-muted" />
                            )}
                            {yearExpanded ? (
                              <LuFolderOpen className="h-4 w-4 text-accent-primary" />
                            ) : (
                              <LuFolder className="h-4 w-4" />
                            )}
                            <span>{folder.year}</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget({ type: 'year', companyName: company.companyName, year: folder.year })}
                            className="opacity-0 rounded-xl p-2 text-text-muted transition-all hover:bg-bg-tertiary hover:text-error group-hover:opacity-100"
                            title={`Delete ${folder.year}`}
                          >
                            <LuTrash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}

                      {yearExpanded && (
                        <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-border-primary/40 pl-3">
                          {addingSubfolderKey === yearKey ? (
                            <div className="mb-1 flex items-center gap-1 px-2">
                              <input
                                type="text"
                                value={newSubfolder}
                                onChange={(e) => setNewSubfolder(e.target.value)}
                                placeholder="Customer folder name"
                                className="w-full rounded border border-border-primary bg-bg-tertiary px-2 py-1 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/40"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAddSubfolder(company.companyName, folder.year);
                                  if (e.key === 'Escape') {
                                    setAddingSubfolderKey(null);
                                    setNewSubfolder('');
                                  }
                                }}
                                autoFocus
                                disabled={addingSubfolder}
                              />
                              <button
                                onClick={() => handleAddSubfolder(company.companyName, folder.year)}
                                disabled={addingSubfolder}
                                className="rounded p-1 text-success transition-colors hover:bg-bg-tertiary disabled:opacity-50"
                                title="Save subfolder"
                              >
                                <LuCheck className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingSubfolderKey(null);
                                  setNewSubfolder('');
                                }}
                                className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                                title="Cancel"
                              >
                                <LuX className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingSubfolderKey(yearKey)}
                              className="mb-1 flex items-center gap-2 rounded-xl px-2 py-1.5 text-xs font-medium text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-secondary"
                            >
                              <LuPlus className="h-3 w-3" />
                              Add Subfolder
                            </button>
                          )}

                          <div className="mb-1 rounded-xl border border-border-primary/40 bg-bg-secondary/55 px-2 py-2">
                            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                              <LuFolders className="h-3.5 w-3.5" />
                              Subfolders
                            </div>
                            {folder.subfolders.length === 0 ? (
                              <p className="px-1 text-[11px] text-text-muted">
                                Add customer folders for this year.
                              </p>
                            ) : (
                              <div className="flex flex-col gap-1">
                                {folder.subfolders.map((subfolder) => (
                                  <button
                                    key={subfolder.id}
                                    onClick={() =>
                                      router.push(
                                        `/dashboard/${companySlug}/${folder.year}/subfolder/${encodeFolderSlug(subfolder.name)}`
                                      )
                                    }
                                    className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left text-xs transition-all ${
                                      isActiveSubfolder(company.companyName, folder.year, subfolder.name)
                                        ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary shadow-[0_10px_24px_rgba(37,99,235,0.12)]'
                                        : 'border-transparent text-text-muted hover:border-border-primary/70 hover:bg-bg-tertiary hover:text-text-secondary'
                                    }`}
                                  >
                                    <LuFolder className="h-3.5 w-3.5" />
                                    <span className="truncate">{subfolder.name}</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {folder.months.map((month) => {
                            const isPendingMonthDelete =
                              deleteTarget?.type === 'month' &&
                              deleteTarget.companyName === company.companyName &&
                              deleteTarget.year === folder.year &&
                              deleteTarget.month === month.month;

                            return (
                              <div key={`${yearKey}::${month.month}`}>
                                {isPendingMonthDelete ? (
                                  <div className="flex items-center gap-1 rounded-md border border-error/30 bg-error/5 px-2 py-1 text-xs">
                                    <span className="flex-1 truncate text-error">
                                      Delete {month.name}?
                                    </span>
                                    <button
                                      onClick={handleConfirmDelete}
                                      disabled={deleting}
                                      className="rounded bg-error/20 px-1.5 py-0.5 text-[10px] font-semibold text-error transition-colors hover:bg-error/30 disabled:opacity-50"
                                    >
                                      {deleting ? '...' : 'Yes'}
                                    </button>
                                    <button
                                      onClick={() => setDeleteTarget(null)}
                                      disabled={deleting}
                                      className="rounded px-1.5 py-0.5 text-[10px] font-medium text-text-muted transition-colors hover:bg-bg-tertiary"
                                    >
                                      No
                                    </button>
                                  </div>
                                ) : (
                                  <div className="group flex items-center">
                                    <button
                                      onClick={() => router.push(`/dashboard/${companySlug}/${folder.year}/${month.month}`)}
                                      className={`flex flex-1 items-center gap-2 rounded-xl border px-3 py-1.5 text-xs transition-all ${
                                        isActiveMonth(company.companyName, folder.year, month.month)
                                          ? 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary shadow-[0_10px_24px_rgba(37,99,235,0.12)]'
                                          : 'border-transparent text-text-muted hover:border-border-primary/70 hover:bg-bg-tertiary hover:text-text-secondary'
                                      }`}
                                    >
                                      <LuCalendar className="h-3.5 w-3.5" />
                                      <span className="flex-1 truncate text-left">{month.name}</span>
                                      {month.expenseCount > 0 && (
                                        <span className="text-[10px] font-medium">
                                          {month.expenseCount}
                                        </span>
                                      )}
                                    </button>
                                    <button
                                      onClick={() =>
                                        setDeleteTarget({
                                          type: 'month',
                                          companyName: company.companyName,
                                          year: folder.year,
                                          month: month.month,
                                        })
                                      }
                                      className="opacity-0 rounded-xl p-1.5 text-text-muted transition-all hover:bg-bg-tertiary hover:text-error group-hover:opacity-100"
                                      title={`Delete ${month.name}`}
                                    >
                                      <LuTrash2 className="h-3 w-3" />
                                    </button>
                                  </div>
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
            )}
          </div>
        );
      })}
    </div>
  );
}
