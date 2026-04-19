'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppFooter from '@/components/AppFooter';
import AuthGuard from '@/components/AuthGuard';
import ExpenseChat from '@/components/ExpenseChat';
import { useAuth } from '@/lib/auth';
import { LuUser, LuShield, LuUsers, LuChevronLeft, LuLayoutDashboard, LuTags, LuCircleHelp, LuClipboardList, LuCreditCard } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';
import { isMasterAdminEmail } from '@/lib/admin';

const BASE_NAV = [
  { href: '/settings/account',  icon: LuUser,        label: 'Spend Details' },
  { href: '/settings/team',     icon: LuUsers,       label: 'Team'      },
  { href: '/settings/security', icon: LuShield,      label: 'Security'  },
  { href: '/settings/accounts', icon: LuCreditCard,  label: 'Banking Details' },
  { href: '/settings/categories', icon: LuTags,      label: 'Categories' },
  { href: '/settings/audit',    icon: LuClipboardList, label: 'Audit'   },
  { href: '/settings/help',     icon: LuCircleHelp,  label: 'Help'      },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { signOut, user } = useAuth();
  const nav = isMasterAdminEmail(user?.email)
    ? [...BASE_NAV, { href: '/settings/admin', icon: LuLayoutDashboard, label: 'Admin' }]
    : BASE_NAV;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-primary">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border-primary bg-bg-secondary px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-error"
            >
              Sign Out
            </button>
            <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <SiteLogo className="h-12 w-12" size={48} />
              <span className="hidden text-sm font-semibold text-text-primary md:inline">
                Accountant&apos;s Best Friend
              </span>
            </Link>
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
                {nav.map(({ href, icon: Icon, label }) => {
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
              <AppFooter />
            </main>
          </div>
        </div>
        <ExpenseChat />
      </div>
    </AuthGuard>
  );
}
