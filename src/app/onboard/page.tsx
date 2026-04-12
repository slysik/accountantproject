'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import SiteLogo from '@/components/SiteLogo';

function OnboardForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyName.trim()) return;

    setLoading(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ name: companyName.trim() })
        .eq('created_by_user_id', user.id);

      if (updateError) throw updateError;

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { message?: string }).message ?? 'Failed to update company name.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-primary px-4">
      <div className="w-full max-w-md rounded-2xl border border-border-primary bg-bg-secondary p-8">
        <div className="mb-8 flex flex-col items-center gap-2">
          <SiteLogo className="h-14 w-14" size={56} />
          <h1 className="text-xl font-semibold text-text-primary">Welcome! Set up your account</h1>
          <p className="text-sm text-text-muted">Enter your company name to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-text-secondary">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme LLC"
              required
              className="w-full rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <button
            type="submit"
            disabled={loading || !companyName.trim()}
            className="mt-1 w-full rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function OnboardPage() {
  return (
    <AuthGuard>
      <OnboardForm />
    </AuthGuard>
  );
}
