'use client';

import Link from 'next/link';
import {
  LuChartBar,
  LuCircleHelp,
  LuFileSpreadsheet,
  LuFolderTree,
  LuLockKeyhole,
  LuSparkles,
  LuTags,
  LuUpload,
  LuUsers,
} from 'react-icons/lu';

const quickLinks = [
  { href: '/dashboard', label: 'Open Dashboard' },
  { href: '/dashboard/wizard', label: 'Run Import Wizard' },
  { href: '/settings/account', label: 'Account Details' },
  { href: '/settings/team', label: 'Team Settings' },
  { href: '/settings/security', label: 'Security Settings' },
  { href: '/settings/categories', label: 'Category Mapping' },
];

const helpSections = [
  {
    icon: LuChartBar,
    title: 'Dashboard and Analysis',
    body:
      'The dashboard is your control center. It gives you a quick view of total spend, category breakdowns, monthly movement, and year-over-year trends so you can see what needs attention without opening spreadsheets first.',
    bullets: [
      'Use the main dashboard to spot large categories, unusual shifts, and active reporting periods.',
      'Open a company to drill into that company only.',
      'Open a year to review trends, top months, exports, and year-level summaries.',
      'Open a month to review line-item expenses, receipts, categories, and exports.',
    ],
  },
  {
    icon: LuFolderTree,
    title: 'Companies, Years, and Folders',
    body:
      'The left sidebar organizes your records by company first, then year, then month. This keeps bookkeeping work structured and makes it easier to separate clients, legal entities, or business units.',
    bullets: [
      'Add a company when you want a separate bookkeeping workspace for that business.',
      'Add year folders to keep each reporting period clean and easy to navigate.',
      'Use Trash if something is removed accidentally and needs to be restored.',
      'If company-level access restrictions are enabled, team members may only see the companies assigned to them.',
    ],
  },
  {
    icon: LuUpload,
    title: 'Importing Transactions',
    body:
      'Use the Import Wizard or month-level CSV import to bring transactions into the system. The app reads dates, descriptions, and amounts, then applies category logic before you save the final rows.',
    bullets: [
      'Use the wizard when you want a guided upload and review process.',
      'Use the month-level import when you already know where the file belongs.',
      'Preview the imported rows before saving so you can catch formatting issues early.',
      'Duplicate transactions are skipped when the app detects the same row already exists.',
    ],
  },
  {
    icon: LuTags,
    title: 'Categories and Mapping',
    body:
      'The Categories area helps you control how imported labels and retailer names map into your accounting categories. This reduces repetitive cleanup when the same merchants or bank labels appear again and again.',
    bullets: [
      'Map source category labels from imported files into your preferred expense categories.',
      'Map retailer names like Starbucks or McDonalds so future transactions classify automatically.',
      'Apply a mapping to existing expenses so older rows are updated too.',
      'Use this area whenever you notice the same merchant or import label getting categorized incorrectly.',
    ],
  },
  {
    icon: LuUsers,
    title: 'Team Management',
    body:
      'Team Settings is where account owners and account admins manage access. Members can be invited by email, assigned a role, and, when company scoping is enabled, limited to only the companies they should see.',
    bullets: [
      'Admin can manage team members and account access.',
      'Contributor can work with data but cannot manage the team.',
      'Viewer is read-only.',
      'If company scoping is active, set a member to Selected Companies and choose only the companies they should access.',
    ],
  },
  {
    icon: LuLockKeyhole,
    title: 'Security and Password Help',
    body:
      'Security Settings helps protect the account with MFA and password tools. Owners and admins can also reset passwords for enrolled team members when server-side admin access is configured.',
    bullets: [
      'Use MFA to add another layer of protection to the sign-in process.',
      'Password resets through email depend on the user still controlling the mailbox on file.',
      'Account owners or account admins can reset enrolled team member passwords from Team Settings.',
      'If password reset actions fail, confirm the server has SUPABASE_SERVICE_ROLE_KEY configured.',
    ],
  },
  {
    icon: LuFileSpreadsheet,
    title: 'Exports and Deliverables',
    body:
      'Exports are designed for real accounting workflows. You can export month-level and year-level data in multiple formats depending on how you or your accountant work.',
    bullets: [
      'Use CSV for spreadsheet cleanup and data portability.',
      'Use Excel for formatted reporting and tabular analysis.',
      'Use QBO when preparing data for QuickBooks-style workflows.',
      'Year views provide broader analysis, while month views provide detailed line-item exports.',
    ],
  },
  {
    icon: LuSparkles,
    title: 'Alladin AI Assistant',
    body:
      'Alladin AI Assistant is available inside the authenticated portal and can answer questions about your records using the current company or reporting context.',
    bullets: [
      'Ask questions like “What did I spend the most on?” or “Show a category breakdown.”',
      'Use the company selector in the assistant when you want to narrow the conversation to one business.',
      'Save assistant output to a file when you want to keep a written answer.',
      'If the response is tabular, export it to Excel directly from the chat panel.',
    ],
  },
];

export default function HelpSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-accent-primary/10 p-3 text-accent-primary">
            <LuCircleHelp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-text-primary">Help Area</h1>
            <p className="mt-2 max-w-3xl text-sm text-text-muted">
              This guide explains the main menus, dashboards, imports, exports, team access, and AI tools inside the user portal so customers can get productive faster.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border-primary bg-bg-secondary p-6">
        <h2 className="mb-4 text-sm font-semibold text-text-primary">Quick Links</h2>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full border border-border-primary bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <article key={section.title} className="rounded-xl border border-border-primary bg-bg-secondary p-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="rounded-xl bg-accent-primary/10 p-2 text-accent-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-semibold text-text-primary">{section.title}</h2>
              </div>
              <p className="text-sm leading-6 text-text-secondary">{section.body}</p>
              <div className="mt-4 grid gap-2">
                {section.bullets.map((bullet) => (
                  <div
                    key={bullet}
                    className="rounded-lg border border-border-primary bg-bg-tertiary px-4 py-3 text-sm text-text-secondary"
                  >
                    {bullet}
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
