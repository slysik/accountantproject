'use client';

import { useState, useCallback } from 'react';
import { LuDownload, LuFileSpreadsheet, LuFileText, LuBookOpen } from 'react-icons/lu';
import { generateExcelReport, generateCSV, generateYearlySummaryCSV } from '@/lib/export';
import { generateQBOFile } from '@/lib/qbo-export';
import { aggregateByMonthAndCategory, getSummary } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface ExportMenuProps {
  expenses: CategorizedExpense[];
}

export default function ExportMenu({ expenses }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [includeYearlySummary, setIncludeYearlySummary] = useState(false);

  const downloadTextFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportExcel = useCallback(() => {
    setExporting('excel');
    try {
      const aggregation = aggregateByMonthAndCategory(expenses);
      const summary = getSummary(expenses);
      generateExcelReport(expenses, aggregation, summary, { includeYearlySummary });
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [expenses, includeYearlySummary]);

  const handleExportCSV = useCallback(() => {
    setExporting('csv');
    try {
      const months = Array.from(new Set(expenses.map(e => e.month))).sort();
      const dateRange = months.length > 0
        ? `${months[0]}_to_${months[months.length - 1]}`
        : new Date().toISOString().split('T')[0];
      downloadTextFile(
        generateCSV(expenses, { includeYearlySummary }),
        `expenses_${dateRange}.csv`,
        'text/csv;charset=utf-8;'
      );
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [downloadTextFile, expenses, includeYearlySummary]);

  const handleExportQBO = useCallback(() => {
    setExporting('qbo');
    try {
      const { content, filename } = generateQBOFile(expenses);
      downloadTextFile(content, filename, 'application/x-ofx');
      if (includeYearlySummary) {
        const summaryFilename = filename.replace(/\.qbo$/i, '_yearly_summary.csv');
        downloadTextFile(
          generateYearlySummaryCSV(expenses),
          summaryFilename,
          'text/csv;charset=utf-8;'
        );
      }
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [downloadTextFile, expenses, includeYearlySummary]);

  if (expenses.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-tertiary/80"
      >
        <LuDownload className="h-3.5 w-3.5 text-accent-primary" />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-lg border border-border-primary bg-bg-secondary shadow-lg shadow-black/40">
            <div className="border-b border-border-primary px-3 py-2">
              <label className="flex items-start gap-2 text-[11px] text-text-secondary">
                <input
                  type="checkbox"
                  checked={includeYearlySummary}
                  onChange={(e) => setIncludeYearlySummary(e.target.checked)}
                  className="mt-0.5 rounded border-border-primary bg-bg-tertiary text-accent-primary focus:ring-accent-primary"
                />
                <span>Include yearly summary with month-by-month and annual totals</span>
              </label>
            </div>
            <div className="p-1">
              <button
                onClick={handleExportExcel}
                disabled={!!exporting}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
              >
                <LuFileSpreadsheet className="h-4 w-4 text-success" />
                <div className="text-left">
                  <div className="font-medium">Export Excel</div>
                  <div className="text-text-muted">.xlsx with sheets{includeYearlySummary ? ' + yearly summary' : ''}</div>
                </div>
              </button>

              <button
                onClick={handleExportCSV}
                disabled={!!exporting}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
              >
                <LuFileText className="h-4 w-4 text-accent-primary" />
                <div className="text-left">
                  <div className="font-medium">Export CSV</div>
                  <div className="text-text-muted">Comma-separated{includeYearlySummary ? ' + summary section' : ''}</div>
                </div>
              </button>

              <button
                onClick={handleExportQBO}
                disabled={!!exporting}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
              >
                <LuBookOpen className="h-4 w-4 text-accent-primary" />
                <div className="text-left">
                  <div className="font-medium">Export QBO</div>
                  <div className="text-text-muted">QuickBooks{includeYearlySummary ? ' + summary CSV' : ''}</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
