'use client';

import AuthGuard from '@/components/AuthGuard';
import AppFooter from '@/components/AppFooter';
import ExpenseChat from '@/components/ExpenseChat';
import Sidebar from '@/components/Sidebar';
import TopNav from '@/components/TopNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-bg-primary">
        <div className="block">
          <Sidebar />
        </div>

        {/* Right: TopNav + Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <TopNav />
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6">{children}</div>
            <AppFooter />
          </main>
          <ExpenseChat />
        </div>
      </div>
    </AuthGuard>
  );
}
