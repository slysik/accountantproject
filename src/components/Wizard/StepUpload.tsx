'use client';

import { useState, useRef, useCallback } from 'react';
import { LuUpload, LuFlaskConical } from 'react-icons/lu';
import { parseCSV, categorizeAll, formatCurrency, formatDate } from '@/lib/expense-processor';
import type { CategorizedExpense } from '@/types';

interface StepUploadProps {
  onComplete: (_expenses: CategorizedExpense[]) => void;
}

export default function StepUpload({ onComplete }: StepUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CategorizedExpense[] | null>(null);

  const processText = useCallback((text: string, filename: string) => {
    setParsing(true);
    setError(null);
    try {
      const expenses = parseCSV(text, filename);
      if (expenses.length === 0) {
        throw new Error('No valid expense rows found in the CSV file.');
      }
      const categorized = categorizeAll(expenses);
      setPreview(categorized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
    } finally {
      setParsing(false);
    }
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        setError('Please upload a CSV file.');
        return;
      }
      const text = await file.text();
      processText(text, file.name);
    },
    [processText]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [processFile]
  );

  const handleTrySample = useCallback(async () => {
    setParsing(true);
    setError(null);
    try {
      const response = await fetch('/sample-data/sample_transactions.csv');
      if (!response.ok) throw new Error('Failed to fetch sample data.');
      const text = await response.text();
      processText(text, 'sample_transactions.csv');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data.');
      setParsing(false);
    }
  }, [processText]);

  // Preview mode
  if (preview) {
    const previewRows = preview.slice(0, 10);
    const totalAmount = preview.reduce((sum, e) => sum + e.amount, 0);

    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">
            Parsed {preview.length} expenses
          </h2>
          <span className="text-xs font-medium text-accent-primary">
            {formatCurrency(totalAmount)} total
          </span>
        </div>

        <div className="mb-4 overflow-x-auto rounded-lg border border-border-primary">
          <table className="w-full text-xs">
            <thead className="border-b border-border-primary bg-bg-tertiary/50">
              <tr>
                <th className="pb-2 pr-4 text-left text-text-muted">Date</th>
                <th className="pb-2 pr-4 text-left text-text-muted">Description</th>
                <th className="pb-2 pr-4 text-right text-text-muted">Amount</th>
                <th className="pb-2 text-left text-text-muted">Category</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((expense, i) => (
                <tr key={i} className="border-b border-border-primary/50">
                  <td className="py-2 pr-4 whitespace-nowrap text-text-secondary">
                    {formatDate(
                      expense.date instanceof Date
                        ? expense.date
                        : new Date(expense.date)
                    )}
                  </td>
                  <td className="py-2 pr-4 max-w-[200px] truncate text-text-primary">
                    {expense.description}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono text-text-primary">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-2 text-text-secondary">{expense.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 10 && (
            <p className="px-3 py-2 text-xs text-text-muted">
              ... and {preview.length - 10} more expenses
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onComplete(preview)}
            className="rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
          >
            Continue with {preview.length} expenses
          </button>
          <button
            onClick={() => {
              setPreview(null);
              setError(null);
            }}
            className="rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
          >
            Upload Different File
          </button>
        </div>
      </div>
    );
  }

  // Upload zone
  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 transition-all ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-primary hover:border-text-muted'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          {parsing ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
              <p className="text-sm text-text-secondary">Parsing CSV...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-tertiary">
                <LuUpload
                  className={`h-6 w-6 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`}
                />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">
                  Upload CSV
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  Drag and drop a CSV file here, or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
          {error}
        </div>
      )}

      <div className="mt-3 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTrySample();
          }}
          disabled={parsing}
          className="flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-50"
        >
          <LuFlaskConical className="h-3.5 w-3.5" />
          Try Sample Data
        </button>
      </div>
    </div>
  );
}
