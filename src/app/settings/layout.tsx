'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { LuUser, LuShield, LuUsers, LuChartBar, LuChevronLeft } from 'react-icons/lu';
import { APP_VERSION } from '@/lib/version';

const NAV = [
  { href: '/settings/account', icon: LuUser, label: 'Account' },
  { href: '/settings/team', icon: LuUsers, label: 'Team' },
  { href: '/settings/security', icon: LuShield, label: 'Security' },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-primary">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border-primary bg-bg-secondary px-4 md:px-6">
          <div className="flex items-center gap-2">
            <LuChartBar className="h-5 w-5 text-accent-primary" />
            <span className="text-sm font-semibold text-text-primary hidden md:inline">
              Accountant&apos;s Best Friend
            </span>
          </div>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-text-muted transition-colors hover:text-text-primary"
          >
            <LuChevronLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Link>
        </header>

        <div className="mx-auto max-w-5xl px-4 py-8 md:px-6">
          <h1 className="mb-6 text-2xl font-bold text-text-primary">Settings</h1>
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-44 flex-shrink-0">
              <nav className="flex flex-col gap-1">
                {NAV.map(({ href, icon: Icon, label }) => {
                  const active = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-accent-primary/10 text-accent-primary'
                          : 'text-text-secondary hover:bg-bg-tertiary hover:text-text-primary'
                      }`}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </aside>

            {/* Page content */}
            <main className="min-w-0 flex-1">
              {children}
              <div className="mt-8 text-center text-xs text-text-muted">
                Version {APP_VERSION}
              </div>
            </main>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
