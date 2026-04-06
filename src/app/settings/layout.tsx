'use client';

import AuthGuard from '@/components/AuthGuard';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-bg-primary p-6">{children}</div>
    </AuthGuard>
  );
}
