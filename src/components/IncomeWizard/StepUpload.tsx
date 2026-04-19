'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { LuArrowRight, LuFlaskConical, LuInfo, LuUpload } from 'react-icons/lu';
import {
  formatCurrency,
  formatDate,
  hasRequiredImportMapping,
  mapRowsToExpenses,
  parseCSVPreview,
  type ImportColumnMap,
  type ParsedImportPreview,
} from '@/lib/expense-processor';
import type { Income } from '@/types';
import { detectIncomeType } from '@/lib/income-database';

interface StepUploadProps {
  onComplete: (_rows: Income[]) => void;
}

type MappingFieldKey = Exclude<keyof ImportColumnMap, 'useDebitCredit'>;

interface MappingField {
  key: MappingFieldKey;
  label: string;
  required?: boolean;
  helper: string;
}

const MAPPING_FIELDS: MappingField[] = [
  { key: 'date', label: 'Transaction date', required: true, helper: 'Required. Date of the income transaction.' },
  { key: 'description', label: 'Description / payer', helper: 'Who paid or the memo on the deposit.' },
  { key: 'amount', label: 'Net amount', helper: 'Use when your file has a single amount column.' },
  { key: 'debit', label: 'Debit column', helper: 'Use if your file splits debit/credit into separate columns.' },
  { key: 'credit', label: 'Credit / income', helper: 'The income/credit column if split.' },
  { key: 'category', label: 'Imported category', helper: 'Optional bank-provided category.' },
];

const SAMPLE_CSV = `Date,Description,Amount
01/05/2026,CHECK #1042 - ACME CORP,2500.00
01/12/2026,ACH DEPOSIT STRIPE TRANSFER,1800.00
01/18/2026,WIRE TRANSFER - CLIENT PAYMENT,5000.00
01/22/2026,CASH DEPOSIT,350.00
01/28/2026,SQUARE PAYMENT - INVOICE 204,975.00`;

function rewriteSampleYear(csvText: string): string {
  const y = new Date().getFullYear();
  return csvText.replace(/(\b\d{1,2}\/\d{1,2}\/)\d{4}\b/g, `$1${y}`);
}

export default function IncomeStepUpload({ onComplete }: StepUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedImportPreview | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMap>({
    date: null, description: null, amount: null,
    debit: null, credit: null, category: null, useDebitCredit: false,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSample, setIsSample] = useState(false);

  const handleFile = useCallback((file: File) => {
    setError('');
    setIsSample(false);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const parsed = parseCSVPreview(text);
        setPreview(parsed);
        setMapping(parsed.suggestedMapping);
      } catch {
        setError('Could not parse CSV. Make sure it has headers and comma-separated values.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const loadSample = useCallback(() => {
    setError('');
    setIsSample(true);
    const text = rewriteSampleYear(SAMPLE_CSV);
    const parsed = parseCSVPreview(text);
    setPreview({ ...parsed, filename: 'sample_income.csv' });
    setMapping(parsed.suggestedMapping);
  }, []);

  const hasMapping = useMemo(() => hasRequiredImportMapping(mapping), [mapping]);

  const handleContinue = useCallback(() => {
    if (!preview || !hasMapping) return;
    setLoading(true);

    const expenses = mapRowsToExpenses(preview.rows, mapping, preview.filename ?? 'income.csv');

    const rows: Income[] = expenses
      .filter((e) => e.amount > 0)
      .map((e) => ({
        companyName: '',
        year: e.month.slice(0, 4),
        month: e.month,
        date: typeof e.date === 'string' ? e.date : formatDate(e.date),
        description: e.description,
        amount: e.amount,
        incomeType: detectIncomeType(e.description),
        source: '',
        filename: e.filename,
        rawData: e.rawData,
      }));

    setLoading(false);
    onComplete(rows);
  }, [preview, mapping, hasMapping, onComplete]);

  return (
    <div className="flex flex-col gap-6">
      {/* Drop zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border-primary bg-bg-secondary/60 px-6 py-14 text-center transition-colors hover:border-accent-primary/50"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-primary/10">
            <LuUpload className="h-6 w-6 text-accent-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Drop your income CSV here</p>
            <p className="mt-1 text-xs text-text-muted">Bank statements, payment processor exports, invoice reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-full bg-accent-primary px-5 py-2 text-sm font-semibold text-bg-primary hover:bg-accent-dark"
            >
              Choose file
            </button>
            <button
              onClick={loadSample}
              className="flex items-center gap-1.5 rounded-full border border-border-primary bg-bg-primary px-5 py-2 text-sm font-medium text-text-secondary hover:bg-bg-secondary"
            >
              <LuFlaskConical className="h-3.5 w-3.5" />
              Try sample
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
      )}

      {/* Mapping UI */}
      {preview && (
        <div className="flex flex-col gap-5">
          {isSample && (
            <div className="flex items-center gap-2 rounded-lg border border-accent-primary/20 bg-accent-primary/8 px-4 py-3">
              <LuInfo className="h-4 w-4 flex-shrink-0 text-accent-primary" />
              <p className="text-xs text-text-secondary">Using sample income data — columns are pre-mapped for you.</p>
            </div>
          )}

          <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-text-muted">Map columns</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {MAPPING_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1 block text-xs font-medium text-text-secondary">
                    {field.label} {field.required && <span className="text-error">*</span>}
                  </label>
                  <select
                    value={mapping[field.key] ?? ''}
                    onChange={(e) => setMapping((m) => ({ ...m, [field.key]: e.target.value || null }))}
                    className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
                  >
                    <option value="">— not mapped —</option>
                    {preview.headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <p className="mt-0.5 text-[11px] text-text-muted">{field.helper}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Preview rows */}
          <div className="rounded-xl border border-border-primary bg-bg-secondary">
            <div className="border-b border-border-primary px-4 py-3">
              <p className="text-xs font-semibold text-text-primary">Preview — {preview.filename}</p>
              <p className="text-xs text-text-muted">{preview.rows.length} rows detected</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-primary">
                    {preview.headers.map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium text-text-muted">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-border-primary/40 last:border-0">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2 text-text-secondary">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => { setPreview(null); setIsSample(false); }} className="text-xs text-text-muted hover:text-text-secondary">
              ← Use a different file
            </button>
            <button
              disabled={!hasMapping || loading}
              onClick={handleContinue}
              className="inline-flex items-center gap-2 rounded-full bg-accent-primary px-6 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark disabled:opacity-40"
            >
              {loading ? 'Processing…' : 'Continue to review'}
              <LuArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
