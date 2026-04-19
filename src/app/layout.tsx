import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  metadataBase: new URL('https://accountantsbestfriend.com'),
  title: {
    default: "Accountant's Best Friend — Expense & Income Tracking for Small Business",
    template: "%s | Accountant's Best Friend",
  },
  description:
    "Accountant's Best Friend is AI-powered expense and income tracking software for small businesses, freelancers, and accountants. Import CSV bank statements, auto-categorize to IRS Schedule C, track income by source, and export to QuickBooks. Try free.",
  keywords: [
    "expense tracking software",
    "small business accounting",
    "IRS Schedule C categories",
    "income tracking",
    "CSV expense import",
    "QuickBooks export",
    "freelancer accounting",
    "self-employed tax prep",
    "accounts receivable",
    "accounts payable",
    "business expense categorization",
    "bookkeeping software",
    "accountant tools",
    "bank statement import",
    "receipt management",
    "cash flow tracking",
    "P&L tracking",
    "tax deduction tracker",
    "AI bookkeeping",
    "multi-company accounting",
  ],
  authors: [{ name: "Accountant's Best Friend" }],
  creator: "Accountant's Best Friend",
  publisher: "Accountant's Best Friend",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://accountantsbestfriend.com',
    siteName: "Accountant's Best Friend",
    title: "Accountant's Best Friend — AI Expense & Income Tracking",
    description:
      "Import bank CSVs, auto-categorize expenses to IRS Schedule C, track income by type, and export to QuickBooks. Built for small businesses, freelancers, and accountants.",
    images: [
      {
        url: '/logo-light.jpeg',
        width: 1200,
        height: 630,
        alt: "Accountant's Best Friend",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Accountant's Best Friend — Expense & Income Tracking",
    description:
      "AI-powered bookkeeping for small businesses. Import CSV, auto-categorize to IRS Schedule C, export to QuickBooks.",
    images: ['/logo-light.jpeg'],
  },
  alternates: {
    canonical: 'https://accountantsbestfriend.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* Inline script prevents flash of wrong theme before React hydrates */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='light')document.documentElement.classList.add('light');}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: "Accountant's Best Friend",
              url: 'https://accountantsbestfriend.com',
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description:
                "AI-powered expense and income tracking for small businesses and accountants. Import CSV bank statements, auto-categorize to IRS Schedule C, track accounts receivable and payable, and export to QuickBooks.",
              offers: [
                { '@type': 'Offer', price: '10', priceCurrency: 'USD', name: 'Individual Plan' },
                { '@type': 'Offer', price: '25', priceCurrency: 'USD', name: 'Business Plan' },
                { '@type': 'Offer', price: '100', priceCurrency: 'USD', name: 'Elite Plan' },
              ],
              featureList: [
                'CSV bank statement import',
                'IRS Schedule C expense categorization',
                'Income tracking by type (check, ACH, deposit, cash)',
                'Accounts receivable and payable tracking',
                'QuickBooks QBO export',
                'Multi-company support',
                'AI-powered expense categorization',
                'Receipt management',
                'Year-over-year spend analysis',
              ],
              publisher: {
                '@type': 'Organization',
                name: "Accountant's Best Friend",
                url: 'https://accountantsbestfriend.com',
              },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-bg-primary text-text-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
