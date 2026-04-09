'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { LuBookOpen, LuCheck, LuFileSpreadsheet, LuFileText, LuSave } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { createAuditEvent } from '@/lib/audit';
import { bulkCreateExpenses, getUserFolders } from '@/lib/database';
import { aggregateByMonthAndCategory, formatCurrency, getSummary } from '@/lib/expense-processor';
import { generateCSV, generateExcelReport, generateYearlySummaryCSV } from '@/lib/export';
import { generateQBOFile } from '@/lib/qbo-export';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';
import type { CategorizedExpense } from '@/types';

interface StepCommitProps {
  expenses: CategorizedExpense[];
}

export default function StepCommit({ expenses }: StepCommitProps) {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);
  const [companyName, setCompanyName] = useState('');
  const [existingCompanies, setExistingCompanies] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [includeYearlySummary, setIncludeYearlySummary] = useState(false);

  useEffect(() => {
    if (!effectiveUserId) return;
    const ownerUserId = effectiveUserId;

    let cancelled = false;

    async function loadCompanies() {
      try {
        const folders = await getUserFolders(ownerUserId);
        if (cancelled) return;

        const names = folders.map((folder) => folder.companyName).sort((left, right) => left.localeCompare(right));
        setExistingCompanies(names);
        if (names.length > 0) {
          setCompanyName((current) => current || names[0]);
        }
      } catch (err) {
        console.error('Failed to load company suggestions:', err);
      }
    }

    void loadCompanies();

    return () => {
      cancelled = true;
    };
  }, [effectiveUserId]);

  const years = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.year ?? expense.month.slice(0, 4)))).sort(),
    [expenses]
  );
  const totalAmount = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses]
  );
  const sourceFiles = useMemo(
    () => Array.from(new Set(expenses.map((expense) => expense.filename).filter(Boolean))),
    [expenses]
  );

  const downloadTextFile = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, []);

  const handleExportExcel = useCallback(() => {
    const aggregation = aggregateByMonthAndCategory(expenses);
    const summary = getSummary(expenses);
    generateExcelReport(expenses, aggregation, summary, { includeYearlySummary });
  }, [expenses, includeYearlySummary]);

  const handleExportCSV = useCallback(() => {
    const range = years.length > 0 ? `${years[0]}_to_${years[years.length - 1]}` : 'transactions';
    downloadTextFile(
      generateCSV(expenses, { includeYearlySummary }),
      `expenses_${range}.csv`,
      'text/csv;charset=utf-8;'
    );
  }, [downloadTextFile, expenses, includeYearlySummary, years]);

  const handleExportQBO = useCallback(() => {
    const { content, filename } = generateQBOFile(expenses);
    downloadTextFile(content, filename, 'application/x-ofx');
    if (includeYearlySummary) {
      downloadTextFile(
        generateYearlySummaryCSV(expenses),
        filename.replace(/\.qbo$/i, '_yearly_summary.csv'),
        'text/csv;charset=utf-8;'
      );
    }
  }, [downloadTextFile, expenses, includeYearlySummary]);

  const handleCommit = useCallback(async () => {
    if (!user?.email || !effectiveUserId) return;

    const normalizedCompany = companyName.trim();
    if (!normalizedCompany) {
      setError('Choose a company name before saving the import.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const insertedCount = await bulkCreateExpenses(effectiveUserId, normalizedCompany, expenses);
      setSaved(true);
      setSavedCount(insertedCount);

      try {
        await createAuditEvent({
          ownerUserId: effectiveUserId,
          actorUserId: user.id,
          actorEmail: user.email,
          companyName: normalizedCompany,
          eventType: 'import',
          eventTitle: `Imported ${insertedCount} transactions into ${normalizedCompany}`,
          details: {
            submitted_rows: expenses.length,
            inserted_rows: insertedCount,
            years,
            source_files: sourceFiles,
          },
        });
      } catch (auditError) {
        console.error('Failed to write import audit event:', auditError);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to commit the entries.');
    } finally {
      setSaving(false);
    }
  }, [companyName, effectiveUserId, expenses, sourceFiles, user, years]);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
          Step 4
        </p>
        <h2 className="mt-2 text-lg font-semibold text-text-primary">
          Commit these entries to a company
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Categories are ready. Confirm the company, then decide whether you want to commit the entries into the ledger.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border-primary bg-bg-tertiary/30 p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Entries</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{expenses.length}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-tertiary/30 p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Amount</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{formatCurrency(totalAmount)}</p>
        </div>
        <div className="rounded-xl border border-border-primary bg-bg-tertiary/30 p-4">
          <p className="text-xs uppercase tracking-wide text-text-muted">Years</p>
          <p className="mt-2 text-2xl font-semibold text-text-primary">{years.join(', ') || 'N/A'}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <label className="block">
          <span className="text-xs font-medium text-text-primary">Company destination</span>
          <input
            list="wizard-company-suggestions"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            placeholder="Type an existing company or create a new one"
            className="mt-2 w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none transition-colors focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/30"
          />
          <datalist id="wizard-company-suggestions">
            {existingCompanies.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </label>

        <label className="mt-4 flex items-start gap-2 rounded-lg border border-border-primary bg-bg-tertiary/30 p-3 text-[11px] text-text-secondary">
          <input
            type="checkbox"
            checked={includeYearlySummary}
            onChange={(event) => setIncludeYearlySummary(event.target.checked)}
            className="mt-0.5 rounded border-border-primary bg-bg-tertiary text-accent-primary focus:ring-accent-primary"
          />
          <span>Include a year-by-year summary in exports after the import is committed.</span>
        </label>

        {error ? (
          <div className="mt-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-xs text-error">
            {error}
          </div>
        ) : null}

        {saved ? (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-success/20 bg-success/10 px-4 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <LuCheck className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold text-success">
                {savedCount} entries committed to {companyName}
              </p>
              <p className="mt-1 text-xs text-text-muted">
                {savedCount < expenses.length
                  ? 'Some rows were skipped because matching transactions were already in the ledger.'
                  : 'All selected rows were saved and year folders were created automatically.'}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleCommit}
            disabled={saving || !companyName.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2 text-xs font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <LuSave className="h-3.5 w-3.5" />
            {saving ? 'Committing...' : 'Yes, commit entries to company'}
          </button>
          <p className="text-xs text-text-muted">The audit log will record who committed the import.</p>
        </div>
      </div>

      <div className="rounded-xl border border-border-primary bg-bg-secondary p-4">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-text-primary">Optional exports</h3>
          <p className="mt-1 text-xs text-text-muted">Download the reviewed set before or after saving it.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <button
            onClick={handleExportExcel}
            className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-4 transition-colors hover:border-accent-primary"
          >
            <LuFileSpreadsheet className="h-7 w-7 text-success" />
            <span className="text-xs font-semibold text-text-primary">Excel</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-4 transition-colors hover:border-accent-primary"
          >
            <LuFileText className="h-7 w-7 text-accent-primary" />
            <span className="text-xs font-semibold text-text-primary">CSV</span>
          </button>
          <button
            onClick={handleExportQBO}
            className="flex flex-col items-center gap-2 rounded-lg border border-border-primary bg-bg-tertiary p-4 transition-colors hover:border-accent-primary"
          >
            <LuBookOpen className="h-7 w-7 text-accent-primary" />
            <span className="text-xs font-semibold text-text-primary">QBO</span>
          </button>
        </div>
      </div>
    </div>
  );
}
