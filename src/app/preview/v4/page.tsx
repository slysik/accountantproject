'use client';
/**
 * Preview V4 — "Minimal Slate"
 * Near-white background, slate/indigo palette, large left-aligned headline,
 * video + feature list side by side, numbered steps, clean bottom CTA.
 * Inspired by: Notion, Loom, Pitch
 */
import Link from 'next/link';
import { LuArrowRight, LuCheck } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const features = [
  'Upload any bank or credit card CSV',
  'Auto-map columns and preview before saving',
  'AI categorizes every transaction by IRS type',
  'Organize folders by company, year, and month',
  'Attach receipts and supporting documents',
  'Export to Excel, CSV, or QuickBooks QBO',
  'Invite your accountant with role-based access',
  'Ask Alladin AI questions about your spending',
];

const numbers = [
  { n: '30+', label: 'IRS expense categories' },
  { n: '4', label: 'Import-to-export steps' },
  { n: '3', label: 'Access roles: Viewer, Contributor, Admin' },
];

export default function V4() {
  return (
    <div className="min-h-screen bg-[#f8f9fc] text-[#1e2235]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-[#e2e5ef] bg-[#f8f9fc]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-9 w-9" size={400} />
            <span className="text-sm font-semibold">Accountant&apos;s Best Friend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-[#6b7280] hover:text-[#1e2235] transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-[#6b7280] hover:text-[#1e2235] transition-colors">Sign In</Link>
            <Link href="/login?mode=signup" className="rounded-lg bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors">
              Start Free
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pt-20 pb-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#4f46e5] mb-5">Expense management · AI · Export</p>
            <h1 className="text-5xl md:text-6xl font-bold leading-[1.07] tracking-tight">
              Bookkeeping software<br />built around your workflow.
            </h1>
            <p className="mt-6 text-lg text-[#6b7280] leading-relaxed max-w-xl">
              Import bank data, auto-categorize with AI, organize by company, and export clean reports when your accountant needs them.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="/login?mode=signup" className="inline-flex items-center gap-2 rounded-xl bg-[#4f46e5] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#4338ca] transition-colors">
                Get started <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="inline-flex items-center rounded-xl border border-[#e2e5ef] bg-white px-7 py-3.5 text-sm font-medium text-[#4b5563] hover:bg-[#f3f4f6] transition-colors">
                View plans
              </Link>
            </div>
          </div>
        </section>

        {/* Video + Feature list side by side */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
            <div className="relative overflow-hidden rounded-2xl border border-[#e2e5ef] shadow-xl bg-black">
              <video className="w-full block" src="/demo.mp4" autoPlay muted loop playsInline poster="/demo-poster.jpg" />
            </div>
            <div className="py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7280] mb-6">What you get</p>
              <ul className="space-y-4">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-[#374151]">
                    <div className="h-5 w-5 rounded-full bg-[#4f46e5]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <LuCheck className="h-3 w-3 text-[#4f46e5]" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Numbers */}
        <section className="bg-white border-y border-[#e2e5ef] py-14">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {numbers.map((n) => (
                <div key={n.n}>
                  <p className="text-5xl font-bold text-[#4f46e5]">{n.n}</p>
                  <p className="mt-2 text-sm text-[#6b7280]">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h2 className="text-4xl font-bold">Your accountant will thank you.</h2>
          <p className="mt-4 text-[#6b7280] text-lg">Clean records. Zero spreadsheets. Export when ready.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#4f46e5] px-8 py-4 text-base font-semibold text-white hover:bg-[#4338ca] transition-colors">
              Try it free <LuArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-[#e2e5ef] bg-white px-8 py-4 text-base font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors">
              Contact us
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
