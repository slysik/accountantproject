import { supabase } from './supabase';
import { getUserAccountId } from './database';
import type { Income, IncomeType } from '@/types';

// ── Type detection ──────────────────────────────────────────────────────────

const INCOME_TYPE_PATTERNS: Array<{ type: IncomeType; patterns: RegExp[] }> = [
  {
    type: 'check',
    patterns: [/\bCHECK\b/i, /\bCHK\b/i, /\bCK\b/i, /CHECK\s*#/i, /\bPAPER\s*CHECK\b/i],
  },
  {
    type: 'bank_deposit',
    patterns: [
      /\bDEPOSIT\b/i, /\bDEP\b/i, /\bACH\b/i, /\bWIRE\b/i,
      /\bDIRECT\s*DEP/i, /\bBANK\s*TRANSFER\b/i, /\bZELLE\b/i,
      /\bVENMO\b/i, /\bPAYPAL\b/i, /\bTRANSFER\b/i,
    ],
  },
  {
    type: 'cash',
    patterns: [/\bCASH\b/i, /\bCASH\s*DEP/i, /\bCASH\s*PAYMENT\b/i],
  },
  {
    type: 'credit',
    patterns: [
      /\bCREDIT\b/i, /\bPAYMENT\b/i, /\bPMNT\b/i, /\bPYMT\b/i,
      /\bMERCHANT\b/i, /\bSQUARE\b/i, /\bSTRIPE\b/i,
      /\bSALES\s*RECEIPT\b/i, /\bINVOICE\b/i,
    ],
  },
];

export function detectIncomeType(description: string): IncomeType {
  for (const { type, patterns } of INCOME_TYPE_PATTERNS) {
    if (patterns.some((p) => p.test(description))) return type;
  }
  return 'other';
}

export const INCOME_TYPE_LABELS: Record<IncomeType, string> = {
  check: 'Check',
  bank_deposit: 'Bank Deposit / ACH / Wire',
  cash: 'Cash',
  credit: 'Credit / Card Payment',
  other: 'Other',
};

// ── Database functions ──────────────────────────────────────────────────────

function rowToIncome(row: Record<string, unknown>): Income {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    accountId: row.account_id as string | undefined,
    companyName: row.company_name as string,
    year: row.year as string,
    month: row.month as string,
    date: row.date as string,
    description: row.description as string,
    amount: Number(row.amount),
    incomeType: (row.income_type as IncomeType) ?? 'other',
    source: (row.source as string) ?? '',
    filename: (row.filename as string) ?? '',
    rawData: (row.raw_data as string[]) ?? [],
    paymentMethod: row.payment_method as string | undefined,
    notes: row.notes as string | undefined,
    deletedAt: row.deleted_at ? new Date(row.deleted_at as string) : null,
  };
}

export async function bulkCreateIncome(
  userId: string,
  incomeRows: Income[]
): Promise<void> {
  if (incomeRows.length === 0) return;
  const accountId = await getUserAccountId(userId);

  const rows = incomeRows.map((inc) => {
    const row: Record<string, unknown> = {
      user_id: userId,
      company_name: inc.companyName,
      year: inc.year,
      month: inc.month,
      date: inc.date,
      description: inc.description,
      amount: inc.amount,
      income_type: inc.incomeType,
      source: inc.source ?? '',
      filename: inc.filename,
      raw_data: inc.rawData,
      deleted_at: null,
    };
    if (accountId) row.account_id = accountId;
    if (inc.paymentMethod) row.payment_method = inc.paymentMethod;
    if (inc.notes) row.notes = inc.notes;
    return row;
  });

  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await supabase.from('income').insert(rows.slice(i, i + CHUNK));
    if (error) throw error;
  }
}

export async function getAllIncome(userId: string): Promise<Income[]> {
  const accountId = await getUserAccountId(userId);
  let query = supabase
    .from('income')
    .select('*')
    .is('deleted_at', null)
    .order('date', { ascending: false });
  query = accountId ? query.eq('account_id', accountId) : query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToIncome);
}

export async function getIncomeByCompany(
  userId: string,
  companyName: string
): Promise<Income[]> {
  const accountId = await getUserAccountId(userId);
  let query = supabase
    .from('income')
    .select('*')
    .eq('company_name', companyName)
    .is('deleted_at', null)
    .order('date', { ascending: false });
  query = accountId ? query.eq('account_id', accountId) : query.eq('user_id', userId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(rowToIncome);
}
