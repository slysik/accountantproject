import type { Expense, CategorizedExpense, AggregationResult, ExpenseSummary } from '@/types';
import { categorizeExpense } from './categories';

interface ColumnMap {
  date: number | null;
  description: number | null;
  amount: number | null;
  debit: number | null;
  credit: number | null;
  category: number | null;
  useDebitCredit?: boolean;
}

/** Parse a CSV string into an array of Expense objects. */
export function parseCSV(csvText: string, filename: string): Expense[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have headers and at least one data row');
  }

  // Parse headers
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());

  // Find relevant columns (flexible mapping)
  const columnMap = detectColumns(headers);
  console.log('Detected columns:', columnMap, 'from headers:', headers);

  if (columnMap.date === null || (columnMap.amount === null && !columnMap.useDebitCredit)) {
    throw new Error('CSV must contain Date and Amount columns. Found headers: ' + headers.join(', '));
  }

  // Parse data rows
  const expenses: Expense[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const expense = extractExpense(values, columnMap, headers, filename);

    if (expense && expense.amount !== 0) {
      expenses.push(expense);
    }
  }

  return expenses;
}

/** Parse a single CSV line, handling quoted fields. */
export function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

/** Detect column positions based on common bank export formats. */
export function detectColumns(headers: string[]): ColumnMap {
  const columnMap: ColumnMap = {
    date: null,
    description: null,
    amount: null,
    debit: null,
    credit: null,
    category: null
  };

  headers.forEach((header, index) => {
    const h = header.toLowerCase().trim();

    // Date columns
    if (h.includes('date') || h === 'posted' || h === 'transaction date' || h === 'trans date') {
      if (columnMap.date === null) columnMap.date = index;
    }
    // Description columns
    if (h.includes('description') || h.includes('memo') || h.includes('merchant') ||
      h.includes('name') || h.includes('payee') || h === 'details' || h.includes('narrative')) {
      if (columnMap.description === null) columnMap.description = index;
    }
    // Amount columns - more flexible matching
    if (h.includes('amount') || h === 'sum' || h === 'value' || h === 'total') {
      if (columnMap.amount === null) columnMap.amount = index;
    }
    // Debit/Credit columns
    if (h.includes('debit') || h === 'withdrawal' || h === 'withdrawals' || h === 'expense') {
      columnMap.debit = index;
    }
    if (h.includes('credit') || h === 'deposit' || h === 'deposits' || h === 'income') {
      columnMap.credit = index;
    }
    // Category columns
    if (h.includes('category') || h.includes('type')) {
      columnMap.category = index;
    }
  });

  // If no single amount column, use debit/credit
  if (columnMap.amount === null && columnMap.debit !== null) {
    columnMap.useDebitCredit = true;
  }

  // Fallback: if we have 3 columns and no detection, assume Date, Description, Amount
  if (columnMap.date === null && headers.length >= 3) {
    columnMap.date = 0;
    columnMap.description = 1;
    columnMap.amount = 2;
  }

  return columnMap;
}

/** Extract expense data from a parsed CSV row. */
export function extractExpense(
  values: string[],
  columnMap: ColumnMap,
  _headers: string[],
  filename: string
): Expense | null {
  try {
    // Parse date
    const dateStr = values[columnMap.date!] || '';
    const date = parseDate(dateStr);
    if (!date) return null;

    // Parse description
    const description = values[columnMap.description ?? 1] || 'Unknown';

    // Parse amount
    let amount = 0;
    if (columnMap.useDebitCredit) {
      const debit = parseAmount(values[columnMap.debit!]);
      const credit = parseAmount(values[columnMap.credit!]);
      amount = debit > 0 ? -debit : credit; // Expenses are negative
    } else {
      amount = parseAmount(values[columnMap.amount!]);
    }

    // Only include expenses (negative amounts or debits)
    if (amount >= 0) return null;

    // Get original category if present
    const originalCategory = columnMap.category !== null ? (values[columnMap.category] || '') : '';

    return {
      id: String(Date.now() + Math.random()),
      date: date,
      month: date.toISOString().substring(0, 7), // YYYY-MM
      description: description.replace(/"/g, '').trim(),
      amount: Math.abs(amount),
      originalCategory: originalCategory,
      category: '', // Will be assigned later by categorizeAll
      filename: filename,
      rawData: values
    };
  } catch (e) {
    console.warn('Error parsing row:', values, e);
    return null;
  }
}

/** Parse various date formats into a Date object. */
export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Remove quotes
  const cleaned = dateStr.replace(/"/g, '').trim();

  // Try different formats
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/DD/YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/,   // MM/DD/YY
    /^(\d{4})-(\d{2})-(\d{2})$/,         // YYYY-MM-DD
    /^(\d{1,2})-(\d{1,2})-(\d{4})$/,     // MM-DD-YYYY
  ];

  for (let f = 0; f < formats.length; f++) {
    const match = cleaned.match(formats[f]);
    if (match) {
      let year: number, month: number, day: number;

      if (f === 2) {
        // YYYY-MM-DD
        year = parseInt(match[1]);
        month = parseInt(match[2]) - 1;
        day = parseInt(match[3]);
      } else {
        // MM/DD/YYYY or similar
        month = parseInt(match[1]) - 1;
        day = parseInt(match[2]);
        year = parseInt(match[3]);
        if (year < 100) year += 2000;
      }

      const date = new Date(year, month, day);
      if (!isNaN(date.getTime())) return date;
    }
  }

  // Try native parsing as fallback
  const date = new Date(cleaned);
  return isNaN(date.getTime()) ? null : date;
}

/** Parse an amount string to a number, handling currency symbols, commas, and parentheses. */
export function parseAmount(amountStr: string | undefined): number {
  if (!amountStr || amountStr === '') return 0;

  // Remove currency symbols, spaces, and handle parentheses for negatives
  let cleaned = amountStr.toString()
    .replace(/[$\u20AC\u00A3\u00A5]/g, '')
    .replace(/,/g, '')
    .replace(/\s/g, '')
    .trim();

  // Handle parentheses as negative
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.substring(1, cleaned.length - 1);
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/** Categorize all expenses using IRS category keyword matching. */
export function categorizeAll(expenses: Expense[]): CategorizedExpense[] {
  return expenses.map(expense => ({
    ...expense,
    category: categorizeExpense(expense.description)
  }));
}

/** Aggregate expenses by month and category. */
export function aggregateByMonthAndCategory(expenses: CategorizedExpense[]): AggregationResult {
  const aggregation: AggregationResult = {};

  expenses.forEach(expense => {
    const month = expense.month;
    const category = expense.category;

    if (!aggregation[month]) {
      aggregation[month] = {};
    }
    if (!aggregation[month][category]) {
      aggregation[month][category] = {
        total: 0,
        count: 0,
        expenses: []
      };
    }

    aggregation[month][category].total += expense.amount;
    aggregation[month][category].count++;
    aggregation[month][category].expenses.push(expense);
  });

  return aggregation;
}

/** Get summary statistics for a set of categorized expenses. */
export function getSummary(expenses: CategorizedExpense[]): ExpenseSummary {
  const byCategory: { [key: string]: { total: number; count: number } } = {};
  let total = 0;

  expenses.forEach(expense => {
    const cat = expense.category;
    if (!byCategory[cat]) {
      byCategory[cat] = { total: 0, count: 0 };
    }
    byCategory[cat].total += expense.amount;
    byCategory[cat].count++;
    total += expense.amount;
  });

  return {
    totalExpenses: total,
    expenseCount: expenses.length,
    byCategory: byCategory,
    uniqueMonths: Array.from(new Set(expenses.map(e => e.month))).sort(),
    uniqueFilenames: Array.from(new Set(expenses.map(e => e.filename))).sort()
  };
}

/** Format a number as USD currency. */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

/** Format a Date object as a human-readable string. */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

/** Format a YYYY-MM month string as a human-readable month/year. */
export function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long'
  }).format(date);
}
