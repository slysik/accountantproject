'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import ReCAPTCHA from 'react-google-recaptcha';
import { LuArrowLeft, LuSend, LuCircleCheck, LuCircleAlert } from 'react-icons/lu';
import PublicFooter from '@/components/PublicFooter';
import { useTheme } from '@/lib/theme';

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function ContactPage() {
  const { theme } = useTheme();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    const token = recaptchaRef.current?.getValue();
    if (!token) {
      setErrorMsg('Please complete the CAPTCHA before submitting.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, recaptchaToken: token }),
      });
      const data = await res.json() as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Failed to send message.');
      }

      setStatus('success');
      setForm({ name: '', email: '', subject: '', message: '' });
      recaptchaRef.current?.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong.');
      setStatus('error');
      recaptchaRef.current?.reset();
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Nav */}
      <header className="flex items-center justify-between border-b border-border-primary bg-bg-secondary px-6 py-4">
        <Link href="/" className="flex items-center gap-2 text-sm text-text-muted transition-colors hover:text-text-primary">
          <LuArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
        <Link href="/login" className="rounded-md bg-accent-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-dark">
          Sign In
        </Link>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold text-text-primary">Contact Us</h1>
          <p className="text-text-secondary">
            Have a question or feedback? Fill out the form below and we&apos;ll get back to you.
          </p>
        </div>

        {status === 'success' ? (
          <div className="rounded-xl border border-border-primary bg-bg-secondary p-8 text-center">
            <LuCircleCheck className="mx-auto mb-4 h-12 w-12 text-success" />
            <h2 className="mb-2 text-xl font-semibold text-text-primary">Message Sent!</h2>
            <p className="mb-6 text-text-secondary">
              Thanks for reaching out. We&apos;ll get back to you as soon as possible.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="rounded-md border border-border-primary px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name + Email row */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Name <span className="text-error">*</span>
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  Email <span className="text-error">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">Subject</label>
              <input
                name="subject"
                type="text"
                value={form.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {/* Message */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-text-primary">
                Message <span className="text-error">*</span>
              </label>
              <textarea
                name="message"
                required
                rows={6}
                value={form.message}
                onChange={handleChange}
                placeholder="Tell us how we can help..."
                className="w-full rounded-md border border-border-primary bg-bg-secondary px-3 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary"
              />
            </div>

            {/* reCAPTCHA */}
            <div>
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={RECAPTCHA_SITE_KEY}
                theme={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>

            {/* Error */}
            {status === 'error' && errorMsg && (
              <div className="flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-3 py-2.5 text-sm text-error">
                <LuCircleAlert className="h-4 w-4 flex-shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark disabled:opacity-50"
            >
              {status === 'loading' ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending...
                </>
              ) : (
                <>
                  <LuSend className="h-4 w-4" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </main>

      <PublicFooter />
    </div>
  );
}
