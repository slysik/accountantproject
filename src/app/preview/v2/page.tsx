'use client';
/**
 * Preview V2 — "Clean White Editorial"
 * Crisp white background, large serif-style headline, muted green accent,
 * split hero (text left / video right), logo bar, checklist features.
 * Inspired by: Bench, Mercury, Brex
 */
import Link from 'next/link';
import { LuArrowRight, LuCheck } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const checklist = [
  'Import bank and credit card CSV exports',
  'AI auto-categorizes every transaction',
  'Organize by company, year, and month',
  'Export to Excel, CSV, or QBO format',
  'Attach receipts and supporting documents',
  'Invite your accountant or bookkeeper',
  'Two-factor authentication included',
  'Ask Alladin AI questions about your data',
];

const steps = [
  { n: '01', title: 'Upload', body: 'Drop a CSV from any bank or card issuer.' },
  { n: '02', title: 'Map & Categorize', body: 'Map columns once. AI assigns IRS categories.' },
  { n: '03', title: 'Review', body: 'Confirm, adjust, and attach receipts.' },
  { n: '04', title: 'Export', body: 'Hand clean reports to your accountant.' },
];

export default function V2() {
  return (
    <div className="min-h-screen bg-white text-[#111]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-[#e5e5e5] bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-9 w-9" size={400} />
            <span className="text-sm font-semibold text-[#111]">Accountant&apos;s Best Friend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-[#666] hover:text-[#111] transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-[#666] hover:text-[#111] transition-colors">Sign In</Link>
            <Link href="/login?mode=signup" className="rounded-lg bg-[#111] px-4 py-2 text-sm font-semibold text-white hover:bg-[#333] transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Split Hero */}
        <section className="mx-auto max-w-7xl px-6 py-20 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#16a34a] mb-5">Bookkeeping software</p>
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.08] tracking-tight text-[#111]">
              Stop guessing.<br />Start knowing.
            </h1>
            <p className="mt-6 text-lg text-[#555] leading-relaxed max-w-md">
              Import your bank exports, let AI sort the categories, and hand your accountant exactly what they need — organized, searchable, and export-ready.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/login?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-7 py-4 text-base font-semibold text-white hover:bg-[#15803d] transition-colors">
                Try it free <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center justify-center rounded-xl border border-[#ddd] px-7 py-4 text-base font-medium text-[#333] hover:bg-[#f5f5f5] transition-colors">
                See pricing
              </Link>
            </div>
          </div>

          {/* Video right */}
          <div className="relative rounded-2xl overflow-hidden border border-[#e5e5e5] shadow-xl bg-black">
            <video className="w-full block" src="/demo.mp4" autoPlay muted loop playsInline poster="/demo-poster.jpg" />
          </div>
        </section>

        {/* Checklist */}
        <section className="bg-[#f9fafb] border-y border-[#e5e5e5] py-16">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-[#888] mb-8">What&apos;s included</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#16a34a]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <LuCheck className="h-3 w-3 text-[#16a34a]" />
                  </div>
                  <span className="text-sm text-[#444]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#888] mb-3 text-center">How it works</p>
          <h2 className="text-3xl font-bold text-center mb-14">From raw data to clean reports in 4 steps</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((s) => (
              <div key={s.n}>
                <p className="text-4xl font-bold text-[#e5e5e5] mb-3">{s.n}</p>
                <h3 className="text-base font-semibold text-[#111] mb-2">{s.title}</h3>
                <p className="text-sm text-[#666] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#111] py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <h2 className="text-3xl font-bold text-white">Ready for clean books?</h2>
            <p className="mt-4 text-[#aaa]">No credit card required. Cancel anytime.</p>
            <Link href="/login?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#16a34a] px-8 py-4 text-base font-semibold text-white hover:bg-[#15803d] transition-colors">
              Get started free <LuArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
