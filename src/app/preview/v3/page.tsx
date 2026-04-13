'use client';
/**
 * Preview V3 — "Warm Gradient Editorial"
 * Soft warm off-white background, amber/orange accent color, large centered headline,
 * full-width video with rounded corners, testimonial-style trust row, bold CTA.
 * Inspired by: Stripe, Ramp, Gusto
 */
import Link from 'next/link';
import { LuArrowRight, LuUpload, LuSparkles, LuChartBar, LuFileText } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const pillars = [
  { icon: LuUpload, title: 'Import', body: 'CSV from any bank or card. Columns auto-detected.' },
  { icon: LuSparkles, title: 'Categorize', body: 'AI assigns IRS categories. You approve or adjust.' },
  { icon: LuChartBar, title: 'Review', body: 'Dashboards, trends, and monthly breakdowns.' },
  { icon: LuFileText, title: 'Export', body: 'Excel, CSV, QBO — handed off in one click.' },
];

const trust = [
  'MFA & secure sign-in',
  'Role-based team access',
  'Soft-delete & trash recovery',
  'Alladin AI built in',
  'No spreadsheet needed',
];

export default function V3() {
  return (
    <div className="min-h-screen" style={{ background: '#faf9f7' }}>
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-[#e8e4df] bg-[#faf9f7]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-9 w-9" size={400} />
            <span className="text-sm font-semibold text-[#1a1208]">Accountant&apos;s Best Friend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-[#7a6a55] hover:text-[#1a1208] transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-[#7a6a55] hover:text-[#1a1208] transition-colors">Sign In</Link>
            <Link href="/login?mode=signup" className="rounded-xl bg-[#d97706] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b45309] transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Centered Hero */}
        <section className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
          <div className="inline-block rounded-full bg-[#d97706]/10 border border-[#d97706]/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#d97706] mb-7">
            Expense tracking · AI categorization · Export
          </div>
          <h1 className="text-5xl md:text-[4.5rem] font-bold leading-[1.06] tracking-tight text-[#1a1208]">
            Bookkeeping that<br />
            <span style={{ color: '#d97706' }}>actually makes sense.</span>
          </h1>
          <p className="mt-6 text-xl text-[#6b5b45] leading-relaxed max-w-2xl mx-auto">
            Upload your bank statements, let AI do the sorting, and walk into tax season with everything organized.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1a1208] px-8 py-4 text-base font-semibold text-white hover:bg-[#2d2010] transition-colors">
              Get started free <LuArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-2xl border border-[#d5c9bb] bg-white px-8 py-4 text-base font-medium text-[#4a3b28] hover:bg-[#f5f0ea] transition-colors">
              Sign in
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {trust.map((t) => (
              <span key={t} className="text-xs text-[#9a8570] flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#d97706] inline-block" />
                {t}
              </span>
            ))}
          </div>
        </section>

        {/* Full-width Video */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <div className="relative overflow-hidden rounded-3xl border border-[#e0d8cf] shadow-2xl bg-black">
            <video className="w-full block" src="/demo.mp4" autoPlay muted loop playsInline poster="/demo-poster.jpg" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-6 py-5">
              <p className="text-xs text-white/50 uppercase tracking-widest mb-1">See how it works</p>
              <p className="text-sm font-semibold text-white">Import · Organize · Review · Export</p>
            </div>
          </div>
        </section>

        {/* 4-pillar strip */}
        <section className="border-y border-[#e8e4df] bg-white py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {pillars.map((p) => (
                <div key={p.title} className="flex flex-col gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-[#d97706]/10 flex items-center justify-center">
                    <p.icon className="h-5 w-5 text-[#d97706]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1208]">{p.title}</h3>
                  <p className="text-sm text-[#7a6a55] leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center" style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d2010 100%)' }}>
          <h2 className="text-4xl font-bold text-white">Stop chasing receipts.</h2>
          <p className="mt-4 text-[#c4a97d] text-lg">Start closing your books with confidence.</p>
          <Link href="/login?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#d97706] px-9 py-4 text-base font-semibold text-white hover:bg-[#b45309] transition-colors">
            Start free today <LuArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
