'use client';
import Link from 'next/link';
import { LuArrowRight, LuUpload, LuSparkles, LuChartBar, LuFileText, LuCheck, LuFolderOpen, LuMessageSquare, LuShield } from 'react-icons/lu';
import SiteLogo from '@/components/SiteLogo';

const trust = [
  'MFA & secure sign-in',
  'Role-based team access',
  'Soft-delete & trash recovery',
  'Alladin AI built in',
  'No spreadsheet needed',
];

const steps = [
  {
    n: '01',
    icon: LuUpload,
    title: 'Import',
    body: 'Drop a CSV export from any bank or card issuer. Column names are auto-detected — date, description, amount, and more.',
  },
  {
    n: '02',
    icon: LuSparkles,
    title: 'Map & Categorize',
    body: 'Map columns once and AI assigns IRS expense categories to every transaction. Review the suggestions and adjust any that need tweaking.',
  },
  {
    n: '03',
    icon: LuChartBar,
    title: 'Review',
    body: 'Browse dashboards, monthly trends, and category breakdowns. Attach receipts and supporting documents to any entry.',
  },
  {
    n: '04',
    icon: LuFileText,
    title: 'Export',
    body: 'Generate clean Excel, CSV, or QuickBooks QBO files in one click — exactly what your accountant needs at tax time.',
  },
];

const capabilities = [
  {
    icon: LuUpload,
    title: 'Fast bank import',
    body: 'Upload any bank or credit card CSV. Columns are matched automatically so you skip the manual mapping every time.',
  },
  {
    icon: LuSparkles,
    title: 'AI categorization',
    body: 'Every transaction is assigned an IRS expense category. You review the suggestions and override anything that doesn\'t look right.',
  },
  {
    icon: LuFolderOpen,
    title: 'Organized by company',
    body: 'Separate folders for each company, year, and month keep your books clean even when you\'re managing multiple clients.',
  },
  {
    icon: LuChartBar,
    title: 'Live financial visibility',
    body: 'Dashboards and monthly breakdowns give you a real-time view of spending — no waiting until tax season to see where money went.',
  },
  {
    icon: LuFileText,
    title: 'Export-ready output',
    body: 'One-click export to Excel, CSV, or QBO format. Clean, structured files that go straight to your accountant without reformatting.',
  },
  {
    icon: LuMessageSquare,
    title: 'Alladin AI assistant',
    body: 'Ask questions about your expenses in plain English. "What did we spend on travel in Q3?" — Alladin answers instantly from your data.',
  },
];

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

const numbers = [
  { n: '30+', label: 'IRS expense categories' },
  { n: '4', label: 'Import-to-export steps' },
  { n: '3', label: 'Access roles: Viewer, Contributor, Admin' },
];

const bands = [
  {
    icon: LuChartBar,
    eyebrow: 'Workflow',
    title: 'Designed for real accounting workflows',
    body: 'From raw bank export to clean report — every step of the process is handled inside one tool. No jumping between spreadsheets, email threads, and different software.',
    bullets: [
      'Auto-map CSV columns from any bank format',
      'Approve, adjust, or override AI category suggestions',
      'Track every entry back to its original source file',
    ],
  },
  {
    icon: LuMessageSquare,
    eyebrow: 'Intelligence',
    title: 'Built to answer questions quickly',
    body: 'Alladin AI reads your transaction data and answers natural-language questions. Get spending summaries, category breakdowns, and anomaly flags without writing a single formula.',
    bullets: [
      'Ask "What did we spend on meals this quarter?"',
      'Get instant category totals and month-over-month trends',
      'Flag unusual charges or duplicate entries automatically',
    ],
  },
  {
    icon: LuShield,
    eyebrow: 'Security',
    title: 'Focused on safer access',
    body: 'Multi-factor authentication, role-based permissions, and soft-delete with trash recovery mean your financial data stays protected even as your team grows.',
    bullets: [
      'Viewer, Contributor, and Admin roles for each company',
      'MFA required on all accounts',
      'Deleted entries recoverable from trash — never lost for good',
    ],
  },
];

export default function LandingPage() {
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
            Upload your bank statements, let AI do the sorting, and walk into tax season with everything organized — no spreadsheets, no manual data entry.
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

        {/* How it works — 4 numbered steps */}
        <section className="border-t border-[#e8e4df] bg-white py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9a8570] mb-3 text-center">How it works</p>
            <h2 className="text-3xl font-bold text-center text-[#1a1208] mb-14">From raw data to clean reports in 4 steps</h2>
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((s) => (
                <div key={s.n} className="flex flex-col gap-3">
                  <p className="text-4xl font-bold text-[#e8e4df]">{s.n}</p>
                  <div className="h-10 w-10 rounded-xl bg-[#d97706]/10 flex items-center justify-center">
                    <s.icon className="h-5 w-5 text-[#d97706]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1208]">{s.title}</h3>
                  <p className="text-sm text-[#7a6a55] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats row */}
        <section className="border-y border-[#e8e4df]" style={{ background: '#faf9f7' }}>
          <div className="mx-auto max-w-4xl px-6 py-14">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              {numbers.map((n) => (
                <div key={n.n}>
                  <p className="text-5xl font-bold text-[#d97706]">{n.n}</p>
                  <p className="mt-2 text-sm text-[#7a6a55]">{n.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6-capability grid */}
        <section className="bg-white border-b border-[#e8e4df] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9a8570] mb-3 text-center">What you get</p>
            <h2 className="text-3xl font-bold text-center text-[#1a1208] mb-12">Everything you need to close the books</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {capabilities.map((c) => (
                <div key={c.title} className="flex flex-col gap-3 rounded-2xl border border-[#e8e4df] bg-[#faf9f7] p-6">
                  <div className="h-10 w-10 rounded-xl bg-[#d97706]/10 flex items-center justify-center">
                    <c.icon className="h-5 w-5 text-[#d97706]" />
                  </div>
                  <h3 className="font-semibold text-[#1a1208]">{c.title}</h3>
                  <p className="text-sm text-[#7a6a55] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's included checklist */}
        <section style={{ background: '#faf9f7' }} className="border-b border-[#e8e4df] py-20">
          <div className="mx-auto max-w-4xl px-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#9a8570] mb-3 text-center">What&apos;s included</p>
            <h2 className="text-3xl font-bold text-center text-[#1a1208] mb-10">No add-ons. No hidden extras.</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {checklist.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="h-5 w-5 rounded-full bg-[#d97706]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <LuCheck className="h-3 w-3 text-[#d97706]" />
                  </div>
                  <span className="text-sm text-[#4a3b28]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3 feature bands */}
        <section className="bg-white border-b border-[#e8e4df] py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid md:grid-cols-3 gap-10">
              {bands.map((b) => (
                <div key={b.title} className="flex flex-col gap-4">
                  <div className="h-10 w-10 rounded-xl bg-[#d97706]/10 flex items-center justify-center">
                    <b.icon className="h-5 w-5 text-[#d97706]" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[#d97706]">{b.eyebrow}</p>
                  <h3 className="text-lg font-bold text-[#1a1208] leading-snug">{b.title}</h3>
                  <p className="text-sm text-[#7a6a55] leading-relaxed">{b.body}</p>
                  <ul className="space-y-2 mt-1">
                    {b.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2 text-sm text-[#4a3b28]">
                        <LuCheck className="h-4 w-4 text-[#d97706] flex-shrink-0 mt-0.5" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center" style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d2010 100%)' }}>
          <h2 className="text-4xl font-bold text-white">Stop chasing receipts.</h2>
          <p className="mt-4 text-[#c4a97d] text-lg">Start closing your books with confidence.</p>
          <p className="mt-2 text-[#9a7d5a] text-sm">No credit card required. Cancel anytime.</p>
          <Link href="/login?mode=signup" className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#d97706] px-9 py-4 text-base font-semibold text-white hover:bg-[#b45309] transition-colors">
            Start free today <LuArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
