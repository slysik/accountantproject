'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { LuWand, LuFileText, LuTrendingUp } from 'react-icons/lu';

export default function DashboardPage() {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'User';

  return (
    <div className="mx-auto max-w-3xl">
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back, {displayName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          Manage your expenses and keep your books organized.
        </p>
      </div>

      {/* Get Started */}
      <div className="mb-8 rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-3 text-lg font-semibold text-text-primary">
          Get Started
        </h2>
        <p className="mb-4 text-sm text-text-secondary">
          Use the setup wizard to create your first year of folders and import
          expenses from CSV files.
        </p>
        <Link
          href="/dashboard/wizard"
          className="inline-flex items-center gap-2 rounded-lg bg-accent-primary px-4 py-2.5 text-sm font-semibold text-bg-primary transition-colors hover:bg-accent-dark"
        >
          <LuWand className="h-4 w-4" />
          Start Wizard
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-tertiary">
            <LuFileText className="h-5 w-5 text-accent-primary" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-text-primary">
            Recent Activity
          </h3>
          <p className="text-xs text-text-muted">
            No recent activity. Import some expenses to get started.
          </p>
        </div>

        <div className="rounded-xl border border-border-primary bg-bg-secondary p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-bg-tertiary">
            <LuTrendingUp className="h-5 w-5 text-success" />
          </div>
          <h3 className="mb-1 text-sm font-semibold text-text-primary">
            Quick Stats
          </h3>
          <p className="text-xs text-text-muted">
            Add expense data to see your spending breakdown.
          </p>
        </div>
      </div>
    </div>
  );
}
