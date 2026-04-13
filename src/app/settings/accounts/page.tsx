'use client';

import { useCallback, useEffect, useState } from 'react';
import { LuCreditCard, LuPlus, LuTrash2, LuBanknote, LuWallet } from 'react-icons/lu';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useEffectiveAccountUserId } from '@/lib/useEffectiveAccountUserId';

export type PaymentAccountType = 'credit_card' | 'bank' | 'check' | 'other';

export interface PaymentAccount {
  id: string;
  label: string;
  account_type: PaymentAccountType;
  last_four: string | null;
  created_at: string;
}

const ACCOUNT_TYPE_OPTIONS: { value: PaymentAccountType; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card'      },
  { value: 'bank',        label: 'Bank Account'     },
  { value: 'check',       label: 'Checking Account' },
  { value: 'other',       label: 'Other / Misc'     },
];

const TYPE_ICONS: Record<PaymentAccountType, React.ElementType> = {
  credit_card: LuCreditCard,
  bank:        LuBanknote,
  check:       LuBanknote,
  other:       LuWallet,
};

const TYPE_COLORS: Record<PaymentAccountType, string> = {
  credit_card: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  bank:        'bg-accent-primary/10 text-accent-primary',
  check:       'bg-success/10 text-success',
  other:       'bg-bg-tertiary text-text-muted',
};

export default function AccountsSettingsPage() {
  const { user } = useAuth();
  const effectiveUserId = useEffectiveAccountUserId(user?.id, user?.email);

  const [accounts,    setAccounts]    = useState<PaymentAccount[]>([]);
  const [accountId,   setAccountId]   = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [tableExists, setTableExists] = useState(true);

  // Form state
  const [label,    setLabel]    = useState('');
  const [accType,  setAccType]  = useState<PaymentAccountType>('credit_card');
  const [lastFour, setLastFour] = useState('');

  // Resolve account ID
  useEffect(() => {
    if (!user) return;
    supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.account_id) setAccountId(data.account_id as string);
      });
  }, [user]);

  const refresh = useCallback(async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    try {
      const { data, error: fetchErr } = await supabase
        .from('payment_accounts')
        .select('*')
        .eq('user_id', effectiveUserId)
        .order('created_at', { ascending: true });

      if (fetchErr) {
        if (fetchErr.code === '42P01') { // table does not exist
          setTableExists(false);
        } else {
          throw fetchErr;
        }
      } else {
        setAccounts((data ?? []) as PaymentAccount[]);
        setTableExists(true);
      }
    } catch (err) {
      setError((err as Error).message ?? 'Failed to load accounts.');
    } finally {
      setLoading(false);
    }
  }, [effectiveUserId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !effectiveUserId) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { error: insertErr } = await supabase.from('payment_accounts').insert({
        user_id:      effectiveUserId,
        account_id:   accountId,
        label:        label.trim(),
        account_type: accType,
        last_four:    lastFour.trim() || null,
      });
      if (insertErr) throw insertErr;
      setLabel('');
      setLastFour('');
      setAccType('credit_card');
      setSuccess('Account added.');
      await refresh();
    } catch (err) {
      setError((err as Error).message ?? 'Failed to add account.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError('');
    setSuccess('');
    try {
      const { error: delErr } = await supabase.from('payment_accounts').delete().eq('id', id);
      if (delErr) throw delErr;
      setSuccess('Account removed.');
      await refresh();
    } catch (err) {
      setError((err as Error).message ?? 'Failed to remove account.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-center gap-2 mb-1">
          <LuCreditCard className="h-4 w-4 text-accent-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Payment Accounts</h2>
        </div>
        <p className="text-xs text-text-muted mb-5">
          Manage the bank accounts, credit cards, and other payment accounts you use for business expenses.
          When importing a CSV, you&apos;ll be able to tag it to one of these accounts so you always know which statement each expense came from.
        </p>

        {!tableExists && (
          <div className="mb-4 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
            The payment accounts table hasn&apos;t been created yet. Run{' '}
            <code className="font-mono text-xs">scripts/migrations/024_payment_accounts.sql</code>{' '}
            in the Supabase SQL editor to enable this feature.
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-bg-tertiary" />)}
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-text-muted mb-4">No accounts added yet.</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {accounts.map((acct) => {
              const Icon = TYPE_ICONS[acct.account_type];
              return (
                <div key={acct.id} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[acct.account_type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text-primary">
                        {acct.label}
                        {acct.last_four && (
                          <span className="ml-2 text-text-muted font-normal">···· {acct.last_four}</span>
                        )}
                      </p>
                      <p className="text-xs text-text-muted">
                        {ACCOUNT_TYPE_OPTIONS.find((t) => t.value === acct.account_type)?.label}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(acct.id)}
                    disabled={deletingId === acct.id}
                    className="rounded-lg p-2 text-text-muted transition-colors hover:bg-error/10 hover:text-error disabled:opacity-50"
                    title="Remove account"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Add account form */}
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-1 text-sm font-semibold text-text-primary">Add Account</h2>
        <p className="mb-5 text-xs text-text-muted">
          Add a bank account or credit card. The label will appear as a filter option during CSV import.
        </p>

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-text-secondary">Account Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Chase Business Checking, Amex Gold, Petty Cash"
              disabled={!tableExists}
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Account Type</label>
              <select
                value={accType}
                onChange={(e) => setAccType(e.target.value as PaymentAccountType)}
                disabled={!tableExists}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary outline-none focus:border-accent-primary disabled:opacity-50"
              >
                {ACCOUNT_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-sm font-medium text-text-secondary">Last 4 digits</label>
              <input
                type="text"
                value={lastFour}
                onChange={(e) => setLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="Optional"
                maxLength={4}
                disabled={!tableExists}
                className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary text-center placeholder-text-muted outline-none focus:border-accent-primary disabled:opacity-50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || !label.trim() || !tableExists}
            className="flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            <LuPlus className="h-4 w-4" />
            {saving ? 'Adding...' : 'Add Account'}
          </button>
        </form>
      </section>
    </div>
  );
}
