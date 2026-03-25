'use client';

import { useState, useCallback } from 'react';
import { LuDownload, LuFileSpreadsheet, LuFileText, LuBookOpen } from 'react-icons/lu';
import { generateExcelReport, generateCSV } from '@/lib/export';
import { generateQBOFile } from '@/lib/qbo-export';
import { aggregateByMonthAndCategory, getSummary } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface ExportMenuProps {
  expenses: CategorizedExpense[];
}

export default function ExportMenu({ expenses }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExportExcel = useCallback(() => {
    setExporting('excel');
    try {
      const aggregation = aggregateByMonthAndCategory(expenses);
      const summary = getSummary(expenses);
      generateExcelReport(expenses, aggregation, summary);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [expenses]);

  const handleExportCSV = useCallback(() => {
    setExporting('csv');
    try {
      const csvContent = generateCSV(expenses);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const months = Array.from(new Set(expenses.map(e => e.month))).sort();
      const dateRange = months.length > 0
        ? `${months[0]}_to_${months[months.length - 1]}`
        : new Date().toISOString().split('T')[0];
      a.download = `expenses_${dateRange}.csv`;

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [expenses]);

  const handleExportQBO = useCallback(() => {
    setExporting('qbo');
    try {
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
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [expenses]);

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
            <div className="p-1">
              <button
                onClick={handleExportExcel}
                disabled={!!exporting}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs text-text-primary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
              >
                <LuFileSpreadsheet className="h-4 w-4 text-success" />
                <div className="text-left">
                  <div className="font-medium">Export Excel</div>
                  <div className="text-text-muted">.xlsx with sheets</div>
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
                  <div className="text-text-muted">Comma-separated</div>
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
                  <div className="text-text-muted">QuickBooks format</div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
