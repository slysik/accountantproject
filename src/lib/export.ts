import * as XLSX from 'xlsx';
import type { CategorizedExpense, AggregationResult, ExpenseSummary } from '@/types';
import { getCategoryName, IRS_EXPENSE_CATEGORIES } from './categories';
import { formatCurrency, formatDate, formatMonth } from './expense-processor';
import { toDateString } from './date-utils';

type SheetData = (string | number)[][];

interface MonthlyMetricRow {
  month: string;
  total: number;
  count: number;
}

interface YearlyMetricRow {
  year: string;
  total: number;
  count: number;
  average: number;
  topMonth: MonthlyMetricRow | null;
}

interface YearlyMetrics {
  years: YearlyMetricRow[];
  months: MonthlyMetricRow[];
}

/** Generate and download an Excel report with multiple sheets. */
export function generateExcelReport(
  expenses: CategorizedExpense[],
  aggregation: AggregationResult,
  summary: ExpenseSummary,
  options?: { includeYearlySummary?: boolean }
): string {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Summary by Category
  const summaryData = createSummarySheet(summary);
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  styleSheet(summaryWs, summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

  // Sheet 2: Monthly Breakdown
  const monthlyData = createMonthlySheet(aggregation, summary);
  const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
  styleSheet(monthlyWs, monthlyData);
  XLSX.utils.book_append_sheet(wb, monthlyWs, "Monthly Breakdown");

  // Sheet 3: All Transactions
  const transactionsData = createTransactionsSheet(expenses);
  const transactionsWs = XLSX.utils.aoa_to_sheet(transactionsData);
  styleSheet(transactionsWs, transactionsData);
  XLSX.utils.book_append_sheet(wb, transactionsWs, "All Transactions");

  // Sheet 4: Category Details
  const categoryDetailData = createCategoryDetailSheet(expenses);
  const categoryDetailWs = XLSX.utils.aoa_to_sheet(categoryDetailData);
  styleSheet(categoryDetailWs, categoryDetailData);
  XLSX.utils.book_append_sheet(wb, categoryDetailWs, "By Category");

  if (options?.includeYearlySummary) {
    const yearlySummaryData = createYearlySummarySheet(expenses);
    const yearlySummaryWs = XLSX.utils.aoa_to_sheet(yearlySummaryData);
    styleSheet(yearlySummaryWs, yearlySummaryData);
    XLSX.utils.book_append_sheet(wb, yearlySummaryWs, "Yearly Summary");
  }

  // Generate filename with date range
  const months = summary.uniqueMonths;
  const dateRange = months.length > 0
    ? `${months[0]}_to_${months[months.length - 1]}`
    : new Date().toISOString().split('T')[0];

  const filename = `expense_report_${dateRange}.xlsx`;

  // Download
  XLSX.writeFile(wb, filename);

  return filename;
}

function buildYearlyMetrics(expenses: CategorizedExpense[]): YearlyMetrics {
  const byYear = new Map<string, { total: number; count: number; months: Map<string, MonthlyMetricRow> }>();
  const byMonth = new Map<string, MonthlyMetricRow>();

  for (const expense of expenses) {
    const year = expense.year ?? expense.month.slice(0, 4);
    const month = expense.month;

    const yearBucket = byYear.get(year) ?? { total: 0, count: 0, months: new Map<string, MonthlyMetricRow>() };
    yearBucket.total += expense.amount;
    yearBucket.count += 1;

    const yearMonthBucket = yearBucket.months.get(month) ?? { month, total: 0, count: 0 };
    yearMonthBucket.total += expense.amount;
    yearMonthBucket.count += 1;
    yearBucket.months.set(month, yearMonthBucket);
    byYear.set(year, yearBucket);

    const monthBucket = byMonth.get(month) ?? { month, total: 0, count: 0 };
    monthBucket.total += expense.amount;
    monthBucket.count += 1;
    byMonth.set(month, monthBucket);
  }

  const years = Array.from(byYear.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, bucket]) => {
      const topMonth = Array.from(bucket.months.values()).sort((a, b) => b.total - a.total)[0] ?? null;
      return {
        year,
        total: bucket.total,
        count: bucket.count,
        average: bucket.count > 0 ? bucket.total / bucket.count : 0,
        topMonth,
      };
    });

  const months = Array.from(byMonth.values()).sort((a, b) => a.month.localeCompare(b.month));

  return { years, months };
}

function createYearlySummarySheet(expenses: CategorizedExpense[]): SheetData {
  const metrics = buildYearlyMetrics(expenses);
  const data: SheetData = [];

  data.push(["YEARLY SUMMARY"]);
  data.push(["Generated:", new Date().toLocaleDateString()]);
  data.push([]);

  data.push(["YEAR OVERVIEW"]);
  data.push(["Year", "Total Spend", "Transactions", "Average Transaction", "Top Month", "Top Month Total"]);
  metrics.years.forEach((row) => {
    data.push([
      row.year,
      formatCurrency(row.total),
      row.count,
      formatCurrency(row.average),
      row.topMonth ? formatMonth(row.topMonth.month) : 'N/A',
      row.topMonth ? formatCurrency(row.topMonth.total) : '-',
    ]);
  });

  data.push([]);
  data.push(["MONTHLY TOTALS"]);
  data.push(["Month", "Total Spend", "Transactions"]);
  metrics.months.forEach((row) => {
    data.push([
      formatMonth(row.month),
      formatCurrency(row.total),
      row.count,
    ]);
  });

  return data;
}

/** Create summary sheet data array. */
function createSummarySheet(summary: ExpenseSummary): SheetData {
  const data: SheetData = [];

  // Header
  data.push(["EXPENSE SUMMARY REPORT"]);
  data.push(["Generated:", new Date().toLocaleDateString()]);
  data.push([]);

  // Overview
  data.push(["OVERVIEW"]);
  data.push(["Total Expenses:", formatCurrency(summary.totalExpenses)]);
  data.push(["Number of Transactions:", summary.expenseCount]);
  data.push(["Period:", summary.uniqueMonths.length > 0
    ? `${formatMonth(summary.uniqueMonths[0])} - ${formatMonth(summary.uniqueMonths[summary.uniqueMonths.length - 1])}`
    : "N/A"]);
  data.push([]);

  // Category breakdown
  data.push(["EXPENSES BY IRS CATEGORY"]);
  data.push(["Category", "Amount", "# Transactions", "% of Total"]);

  const sortedCategories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1].total - a[1].total);

  sortedCategories.forEach(([categoryId, catData]) => {
    const percentage = summary.totalExpenses > 0
      ? ((catData.total / summary.totalExpenses) * 100).toFixed(1) + '%'
      : '0%';
    data.push([
      getCategoryName(categoryId),
      formatCurrency(catData.total),
      catData.count,
      percentage
    ]);
  });

  data.push([]);
  data.push(["TOTAL", formatCurrency(summary.totalExpenses), summary.expenseCount, "100%"]);

  return data;
}

/** Create monthly breakdown sheet data array. */
function createMonthlySheet(aggregation: AggregationResult, summary: ExpenseSummary): SheetData {
  const data: SheetData = [];
  const months = Object.keys(aggregation).sort();
  const categories = Object.keys(IRS_EXPENSE_CATEGORIES);

  // Header
  data.push(["MONTHLY EXPENSE BREAKDOWN"]);
  data.push([]);

  // Column headers
  const headerRow: (string | number)[] = ["Category", ...months.map(m => formatMonth(m)), "Total"];
  data.push(headerRow);

  // Data rows
  categories.forEach(categoryId => {
    if (!summary.byCategory[categoryId] || summary.byCategory[categoryId].count === 0) return;

    const row: (string | number)[] = [getCategoryName(categoryId)];
    let categoryTotal = 0;

    months.forEach(month => {
      const amount = aggregation[month]?.[categoryId]?.total || 0;
      row.push(amount > 0 ? formatCurrency(amount) : '-');
      categoryTotal += amount;
    });

    row.push(formatCurrency(categoryTotal));
    data.push(row);
  });

  // Monthly totals row
  data.push([]);
  const totalRow: (string | number)[] = ["MONTHLY TOTAL"];
  months.forEach(month => {
    const monthTotal = Object.values(aggregation[month] || {})
      .reduce((sum, cat) => sum + cat.total, 0);
    totalRow.push(formatCurrency(monthTotal));
  });
  totalRow.push(formatCurrency(summary.totalExpenses));
  data.push(totalRow);

  return data;
}

/** Create transactions sheet data array. */
function createTransactionsSheet(expenses: CategorizedExpense[]): SheetData {
  const data: SheetData = [];

  // Header
  data.push(["ALL TRANSACTIONS"]);
  data.push([]);
  data.push(["Date", "Description", "Amount", "IRS Category", "Month"]);

  // Sort by date
  const sorted = [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime());

  sorted.forEach(expense => {
    data.push([
      formatDate(expense.date),
      expense.description,
      formatCurrency(expense.amount),
      getCategoryName(expense.category),
      formatMonth(expense.month)
    ]);
  });

  return data;
}

/** Create category detail sheet data array. */
function createCategoryDetailSheet(expenses: CategorizedExpense[]): SheetData {
  const data: SheetData = [];

  // Group expenses by category
  const byCategory: Record<string, CategorizedExpense[]> = {};
  expenses.forEach(expense => {
    if (!byCategory[expense.category]) {
      byCategory[expense.category] = [];
    }
    byCategory[expense.category].push(expense);
  });

  // Sort categories by total amount
  const sortedCategories = Object.entries(byCategory)
    .map(([cat, exps]) => ({
      category: cat,
      expenses: exps,
      total: exps.reduce((sum, e) => sum + e.amount, 0)
    }))
    .sort((a, b) => b.total - a.total);

  sortedCategories.forEach(({ category, expenses: catExpenses, total }) => {
    data.push([getCategoryName(category).toUpperCase()]);
    data.push(["Total:", formatCurrency(total), "Transactions:", catExpenses.length]);
    data.push(["Date", "Description", "Amount"]);

    catExpenses
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .forEach(expense => {
        data.push([
          formatDate(expense.date),
          expense.description,
          formatCurrency(expense.amount)
        ]);
      });

    data.push([]);
    data.push([]);
  });

  return data;
}

/** Apply basic column width styling to a worksheet. */
function styleSheet(ws: XLSX.WorkSheet, data: SheetData): void {
  // Calculate column widths
  const colWidths: number[] = [];
  data.forEach(row => {
    row.forEach((cell, i) => {
      const cellLength = cell ? cell.toString().length : 0;
      colWidths[i] = Math.max(colWidths[i] || 10, Math.min(cellLength + 2, 50));
    });
  });

  ws['!cols'] = colWidths.map(w => ({ wch: w }));
}

/** Generate a CSV string from categorized expenses. */
export function generateCSV(expenses: CategorizedExpense[], options?: { includeYearlySummary?: boolean }): string {
  const header = ["Date", "Description", "Amount", "Category"];
  const rows = expenses.map(e => [
    toDateString(e.date instanceof Date ? e.date : new Date(e.date)),
    `"${e.description.replace(/"/g, '""')}"`,
    String(e.amount),
    getCategoryName(e.category)
  ].join(','));

  if (!options?.includeYearlySummary) {
    return [header.join(','), ...rows].join('\n');
  }

  const metrics = buildYearlyMetrics(expenses);
  const summaryRows = [
    ['YEARLY SUMMARY'],
    ['Generated', new Date().toLocaleDateString()],
    [],
    ['YEAR OVERVIEW'],
    ['Year', 'Total Spend', 'Transactions', 'Average Transaction', 'Top Month', 'Top Month Total'],
    ...metrics.years.map((row) => [
      row.year,
      formatCurrency(row.total),
      String(row.count),
      formatCurrency(row.average),
      row.topMonth ? formatMonth(row.topMonth.month) : 'N/A',
      row.topMonth ? formatCurrency(row.topMonth.total) : '-',
    ]),
    [],
    ['MONTHLY TOTALS'],
    ['Month', 'Total Spend', 'Transactions'],
    ...metrics.months.map((row) => [
      formatMonth(row.month),
      formatCurrency(row.total),
      String(row.count),
    ]),
    [],
    ['TRANSACTIONS'],
    header,
  ]
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','));

  return [...summaryRows, ...rows].join('\n');
}

export function generateYearlySummaryCSV(expenses: CategorizedExpense[]): string {
  const metrics = buildYearlyMetrics(expenses);

  const sections = [
    ['YEAR OVERVIEW'],
    ['Year', 'Total Spend', 'Transactions', 'Average Transaction', 'Top Month', 'Top Month Total'],
    ...metrics.years.map((row) => [
      row.year,
      formatCurrency(row.total),
      String(row.count),
      formatCurrency(row.average),
      row.topMonth ? formatMonth(row.topMonth.month) : 'N/A',
      row.topMonth ? formatCurrency(row.topMonth.total) : '-',
    ]),
    [],
    ['MONTHLY TOTALS'],
    ['Month', 'Total Spend', 'Transactions'],
    ...metrics.months.map((row) => [
      formatMonth(row.month),
      formatCurrency(row.total),
      String(row.count),
    ]),
  ];

  return sections
    .map((row) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

// NOTE: QBO export is handled by qbo-export.ts which correctly uses
// TRNTYPE=DEBIT with negative TRNAMT for expense outflows.
// See: src/lib/qbo-export.ts → generateQBOFile() and downloadQBO()
