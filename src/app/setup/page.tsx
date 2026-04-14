'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { addAccountMember } from '@/lib/subscription';
import AuthGuard from '@/components/AuthGuard';
import SiteLogo from '@/components/SiteLogo';
import {
  LuBuilding2, LuCreditCard, LuUpload, LuTrendingUp, LuUsers,
  LuCheck, LuPlus, LuTrash2, LuArrowRight,
} from 'react-icons/lu';

type PaymentAccountType = 'credit_card' | 'bank' | 'check';
type TeamRole = 'contributor' | 'admin' | 'viewer';

interface PaymentAccount {
  id: string;
  label: string;
  type: PaymentAccountType;
  lastFour: string;
}

interface TeamInvite {
  email: string;
  role: TeamRole;
}

const STEPS = [
  { label: 'Account',  icon: LuBuilding2   },
  { label: 'Payments', icon: LuCreditCard  },
  { label: 'Expenses', icon: LuUpload      },
  { label: 'Sales',    icon: LuTrendingUp  },
  { label: 'Team',     icon: LuUsers       },
];

const ACCOUNT_TYPES: { value: PaymentAccountType; label: string }[] = [
  { value: 'credit_card', label: 'Credit Card'       },
  { value: 'bank',        label: 'Bank Account'      },
  { value: 'check',       label: 'Checking Account'  },
];

const ROLE_LABELS: Record<TeamRole, string> = {
  admin:       'Admin',
  contributor: 'Contributor',
  viewer:      'Viewer',
};

const ROLE_DESCRIPTIONS: Record<TeamRole, string> = {
  admin:       'Full access — can manage team, companies, and expenses.',
  contributor: 'Can add and edit companies and expenses.',
  viewer:      'Read-only. Cannot make changes.',
};

function StepIndicator({ step }: { step: number }) {
  return (
    <div className="mb-8 flex items-center justify-center">
      {STEPS.map((s, i) => {
        const isActive    = i === step;
        const isCompleted = i < step;
        return (
          <div key={s.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                isActive    ? 'bg-accent-primary text-bg-primary' :
                isCompleted ? 'bg-success text-bg-primary'        :
                              'bg-bg-tertiary text-text-muted'
              }`}>
                {isCompleted ? (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (i + 1)}
              </div>
              <span className={`mt-1 text-[10px] font-medium ${
                isActive    ? 'text-accent-primary' :
                isCompleted ? 'text-success'        :
                              'text-text-muted'
              }`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 mb-4 h-0.5 w-10 rounded-full transition-colors ${
                i < step ? 'bg-success' : 'bg-bg-tertiary'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function SetupWizard() {
  const { user } = useAuth();
  const router   = useRouter();

  const [step,      setStep]      = useState(0);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Step 1
  const [accountName,   setAccountName]   = useState('');
  const [step1Loading,  setStep1Loading]  = useState(false);
  const [step1Error,    setStep1Error]    = useState('');

  // Step 2
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [newPayLabel,     setNewPayLabel]     = useState('');
  const [newPayType,      setNewPayType]      = useState<PaymentAccountType>('credit_card');
  const [newPayLastFour,  setNewPayLastFour]  = useState('');
  const [step2Loading,    setStep2Loading]    = useState(false);

  // Step 5
  const [inviteEmail,  setInviteEmail]  = useState('');
  const [inviteRole,   setInviteRole]   = useState<TeamRole>('contributor');
  const [teamInvites,  setTeamInvites]  = useState<TeamInvite[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError,  setInviteError]  = useState('');

  // Resolve account ID on mount
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

  // ── Step 1: Save account name ────────────────────────────────────────────
  const handleStep1 = async () => {
    if (!user || !accountName.trim()) return;
    setStep1Loading(true);
    setStep1Error('');
    try {
      const query = accountId
        ? supabase.from('accounts').update({ name: accountName.trim() }).eq('id', accountId)
        : supabase.from('accounts').update({ name: accountName.trim() }).eq('created_by_user_id', user.id);
      const { error } = await query;
      if (error) throw error;
      setStep(1);
    } catch (err: unknown) {
      setStep1Error((err as { message?: string }).message ?? 'Failed to save account name.');
    } finally {
      setStep1Loading(false);
    }
  };

  // ── Step 2: Payment account helpers ─────────────────────────────────────
  const handleAddPayment = () => {
    if (!newPayLabel.trim()) return;
    setPaymentAccounts((prev) => [
      ...prev,
      { id: crypto.randomUUID(), label: newPayLabel.trim(), type: newPayType, lastFour: newPayLastFour.trim() },
    ]);
    setNewPayLabel('');
    setNewPayLastFour('');
  };

  const handleStep2 = async () => {
    if (!user) return;
    setStep2Loading(true);
    try {
      if (paymentAccounts.length > 0) {
        const rows = paymentAccounts.map((a) => ({
          user_id:      user.id,
          account_id:   accountId,
          label:        a.label,
          account_type: a.type,
          last_four:    a.lastFour || null,
        }));
        // Graceful — payment_accounts table requires migration 024
        await supabase.from('payment_accounts').insert(rows);
      }
    } catch {
      // Continue even if table doesn't exist yet
    } finally {
      setStep2Loading(false);
      setStep(2);
    }
  };

  // ── Step 5: Invite team member ───────────────────────────────────────────
  const handleInvite = async () => {
    if (!user || !inviteEmail.trim() || !accountId) return;
    const trimmed = inviteEmail.trim().toLowerCase();
    if (trimmed === user.email?.toLowerCase()) {
      setInviteError("You can't add yourself.");
      return;
    }
    if (teamInvites.some((i) => i.email === trimmed)) {
      setInviteError('Already added.');
      return;
    }
    setInviteLoading(true);
    setInviteError('');
    try {
      await addAccountMember(user.id, trimmed, user.email ?? '', inviteRole, accountId);
      setTeamInvites((prev) => [...prev, { email: trimmed, role: inviteRole }]);
      setInviteEmail('');
      setInviteRole('contributor');
    } catch (err: unknown) {
      setInviteError((err as { message?: string }).message ?? 'Failed to send invite.');
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header */}
      <header className="border-b border-border-primary px-6 py-4 flex items-center gap-3">
        <SiteLogo className="h-8 w-8" size={32} />
        <span className="text-sm font-semibold text-text-primary">Accountant&apos;s Best Friend</span>
        <span className="ml-auto text-xs text-text-muted">Setup · Step {step + 1} of {STEPS.length}</span>
      </header>

      <div className="flex-1 flex flex-col items-center px-4 py-10">
        <div className="w-full max-w-xl">
          <StepIndicator step={step} />

          <div className="rounded-xl border border-border-primary bg-bg-secondary p-6">

            {/* ── Step 1: Account Identity ── */}
            {step === 0 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LuBuilding2 className="h-5 w-5 text-accent-primary" />
                    <h2 className="text-base font-semibold text-text-primary">Name your account</h2>
                  </div>
                  <p className="text-sm text-text-muted">This is typically your business or practice name. You can change it later in Settings.</p>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Account / Company Name</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStep1()}
                    placeholder="Acme LLC"
                    autoFocus
                    className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                  />
                </div>
                {step1Error && <p className="text-sm text-error">{step1Error}</p>}
                <button
                  onClick={handleStep1}
                  disabled={step1Loading || !accountName.trim()}
                  className="w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
                >
                  {step1Loading ? 'Saving...' : 'Continue'}
                </button>
              </div>
            )}

            {/* ── Step 2: Banking Details ── */}
            {step === 1 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LuCreditCard className="h-5 w-5 text-accent-primary" />
                    <h2 className="text-base font-semibold text-text-primary">Add banking details</h2>
                  </div>
                  <p className="text-sm text-text-muted">Add the bank accounts and credit cards you use for business expenses. These become labels when you import CSV statements.</p>
                </div>

                {paymentAccounts.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {paymentAccounts.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-text-primary">
                            {a.label}{a.lastFour && <span className="text-text-muted"> ···· {a.lastFour}</span>}
                          </p>
                          <p className="text-xs text-text-muted">{ACCOUNT_TYPES.find((t) => t.value === a.type)?.label}</p>
                        </div>
                        <button
                          onClick={() => setPaymentAccounts((prev) => prev.filter((x) => x.id !== a.id))}
                          className="rounded p-1 text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="rounded-lg border border-border-primary bg-bg-tertiary p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">Add an account</p>
                  <input
                    type="text"
                    value={newPayLabel}
                    onChange={(e) => setNewPayLabel(e.target.value)}
                    placeholder="e.g. Chase Business Checking, Amex Gold"
                    className="w-full rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                  />
                  <div className="flex gap-2">
                    <select
                      value={newPayType}
                      onChange={(e) => setNewPayType(e.target.value as PaymentAccountType)}
                      className="flex-1 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={newPayLastFour}
                      onChange={(e) => setNewPayLastFour(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="Last 4"
                      maxLength={4}
                      className="w-20 rounded-lg border border-border-primary bg-bg-secondary px-3 py-2 text-sm text-text-primary text-center outline-none focus:border-accent-primary"
                    />
                    <button
                      onClick={handleAddPayment}
                      disabled={!newPayLabel.trim()}
                      className="flex items-center gap-1 rounded-lg bg-accent-primary px-3 py-2 text-sm font-semibold text-bg-primary hover:bg-accent-dark disabled:opacity-50 transition-colors"
                    >
                      <LuPlus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    onClick={handleStep2}
                    disabled={step2Loading}
                    className="flex-1 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
                  >
                    {step2Loading ? 'Saving...' : paymentAccounts.length > 0 ? `Continue (${paymentAccounts.length} added)` : 'Continue'}
                  </button>
                </div>
              </div>
            )}

            {/* ── Step 3: Expense Import ── */}
            {step === 2 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LuUpload className="h-5 w-5 text-accent-primary" />
                    <h2 className="text-base font-semibold text-text-primary">Import your expenses</h2>
                  </div>
                  <p className="text-sm text-text-muted">Upload a CSV export from your bank or credit card. The import wizard maps columns, runs AI categorization, and commits entries to a company folder.</p>
                </div>

                <div className="rounded-lg border border-border-primary bg-bg-tertiary p-5 flex flex-col gap-4">
                  <ul className="flex flex-col gap-2">
                    {['Upload a CSV from any bank or card issuer', 'Map columns and preview entries before saving', 'AI assigns IRS expense categories', 'Commit to a company folder'].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                        <LuCheck className="h-4 w-4 text-accent-primary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push('/dashboard/wizard')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark transition-colors"
                  >
                    Launch import wizard <LuArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setStep(3)}
                  className="w-full rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  Skip — I&apos;ll import later
                </button>
              </div>
            )}

            {/* ── Step 4: Sales / Income Import ── */}
            {step === 3 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LuTrendingUp className="h-5 w-5 text-accent-primary" />
                    <h2 className="text-base font-semibold text-text-primary">
                      Import sales or income
                      <span className="ml-2 text-xs font-normal text-text-muted">optional</span>
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted">If you have a bank statement with income or credit entries, upload it here. ABF will identify credit transactions and organize them as sales or income.</p>
                </div>

                <div className="rounded-lg border border-border-primary bg-bg-tertiary p-5 flex flex-col gap-4">
                  <ul className="flex flex-col gap-2">
                    {['Upload any bank statement CSV', 'Credits are flagged as income or sales entries', 'Optionally tag by bank account last 4 digits', 'Organized separately from expense transactions'].map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-text-secondary">
                        <LuCheck className="h-4 w-4 text-accent-primary flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => router.push('/dashboard/wizard?mode=sales')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark transition-colors"
                  >
                    Import sales data <LuArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <button
                  onClick={() => setStep(4)}
                  className="w-full rounded-lg border border-border-primary px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
                >
                  Skip — not applicable
                </button>
              </div>
            )}

            {/* ── Step 5: Team Access ── */}
            {step === 4 && (
              <div className="flex flex-col gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <LuUsers className="h-5 w-5 text-accent-primary" />
                    <h2 className="text-base font-semibold text-text-primary">Invite your team</h2>
                  </div>
                  <p className="text-sm text-text-muted">Add your accountant, bookkeeper, or colleagues. They&apos;ll receive an invitation email. Manage access anytime in Settings → Team.</p>
                </div>

                {/* Role legend */}
                <div className="rounded-lg bg-bg-tertiary p-3 flex flex-col gap-2">
                  {(Object.keys(ROLE_LABELS) as TeamRole[]).map((role) => (
                    <div key={role} className="flex items-start gap-2 text-xs">
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 font-medium ${
                        role === 'admin'       ? 'bg-accent-primary/10 text-accent-primary' :
                        role === 'contributor' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                'bg-bg-secondary text-text-muted'
                      }`}>{ROLE_LABELS[role]}</span>
                      <span className="mt-0.5 text-text-muted">{ROLE_DESCRIPTIONS[role]}</span>
                    </div>
                  ))}
                </div>

                {/* Sent invites */}
                {teamInvites.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {teamInvites.map((inv) => (
                      <div key={inv.email} className="flex items-center justify-between rounded-lg bg-bg-tertiary px-3 py-2.5">
                        <div>
                          <p className="text-sm font-medium text-text-primary">{inv.email}</p>
                          <p className="text-xs text-text-muted">{ROLE_LABELS[inv.role]} · Invitation sent</p>
                        </div>
                        <LuCheck className="h-4 w-4 text-success flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Invite form */}
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                      placeholder="colleague@example.com"
                      className="flex-1 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                    />
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                      className="rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-sm text-text-primary outline-none focus:border-accent-primary"
                    >
                      <option value="contributor">Contributor</option>
                      <option value="admin">Admin</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={handleInvite}
                      disabled={inviteLoading || !inviteEmail.trim()}
                      className="flex items-center gap-1 rounded-lg bg-accent-primary px-3 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark disabled:opacity-50 transition-colors"
                    >
                      <LuPlus className="h-4 w-4" />
                      {inviteLoading ? '...' : 'Invite'}
                    </button>
                  </div>
                  {inviteError && <p className="text-sm text-error">{inviteError}</p>}
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary hover:bg-accent-dark transition-colors"
                >
                  {teamInvites.length > 0 ? 'Continue to Dashboard' : 'Go to Dashboard'} <LuArrowRight className="h-4 w-4" />
                </button>
                {teamInvites.length === 0 && (
                  <p className="text-center text-xs text-text-muted">You can add team members later in Settings → Team.</p>
                )}
              </div>
            )}
          </div>

          {/* Back */}
          {step > 0 && step < 4 && (
            <div className="mt-4">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="rounded-lg border border-border-primary px-4 py-2 text-xs font-medium text-text-secondary hover:bg-bg-tertiary transition-colors"
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <AuthGuard>
      <SetupWizard />
    </AuthGuard>
  );
}
