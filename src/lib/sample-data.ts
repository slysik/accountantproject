import { categorizeAll } from './expense-processor';
import type { CategorizedExpense, Expense } from '@/types';

export const SAMPLE_COMPANY_NAME = 'Sample Company';

export function buildSampleExpenses(companyName = SAMPLE_COMPANY_NAME): CategorizedExpense[] {
  const sample: Expense[] = [
    { id: 'sample-1', date: new Date(2024, 0, 12), month: '2024-01', description: 'Google Ads campaign', amount: 420, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-2', date: new Date(2024, 1, 3), month: '2024-02', description: 'Office Depot supplies', amount: 185, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-3', date: new Date(2024, 2, 22), month: '2024-03', description: 'Client dinner restaurant', amount: 260, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-4', date: new Date(2024, 4, 9), month: '2024-05', description: 'Adobe subscription', amount: 79, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-5', date: new Date(2024, 6, 18), month: '2024-07', description: 'Airfare to conference', amount: 680, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-6', date: new Date(2024, 9, 14), month: '2024-10', description: 'Coworking office rent', amount: 540, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2024', companyName },
    { id: 'sample-7', date: new Date(2025, 0, 11), month: '2025-01', description: 'Meta ads retargeting', amount: 510, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
    { id: 'sample-8', date: new Date(2025, 1, 28), month: '2025-02', description: 'Software subscription zoom', amount: 132, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
    { id: 'sample-9', date: new Date(2025, 3, 8), month: '2025-04', description: 'Contract labor design', amount: 940, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
    { id: 'sample-10', date: new Date(2025, 5, 6), month: '2025-06', description: 'Uber business travel', amount: 145, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
    { id: 'sample-11', date: new Date(2025, 7, 19), month: '2025-08', description: 'Laptop and monitor', amount: 1640, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
    { id: 'sample-12', date: new Date(2025, 10, 2), month: '2025-11', description: 'Phone and internet bill', amount: 210, originalCategory: '', category: '', filename: 'sample.csv', rawData: [], year: '2025', companyName },
  ];

  return categorizeAll(sample);
}
