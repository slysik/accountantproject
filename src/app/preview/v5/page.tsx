'use client';
/**
 * Preview V5 — "Bold Split Dark/Light"
 * Left half dark navy, right half white — split-screen hero with video below,
 * strong contrast, teal accent, two-column feature section.
 * Inspired by: Figma, Webflow, Liveblocks
 */
import Link from 'next/link';
import { LuArrowRight, LuCheck, LuUpload, LuSparkles, LuChartBar, LuFileSpreadsheet, LuShield, LuUsers } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const features = [
  { icon: LuUpload, title: 'CSV Import', body: 'Upload bank exports. Columns auto-detected and mapped.' },
  { icon: LuSparkles, title: 'AI Categories', body: 'Alladin AI assigns every row an IRS category.' },
  { icon: LuChartBar, title: 'Dashboards', body: 'Monthly trends, category totals, year-over-year.' },
  { icon: LuFileSpreadsheet, title: 'Export', body: 'Excel, CSV, QBO — ready for your accountant.' },
  { icon: LuShield, title: 'Security', body: 'MFA, IP limits, and guarded signup flows.' },
  { icon: LuUsers, title: 'Team Access', body: 'Invite team members with Viewer, Contributor, or Admin roles.' },
];

const checks = ['No spreadsheet needed', 'Cancel anytime', 'MFA included', 'AI built-in'];

export default function V5() {
  return (
    <div className="min-h-screen bg-white text-[#0d1117]">
      {/* Nav — split style */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#e5e7eb]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <SiteLogo className="h-9 w-9" size={400} />
            <span className="text-sm font-semibold">Accountant&apos;s Best Friend</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="text-sm text-[#6b7280] hover:text-[#0d1117] transition-colors">Pricing</Link>
            <Link href="/login" className="text-sm text-[#6b7280] hover:text-[#0d1117] transition-colors">Sign In</Link>
            <Link href="/login?mode=signup" className="rounded-lg bg-[#0d9488] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f766e] transition-colors">
              Start Free →
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Split hero */}
        <section className="grid md:grid-cols-2 min-h-[520px]">
          {/* Left — dark */}
          <div className="bg-[#0d1117] flex flex-col justify-center px-10 py-16 lg:px-16">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#0d9488] mb-5">Bookkeeping software</p>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-white">
              Clean books.<br />Zero chaos.
            </h1>
            <p className="mt-5 text-[#94a3b8] text-base leading-relaxed max-w-sm">
              Import bank data, auto-categorize with AI, and hand your accountant exactly what they need.
            </p>
            <div className="mt-8 flex flex-col gap-3 max-w-xs">
              <Link href="/login?mode=signup" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0d9488] px-6 py-3.5 text-sm font-semibold text-white hover:bg-[#0f766e] transition-colors">
                Get started free <LuArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3.5 text-sm font-medium text-white/70 hover:border-white/20 hover:text-white transition-colors">
                Sign in to your account
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2">
              {checks.map((c) => (
                <span key={c} className="flex items-center gap-1.5 text-xs text-[#64748b]">
                  <LuCheck className="h-3.5 w-3.5 text-[#0d9488]" />
                  {c}
                </span>
              ))}
            </div>
          </div>

          {/* Right — white with stats */}
          <div className="flex flex-col justify-center px-10 py-16 lg:px-16 bg-[#f8fafc]">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8] mb-6">What&apos;s inside</p>
            <div className="space-y-5">
              {[
                ['Import', 'Upload CSV from any bank or card issuer'],
                ['Map', 'Tell us which columns are date, amount, description'],
                ['Categorize', 'AI assigns IRS categories automatically'],
                ['Review', 'Confirm, adjust, and attach receipts'],
                ['Export', 'Download Excel, CSV, or QBO in one click'],
              ].map(([step, desc]) => (
                <div key={step} className="flex items-start gap-4">
                  <span className="mt-0.5 text-xs font-bold uppercase tracking-widest text-[#0d9488] w-16 shrink-0">{step}</span>
                  <span className="text-sm text-[#475569] leading-relaxed">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Full-width video */}
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="relative overflow-hidden rounded-3xl border border-[#e2e8f0] shadow-2xl bg-black">
            <video className="w-full block" src="/demo.mp4" autoPlay muted loop playsInline poster="/demo-poster.jpg" />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/75 to-transparent px-6 py-5">
              <p className="text-xs text-white/40 uppercase tracking-widest mb-1">See it in action</p>
              <p className="text-sm font-semibold text-white">Import · Organize · Review · Export</p>
            </div>
          </div>
        </section>

        {/* Feature grid */}
        <section className="bg-[#f8fafc] border-t border-[#e2e8f0] py-20">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="text-3xl font-bold text-center mb-12">Everything your books need</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <div key={f.title} className="bg-white rounded-2xl border border-[#e2e8f0] p-6 hover:shadow-md transition-shadow">
                  <div className="h-10 w-10 rounded-xl bg-[#0d9488]/10 flex items-center justify-center mb-4">
                    <f.icon className="h-5 w-5 text-[#0d9488]" />
                  </div>
                  <h3 className="font-semibold text-[#0d1117] mb-2">{f.title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0d1117] py-20 text-center">
          <h2 className="text-4xl font-bold text-white">Your accountant will thank you.</h2>
          <p className="mt-4 text-[#94a3b8] text-lg">Clean records. No spreadsheets. Export-ready.</p>
          <Link href="/login?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0d9488] px-9 py-4 text-base font-semibold text-white hover:bg-[#0f766e] transition-colors">
            Try it free <LuArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
