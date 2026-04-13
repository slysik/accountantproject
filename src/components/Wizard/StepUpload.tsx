'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowRight, LuCreditCard, LuFlaskConical, LuInfo, LuUpload } from 'react-icons/lu';
import {
  formatCurrency,
  formatDate,
  hasRequiredImportMapping,
  mapRowsToExpenses,
  parseCSVPreview,
  type ImportColumnMap,
  type ParsedImportPreview,
} from '@/lib/expense-processor';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { CategorizedExpense } from '@/types';

interface SavedPaymentAccount {
  id: string;
  label: string;
  account_type: string;
  last_four: string | null;
}

interface StepUploadProps {
  onComplete: (_expenses: CategorizedExpense[]) => void;
}

type MappingFieldKey = Exclude<keyof ImportColumnMap, 'useDebitCredit'>;

interface MappingField {
  key: MappingFieldKey;
  label: string;
  required?: boolean;
  helper: string;
}

const MAPPING_FIELDS: MappingField[] = [
  { key: 'date', label: 'Transaction date', required: true, helper: 'Required. Used to place rows into the right year and month.' },
  { key: 'description', label: 'Description / retailer', helper: 'Merchant, memo, or payee name.' },
  { key: 'amount', label: 'Net amount', helper: 'Use this when your file has a single signed amount column.' },
  { key: 'debit', label: 'Debit / expense', helper: 'Use if the statement splits withdrawals into a separate column.' },
  { key: 'credit', label: 'Credit / income', helper: 'Optional when debit and credit are separate.' },
  { key: 'category', label: 'Imported category', helper: 'Optional. Helps preserve bank-provided category labels.' },
];

function rewriteSampleDataYear(csvText: string): string {
  const currentYear = new Date().getFullYear();
  return csvText.replace(/(\b\d{1,2}\/\d{1,2}\/)\d{4}\b/g, `$1${currentYear}`);
}

function sanitizeSuggestedMapping(mapping: ImportColumnMap): ImportColumnMap {
  const useDebitCredit =
    mapping.debit !== null || mapping.credit !== null
      ? true
      : mapping.useDebitCredit === true;

  return {
    date: mapping.date,
    description: mapping.description,
    amount: useDebitCredit ? null : mapping.amount,
    debit: mapping.debit,
    credit: mapping.credit,
    category: mapping.category,
    useDebitCredit,
  };
}

export default function StepUpload({ onComplete }: StepUploadProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ParsedImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMap | null>(null);
  const [fileName, setFileName] = useState('sample_transactions.csv');

  // Payment account selector
  const [savedAccounts, setSavedAccounts] = useState<SavedPaymentAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>(''); // label value or ''

  useEffect(() => {
    if (!effectiveUserId) return;
    const load = async () => {
      try {
        const { data } = await supabase
          .from('payment_accounts')
          .select('id, label, account_type, last_four')
          .eq('user_id', effectiveUserId)
          .order('created_at', { ascending: true });
        if (data) setSavedAccounts(data as SavedPaymentAccount[]);
      } catch {
        // table may not exist yet — fail silently
      }
    };
    void load();
  }, [effectiveUserId]);

  const mappedState = useMemo(() => {
    if (!preview || !mapping) {
      return { expenses: [] as CategorizedExpense[], errorMessage: null as string | null };
    }

    try {
      const expenses = mapRowsToExpenses(preview.rows, mapping, preview.headers, fileName);
      if (expenses.length === 0) {
        return {
          expenses: [] as CategorizedExpense[],
          errorMessage: 'The mapped fields did not produce any expense rows. Check your amount and date selections.',
        };
      }

      return {
        expenses: expenses.map((expense) => ({ ...expense, category: expense.category ?? '' })),
        errorMessage: null,
      };
    } catch (err) {
      return {
        expenses: [] as CategorizedExpense[],
        errorMessage: err instanceof Error ? err.message : 'Unable to build mapped rows.',
      };
    }
  }, [fileName, mapping, preview]);

  const handleParsedPreview = useCallback((csvText: string, nextFileName: string) => {
    const parsedPreview = parseCSVPreview(csvText);
    setPreview(parsedPreview);
    setMapping(sanitizeSuggestedMapping(parsedPreview.suggestedMapping));
    setFileName(nextFileName);
  }, []);

  const processFile = useCallback(async (file: File) => {
    setParsing(true);
    setError(null);

    try {
      const lowerName = file.name.toLowerCase();

      if (lowerName.endsWith('.pdf')) {
        throw new Error(
          'This guided importer currently supports CSV mapping. Upload the bank export as CSV first, then attach the PDF as supporting documentation after import.'
        );
      }

      if (!lowerName.endsWith('.csv')) {
        throw new Error('Please upload a CSV file for the guided import flow.');
      }

      const text = await file.text();
      handleParsedPreview(text, file.name);
    } catch (err) {
      setPreview(null);
      setMapping(null);
      setError(err instanceof Error ? err.message : 'Failed to read the upload.');
    } finally {
      setParsing(false);
    }
  }, [handleParsedPreview]);

  const handleTrySample = useCallback(async () => {
    setParsing(true);
    setError(null);

    try {
      const response = await fetch('/sample-data/sample_transactions.csv');
      if (!response.ok) {
        throw new Error('Failed to fetch sample data.');
      }

      const text = await response.text();
      handleParsedPreview(rewriteSampleDataYear(text), 'sample_transactions.csv');
    } catch (err) {
      setPreview(null);
      setMapping(null);
      setError(err instanceof Error ? err.message : 'Failed to load sample data.');
    } finally {
      setParsing(false);
    }
  }, [handleParsedPreview]);

  const handleMappingChange = useCallback((key: MappingFieldKey, rawValue: string) => {
    const nextValue = rawValue === '' ? null : Number(rawValue);

    setMapping((current) => {
      const existing = current ?? {
        date: null,
        description: null,
        amount: null,
        debit: null,
        credit: null,
        category: null,
        useDebitCredit: false,
      };

      const next: ImportColumnMap = {
        ...existing,
        [key]: nextValue,
      };

      if (key === 'amount') {
        next.useDebitCredit = false;
        if (nextValue !== null) {
          next.debit = null;
          next.credit = null;
        }
      }

      if (key === 'debit' || key === 'credit') {
        next.useDebitCredit = (key === 'debit' ? nextValue : next.debit) !== null
          || (key === 'credit' ? nextValue : next.credit) !== null;
        if (next.useDebitCredit) {
          next.amount = null;
        }
      }

      return next;
    });
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void processFile(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFile]);

  if (preview && mapping) {
    const rawSampleRows = preview.rows.slice(0, 5);
    const mappedPreviewRows = mappedState.expenses.slice(0, 6);
    const totalAmount = mappedState.expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
            Step 1
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">
            Map the uploaded fields
          </h2>
          <p className="mt-1 text-sm text-text-muted">
            We pulled a sample of your file so you can tell ABF which columns match your database fields before anything is categorized.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
          <section className="rounded-xl border border-border-primary bg-bg-tertiary/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">Sample data</h3>
                <p className="text-xs text-text-muted">{fileName}</p>
              </div>
              <span className="rounded-full bg-bg-secondary px-3 py-1 text-[11px] text-text-secondary">
                {preview.rows.length} rows found
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border-primary bg-bg-secondary">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-primary bg-bg-tertiary/60 text-left text-text-muted">
                    {preview.headers.map((header, index) => (
                      <th key={`${header}-${index}`} className="px-3 py-2 font-medium">
                        {header || `Column ${index + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rawSampleRows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b border-border-primary/40 last:border-b-0">
                      {preview.headers.map((_, columnIndex) => (
                        <td key={columnIndex} className="px-3 py-2 text-text-secondary">
                          {row[columnIndex] || <span className="text-text-muted">-</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border-primary bg-bg-secondary p-4">
            <h3 className="text-sm font-semibold text-text-primary">Field mapping</h3>
            <p className="mt-1 text-xs text-text-muted">
              Required fields must be mapped before you can continue.
            </p>

            <div className="mt-4 space-y-3">
              {MAPPING_FIELDS.map((field) => (
                <label key={field.key} className="block rounded-lg border border-border-primary bg-bg-tertiary/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-medium text-text-primary">
                      {field.label}
                      {field.required ? <span className="ml-1 text-error">*</span> : null}
                    </span>
                    <select
                      value={mapping[field.key] ?? ''}
                      onChange={(event) => handleMappingChange(field.key, event.target.value)}
                      className="min-w-[150px] rounded-md border border-border-primary bg-bg-secondary px-2.5 py-1.5 text-xs text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/30"
                    >
                      <option value="">Not mapped</option>
                      {preview.headers.map((header, index) => (
                        <option key={`${field.key}-${index}`} value={index}>
                          {header || `Column ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-2 text-[11px] text-text-muted">{field.helper}</p>
                </label>
              ))}
            </div>

            {!hasRequiredImportMapping(mapping) && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-3 text-xs text-warning">
                <LuInfo className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>Map a date column and either a single amount column or debit/credit columns to continue.</span>
              </div>
            )}
          </section>
        </div>

        <section className="rounded-xl border border-border-primary bg-bg-secondary p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Mapped preview</h3>
              <p className="text-xs text-text-muted">This is the cleaned data we will send into the review step.</p>
            </div>
            {mappedState.expenses.length > 0 ? (
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span>{mappedState.expenses.length} mapped rows</span>
                <span className="text-text-muted">|</span>
                <span className="font-medium text-accent-primary">{formatCurrency(totalAmount)}</span>
              </div>
            ) : null}
          </div>

          {mappedState.errorMessage ? (
            <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
              {mappedState.errorMessage}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border-primary">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-primary bg-bg-tertiary/50 text-left text-text-muted">
                    <th className="px-3 py-2 font-medium">Date</th>
                    <th className="px-3 py-2 font-medium">Description</th>
                    <th className="px-3 py-2 font-medium text-right">Amount</th>
                    <th className="px-3 py-2 font-medium">Imported Category</th>
                  </tr>
                </thead>
                <tbody>
                  {mappedPreviewRows.map((expense) => (
                    <tr key={expense.id} className="border-b border-border-primary/40 last:border-b-0">
                      <td className="px-3 py-2 text-text-secondary">{formatDate(expense.date)}</td>
                      <td className="px-3 py-2 text-text-primary">{expense.description}</td>
                      <td className="px-3 py-2 text-right font-mono text-text-primary">{formatCurrency(expense.amount)}</td>
                      <td className="px-3 py-2 text-text-secondary">{expense.originalCategory || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Account selector */}
          <div className="mt-4 rounded-lg border border-border-primary bg-bg-tertiary/40 px-4 py-4">
            <div className="flex items-center gap-2 mb-2">
              <LuCreditCard className="h-3.5 w-3.5 text-accent-primary" />
              <p className="text-xs font-semibold text-text-primary">Which account is this import from?</p>
            </div>
            <p className="text-[11px] text-text-muted mb-3">
              Tag this CSV to a payment account so you can filter expenses by account later.
              Manage accounts in <strong>Settings → Banking Details</strong>.
            </p>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            >
              <option value="">Not specified</option>
              {savedAccounts.map((acct) => (
                <option key={acct.id} value={acct.label}>
                  {acct.label}{acct.last_four ? ` ···· ${acct.last_four}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={() => {
                const tagged = selectedAccount
                  ? mappedState.expenses.map((e) => ({ ...e, accountLabel: selectedAccount }))
                  : mappedState.expenses;
                onComplete(tagged);
              }}
              disabled={mappedState.expenses.length === 0 || !!mappedState.errorMessage}
              className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continue to review
              <LuArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                setPreview(null);
                setMapping(null);
                setError(null);
              }}
              className="rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary"
            >
              Choose a different file
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
          Step 1
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          Upload a file and map the fields
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Start with CSV sample data, map the columns, and confirm the rows before anything reaches a company ledger.
        </p>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 transition-all ${
          isDragging
            ? 'border-accent-primary bg-accent-primary/5'
            : 'border-border-primary bg-bg-secondary hover:border-text-muted'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3 text-center">
          {parsing ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
              <p className="text-sm text-text-secondary">Preparing your upload preview...</p>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-bg-tertiary">
                <LuUpload className={`h-6 w-6 ${isDragging ? 'text-accent-primary' : 'text-text-muted'}`} />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-text-primary">Upload CSV or sample data</h2>
                <p className="mt-1 text-xs text-text-muted">
                  Drag a CSV here, or click to browse. PDFs can still be attached later as supporting files.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
          {error}
        </div>
      ) : null}

      <div className="flex items-center justify-center">
        <button
          onClick={(event) => {
            event.stopPropagation();
            void handleTrySample();
          }}
          disabled={parsing}
          className="inline-flex items-center gap-2 rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-50"
        >
          <LuFlaskConical className="h-3.5 w-3.5" />
          Try sample data
        </button>
      </div>
    </div>
  );
}
