'use client';

import Link from 'next/link';
import SiteLogo from '@/components/SiteLogo';
import { APP_VERSION } from '@/lib/version';

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8 border-t border-border-primary bg-bg-secondary/70 px-4 py-6 md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <SiteLogo className="h-6 w-6" size={24} />
          <div>
            <p className="text-sm font-semibold text-text-primary">Accountant&apos;s Best Friend</p>
            <p className="text-xs text-text-muted">Version {APP_VERSION}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-muted">
          <Link href="/dashboard" className="transition-colors hover:text-text-primary">
            Dashboard
          </Link>
          <Link href="/settings/account" className="transition-colors hover:text-text-primary">
            Settings
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-text-primary">
            Privacy Policy
          </Link>
          <Link href="/terms" className="transition-colors hover:text-text-primary">
            Terms of Service
          </Link>
          <Link href="/contact" className="transition-colors hover:text-text-primary">
            Contact
          </Link>
        </nav>
      </div>

      <div className="mt-4 border-t border-border-primary pt-4 text-xs text-text-muted">
        <p>&copy; {year} Accountant&apos;s Best Friend. All rights reserved.</p>
      </div>
    </footer>
  );
}
