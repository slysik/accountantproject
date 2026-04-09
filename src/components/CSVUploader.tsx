'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { LuUpload, LuFileText, LuCheck, LuX, LuFlaskConical } from 'react-icons/lu';
import { parseCSV, categorizeAll, formatCurrency, formatDate } from '@/lib/expense-processor';
import { bulkCreateExpenses } from '@/lib/database';
import { useAuth } from '@/lib/auth';
import { buildCategoryMappingLookup, getCategoryMappings, type CategoryMappingLookup } from '@/lib/category-mappings';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { CategorizedExpense } from '@/types';

interface CSVUploaderProps {
  companyName: string;
  year: string;
  month: string;
  onUploadComplete: () => void;
}

function rewriteSampleDataYear(csvText: string, targetYear: string): string {
  return csvText.replace(/(\b\d{1,2}\/\d{1,2}\/)\d{4}\b/g, `$1${targetYear}`);
}

export default function CSVUploader({ companyName, year, month: _month, onUploadComplete }: CSVUploaderProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [preview, setPreview] = useState<CategorizedExpense[] | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [mappingLookup, setMappingLookup] = useState<CategoryMappingLookup>({
    sourceCategories: {},
    retailers: [],
  });

  useEffect(() => {
    if (!effectiveUserId) return;
    const userId = effectiveUserId;

    let cancelled = false;

    async function loadMappings() {
      try {
        const mappings = await getCategoryMappings(userId);
        if (!cancelled) {
          setMappingLookup(buildCategoryMappingLookup(mappings));
        }
      } catch (err) {
        console.error('Failed to load category mappings:', err);
      }
    }

    void loadMappings();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setInfo(null);
    setPreview(null);
    setParsing(true);

    try {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Please upload a CSV file.');
      }

      const text = await file.text();
      const expenses = parseCSV(text, file.name);

      if (expenses.length === 0) {
        throw new Error('No valid expense rows found in the CSV file.');
      }

      const categorized = categorizeAll(expenses, mappingLookup);
      setPreview(categorized);
      setFilename(file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
    } finally {
      setParsing(false);
    }
  }, [mappingLookup]);

  const processCSVText = useCallback(async (text: string, name: string) => {
    setError(null);
    setInfo(null);
    setPreview(null);
    setParsing(true);

    try {
      const expenses = parseCSV(text, name);

      if (expenses.length === 0) {
        throw new Error('No valid expense rows found in the CSV file.');
      }

      const categorized = categorizeAll(expenses, mappingLookup);
      setPreview(categorized);
      setFilename(name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV file.');
    } finally {
      setParsing(false);
    }
  }, [mappingLookup]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [processFile]);

  const handleTrySample = useCallback(async () => {
    setError(null);
    setInfo(null);
    setParsing(true);
    try {
      const response = await fetch('/sample-data/sample_transactions.csv');
      if (!response.ok) throw new Error('Failed to fetch sample data.');
      const text = await response.text();
      const rewritten = rewriteSampleDataYear(text, year);
      await processCSVText(rewritten, `sample_transactions_${year}.csv`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sample data.');
      setParsing(false);
    }
  }, [processCSVText, year]);

  const handleConfirmSave = useCallback(async () => {
    if (!preview || !user) return;

    setSaving(true);
    setSaveProgress(0);
    setError(null);
    setInfo(null);

    try {
      setSaveProgress(10);
      const inserted = await bulkCreateExpenses(user.id, companyName, preview);
      setSaveProgress(100);

      if (inserted === 0) {
        setInfo('No new expenses were inserted because every row already exists for this account and year.');
        return;
      }

      if (inserted < preview.length) {
        setInfo(`${inserted} expense${inserted === 1 ? '' : 's'} saved. ${preview.length - inserted} duplicate row${preview.length - inserted === 1 ? '' : 's'} were skipped.`);
      }

      setPreview(null);
      setFilename('');
      onUploadComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expenses.');
    } finally {
      setSaving(false);
      setSaveProgress(0);
    }
  }, [preview, user, companyName, onUploadComplete]);

  const handleCancel = useCallback(() => {
    setPreview(null);
    setFilename('');
    setError(null);
    setInfo(null);
  }, []);

  // Preview mode
  if (preview) {
    const previewRows = preview.slice(0, 5);
    const totalAmount = preview.reduce((sum, e) => sum + e.amount, 0);

    return (
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LuFileText className="h-5 w-5 text-accent-primary" />
            <h2 className="text-sm font-semibold text-text-primary">
              Preview: {filename}
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>{preview.length} expenses</span>
            <span className="text-text-muted">|</span>
            <span className="text-accent-primary font-medium">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Mini preview table */}
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-primary text-left text-text-muted">
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Description</th>
                <th className="pb-2 pr-4 text-right">Amount</th>
                <th className="pb-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map((expense, i) => (
                <tr key={i} className="border-b border-border-primary/50">
                  <td className="py-2 pr-4 text-text-secondary whitespace-nowrap">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-2 pr-4 text-text-primary max-w-[200px] truncate">
                    {expense.description}
                  </td>
                  <td className="py-2 pr-4 text-right text-text-primary font-mono">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="py-2 text-text-secondary">
                    {expense.category}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {preview.length > 5 && (
            <p className="mt-2 text-xs text-text-muted">
              ... and {preview.length - 5} more expenses
            </p>
          )}
        </div>

        {/* Save progress bar */}
        {saving && (
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
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

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirmSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LuCheck className="h-3.5 w-3.5" />
            {saving ? 'Saving...' : 'Confirm & Save'}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary disabled:opacity-50"
          >
            <LuX className="h-3.5 w-3.5" />
            Cancel
          </button>
        </div>
      </section>
    );
  }

  // Upload zone mode
  return (
    <section>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-primary bg-bg-secondary hover:border-text-muted hover:bg-bg-secondary/80'
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-tertiary">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
              </div>
              <p className="text-sm text-text-secondary">Parsing CSV...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-tertiary">
                <LuUpload className={`h-6 w-6 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`} />
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

      {/* Error message */}
      {error && (
        <div className="mt-3 rounded-lg bg-error/10 border border-error/20 px-4 py-3 text-xs text-error">
          {error}
        </div>
      )}

      {info && (
        <div className="mt-3 rounded-lg border border-accent-primary/20 bg-accent-primary/10 px-4 py-3 text-xs text-text-secondary">
          {info}
        </div>
      )}

      {/* Try Sample Data button */}
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
          Try Sample Data for {year}
        </button>
      </div>
    </section>
  );
}
