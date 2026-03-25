'use client';

import { useState, useCallback } from 'react';
import { LuFileSpreadsheet, LuFileText, LuBookOpen, LuCheck, LuSave } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { generateExcelReport, generateCSV } from '@/lib/export';
import { generateQBOFile } from '@/lib/qbo-export';
import { aggregateByMonthAndCategory, getSummary } from '@/lib/expense-processor';
import { bulkCreateExpenses } from '@/lib/database';
import type { CategorizedExpense } from '@/types';

interface StepExportProps {
  expenses: CategorizedExpense[];
  year: string;
}

export default function StepExport({ expenses, year }: StepExportProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [saved, setSaved] = useState(false);

  const handleExportExcel = useCallback(() => {
    const aggregation = aggregateByMonthAndCategory(expenses);
    const summary = getSummary(expenses);
    generateExcelReport(expenses, aggregation, summary);
  }, [expenses]);

  const handleExportCSV = useCallback(() => {
    const csvContent = generateCSV(expenses);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const months = Array.from(new Set(expenses.map((e) => e.month))).sort();
    const dateRange =
      months.length > 0
        ? `${months[0]}_to_${months[months.length - 1]}`
        : new Date().toISOString().split('T')[0];
    a.download = `expenses_${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [expenses]);

  const handleExportQBO = useCallback(() => {
    const { content, filename } = generateQBOFile(expenses);
    const blob = new Blob([content], { type: 'application/x-ofx' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [expenses]);

  const handleSaveToDatabase = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    setSaveProgress(0);
    try {
      setSaveProgress(10);
      await bulkCreateExpenses(user.id, expenses);
      setSaveProgress(100);
      setSaved(true);
    } catch (err) {
      console.error('Failed to save expenses:', err);
    } finally {
      setSaving(false);
    }
  }, [user, expenses]);

  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-text-primary">
        Export & Save
      </h2>

      {/* Export option cards */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          onClick={handleExportExcel}
          className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-5 transition-colors hover:border-accent-primary hover:bg-bg-tertiary/80"
        >
          <LuFileSpreadsheet className="h-8 w-8 text-success" />
          <span className="text-xs font-semibold text-text-primary">
            Excel Report
          </span>
          <span className="text-[11px] text-text-muted">.xlsx with sheets</span>
        </button>

        <button
          onClick={handleExportCSV}
          className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-5 transition-colors hover:border-accent-primary hover:bg-bg-tertiary/80"
        >
          <LuFileText className="h-8 w-8 text-accent-primary" />
          <span className="text-xs font-semibold text-text-primary">
            CSV Export
          </span>
          <span className="text-[11px] text-text-muted">Comma-separated</span>
        </button>

        <button
          onClick={handleExportQBO}
          className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-5 transition-colors hover:border-accent-primary hover:bg-bg-tertiary/80"
        >
          <LuBookOpen className="h-8 w-8 text-accent-primary" />
          <span className="text-xs font-semibold text-text-primary">
            QBO Export
          </span>
          <span className="text-[11px] text-text-muted">QuickBooks format</span>
        </button>
      </div>

      {/* Save to Database */}
      <div className="rounded-lg border border-border-primary bg-bg-tertiary/30 p-5">
        {saved ? (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <LuCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-semibold text-success">
                Saved {expenses.length} expenses to database
              </p>
              <p className="text-[11px] text-text-muted">
                Expenses are now in your {year} folders and visible in the sidebar.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <LuSave className="h-4 w-4 text-accent-primary" />
              <span className="text-xs font-semibold text-text-primary">
                Save to Database
              </span>
            </div>
            <p className="mb-3 text-[11px] text-text-muted">
              Save all {expenses.length} expenses to their assigned year/month
              folders in your account.
            </p>

            {saving && (
              <div className="mb-3">
                <div className="mb-1 flex items-center justify-between text-[11px] text-text-secondary">
                  <span>Saving expenses...</span>
                  <span>{saveProgress}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-bg-tertiary">
                  <div
                    className="h-full rounded-full bg-accent-primary transition-all duration-200"
                    style={{ width: `${saveProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <LuSave className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save to Database'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
