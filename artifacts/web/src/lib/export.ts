/**
 * Export utilities for the artifact UI layer.
 *
 * Provides CSV generation and download for expense data.
 * For QBO/OFX export, use qbo-export.ts.
 */

import { getCategoryName } from './categories';
import { toDateString } from './date-utils';

interface ExportableExpense {
  date: string | Date;
  description: string;
  amount: number;
  category: string;
}

/** Generate a CSV string from expenses and trigger a browser download. */
export function generateCSV(expenses: ExportableExpense[]): string {
  const header = ["Date", "Description", "Amount", "Category"];
  const rows = expenses.map(e => {
    const dateStr = e.date instanceof Date ? toDateString(e.date) : String(e.date);
    return [
      dateStr,
      `"${String(e.description).replace(/"/g, '""')}"`,
      String(e.amount),
      getCategoryName(e.category)
    ].join(',');
  });

  const csvContent = [header.join(','), ...rows].join('\n');

  // Trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `expenses_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  return csvContent;
}

// NOTE: QBO export is handled by qbo-export.ts which correctly uses
// TRNTYPE=DEBIT with negative TRNAMT for expense outflows.
// See: artifacts/web/src/lib/qbo-export.ts → downloadQBO()
