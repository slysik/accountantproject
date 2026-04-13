'use client';
/**
 * Preview V1 — "Dark Command Center"
 * Deep dark background, electric blue/cyan gradient accents, large bold headline,
 * product video centered below hero, metric stats row, feature grid.
 * Inspired by: Linear, Vercel, Raycast
 */
import Link from 'next/link';
import { LuArrowRight, LuCheck, LuBot, LuUpload, LuChartBar, LuFileSpreadsheet, LuReceipt, LuShield } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const stats = [
  { value: '30+', label: 'IRS categories' },
  { value: 'CSV', label: 'One-click import' },
  { value: 'AI', label: 'Auto-categorize' },
  { value: 'QBO', label: 'Export formats' },
];

const features = [
  { icon: LuUpload, title: 'Bank CSV Import', body: 'Upload any bank or card export. We map the columns, you confirm.' },
  { icon: LuChartBar, title: 'Live Dashboards', body: 'Category totals, monthly trends, and year-over-year charts.' },
  { icon: LuBot, title: 'Alladin AI', body: 'Ask plain-English questions. Get instant answers from your data.' },
  { icon: LuReceipt, title: 'Receipt Attachments', body: 'Attach PDFs and images directly to each transaction.' },
  { icon: LuFileSpreadsheet, title: 'Export Anywhere', body: 'CSV, Excel, and QBO — ready for your accountant.' },
  { icon: LuShield, title: 'Secure Access', body: 'MFA, role-based permissions, and invite-only team access.' },
];

export default function V1() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-[#0a0a0f]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-10 w-10" size={400} />
            <span className="text-sm font-semibold text-white">Accountant&apos;s Best Friend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors">Sign In</Link>
            <Link href="/login?mode=signup" className="rounded-lg bg-[#3b82f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-5xl px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#3b82f6]/30 bg-[#3b82f6]/10 px-4 py-1.5 text-xs font-medium text-[#60a5fa] mb-8">
            Bookkeeping for modern businesses
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight">
            Your finances,{' '}
            <span className="bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] bg-clip-text text-transparent">
              finally organized.
            </span>
          </h1>
          <p className="mt-6 text-lg text-white/50 max-w-2xl mx-auto leading-relaxed">
            Import bank statements, auto-categorize expenses with AI, and export clean reports — without a single spreadsheet.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#2563eb] transition-colors">
              Get started free <LuArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-7 py-3.5 text-sm font-medium text-white/70 hover:border-white/20 hover:text-white transition-colors">
              View pricing
            </Link>
          </div>
        </section>

        {/* Stats */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 rounded-2xl overflow-hidden border border-white/8">
            {stats.map((s) => (
              <div key={s.label} className="bg-[#0f0f18] px-6 py-6 text-center">
                <p className="text-3xl font-bold text-white">{s.value}</p>
                <p className="mt-1 text-xs text-white/40 uppercase tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Video */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_80px_rgba(59,130,246,0.15)]">
            <video className="w-full block" src="/demo.mp4" autoPlay muted loop playsInline poster="/demo-poster.jpg" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-6 py-5">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Live walkthrough</p>
              <p className="text-sm font-semibold text-white">Import · Categorize · Review · Export</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-6 pb-24">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#60a5fa] mb-4 text-center">Features</p>
          <h2 className="text-3xl font-bold text-center mb-12">Everything your books need</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-white/8 bg-[#0f0f18] p-6 hover:border-white/16 transition-colors">
                <div className="h-10 w-10 rounded-xl bg-[#3b82f6]/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-[#60a5fa]" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 pb-24 text-center">
          <div className="rounded-3xl border border-white/8 bg-gradient-to-b from-[#3b82f6]/10 to-transparent p-12">
            <h2 className="text-3xl font-bold">Ready to close your books?</h2>
            <p className="mt-4 text-white/50">Start free. No credit card required.</p>
            <Link href="/login?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#3b82f6] px-8 py-4 text-base font-semibold text-white hover:bg-[#2563eb] transition-colors">
              Start for free <LuArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
