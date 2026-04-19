export interface Expense {
  id: string;
  date: Date;
  companyName?: string;
  month: string; // YYYY-MM
  description: string;
  amount: number;
  originalCategory: string;
  category: string;
  filename: string;
  rawData: string[];
  deletedAt?: Date | null;
  year?: string;
  accountLabel?: string; // payment account this import was tagged to
}

export interface CategorizedExpense extends Expense {
  category: string;
}

export interface IrsCategory {
  name: string;
  description: string;
  keywords: string[];
}

export interface CompanyNode {
  companyName: string;
  years: FolderNode[];
  rootFolders: SubfolderNode[];
}

export interface TrashCompanyItem {
  id: string;
  name: string;
  deletedAt: Date | null;
  yearCount: number;
  subfolderCount: number;
  expenseCount: number;
}

export interface FolderNode {
  year: string;
  months: MonthNode[];
  subfolders: SubfolderNode[];
}

export interface MonthNode {
  month: string; // "01" through "12"
  name: string; // "January" through "December"
  expenseCount: number;
  total: number;
}

export interface SubfolderNode {
  id: string;
  name: string;
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

export type IncomeType = 'check' | 'bank_deposit' | 'cash' | 'credit' | 'other';

export interface Income {
  id?: string;
  userId?: string;
  accountId?: string;
  companyName: string;
  year: string;
  month: string; // YYYY-MM
  date: string;
  description: string;
  amount: number;
  incomeType: IncomeType;
  source: string; // payer / origin of funds
  filename: string;
  rawData: string[];
  paymentMethod?: string;
  notes?: string;
  deletedAt?: Date | null;
}

export interface Receipt {
  id: string;
  expense_id: string;
  user_id: string;
  filename: string;
  storage_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_by?: string;
  created_at: Date;
  deleted_at: Date | null;
}

export interface ReceiptUploadResult {
  success: boolean;
  receipt?: Receipt;
  error?: string;
}
