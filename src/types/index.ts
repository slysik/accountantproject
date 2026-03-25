export interface Expense {
  id: string;
  date: Date;
  month: string; // YYYY-MM
  description: string;
  amount: number;
  originalCategory: string;
  category: string;
  filename: string;
  rawData: string[];
  deletedAt?: Date | null;
  year?: string;
}

export interface CategorizedExpense extends Expense {
  category: string;
}

export interface IrsCategory {
  name: string;
  description: string;
  keywords: string[];
}

export interface FolderNode {
  year: string;
  months: MonthNode[];
}

export interface MonthNode {
  month: string; // "01" through "12"
  name: string; // "January" through "December"
  expenseCount: number;
  total: number;
}

export interface AggregationResult {
  [month: string]: {
    [category: string]: {
      total: number;
      count: number;
      expenses: CategorizedExpense[];
    };
  };
}

export interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  byCategory: { [category: string]: { total: number; count: number } };
  uniqueMonths: string[];
  uniqueFilenames: string[];
}

export interface ExportOptions {
  format: 'excel' | 'csv' | 'qbo';
  expenses: CategorizedExpense[];
  aggregation?: AggregationResult;
  summary?: ExpenseSummary;
}
