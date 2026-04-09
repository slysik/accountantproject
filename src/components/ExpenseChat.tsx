'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import * as XLSX from 'xlsx';
import { LuChevronDown, LuDownload, LuFileSpreadsheet, LuLoader, LuSend, LuSparkles, LuTriangle } from 'react-icons/lu';
import { decodeCompanySlug, isMonthSegment, isYearSegment } from '@/lib/company';

function AlladinMark({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" className={className}>
      <path d="M25 13c0-5 3.4-9 7.5-9 3.3 0 6 2.5 6 5.7 0 3.2-2.4 5.8-5.6 6.2 5.8 1.4 10.4 5.8 12 11.6" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <path d="M18 35c0-6.6 5.4-12 12-12h8c8.8 0 16 7.2 16 16v1H28c-5.5 0-10-4.5-10-10v5Z" fill="currentColor" opacity="0.16"/>
      <path d="M17 41h28c2.3 0 4.1 1.8 4.1 4.1S47.3 49.2 45 49.2H31.5c-3.1 0-5.6 2.5-5.6 5.6V56h-5.4c-3.6 0-6.5-2.9-6.5-6.5V44c0-1.7 1.3-3 3-3Z" fill="currentColor"/>
      <path d="M50.5 37.5c5.2 0 9.5 4.2 9.5 9.5s-4.3 9.5-9.5 9.5H41" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="21" cy="34" r="3" fill="currentColor"/>
    </svg>
  );
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface PendingDelete {
  type: 'expenses' | 'month' | 'year';
  expenseIds: string[];
  count: number;
  total: number;
  companyName: string | null;
  year: string | null;
  month: string | null;
  category: string | null;
  descriptionContains: string | null;
  summary: string;
}

interface ChatResponse {
  reply: string;
  pendingDelete?: PendingDelete;
  clearPendingDelete?: boolean;
  deletedCount?: number;
}

const SUGGESTIONS = [
  'What did I spend the most on?',
  'Show me a category breakdown',
  'What are my top 5 expenses?',
  'How much did I spend on meals?',
];

function sanitizeFilenamePart(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'expenses';
}

function downloadTextFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function extractMarkdownTable(content: string): string[][] | null {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const tableStart = lines.findIndex((line, index) => {
    const next = lines[index + 1];
    return line.includes('|') && !!next && /^\|?[\s:-|]+\|?$/.test(next);
  });

  if (tableStart === -1) return null;

  const tableLines: string[] = [];
  for (let i = tableStart; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.includes('|')) break;
    tableLines.push(line);
  }

  if (tableLines.length < 2) return null;

  const rows = tableLines
    .filter((line, index) => index !== 1)
    .map((line) =>
      line
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map((cell) => cell.trim())
    )
    .filter((row) => row.length > 1 && row.some(Boolean));

  return rows.length >= 2 ? rows : null;
}

function getRouteContext(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const inDashboard = segments[0] === 'dashboard';
  const section = segments[1];

  if (!inDashboard || !section || section === 'wizard' || section === 'trash') {
    return {
      companyName: undefined,
      year: undefined,
      month: undefined,
      scopeLabel: 'All expenses',
      scopeKey: 'dashboard-all',
    };
  }

  const companyName = decodeCompanySlug(section);
  const year = isYearSegment(segments[2] ?? '') ? segments[2] : undefined;
  const month = isMonthSegment(segments[3] ?? '') ? segments[3] : undefined;

  return {
    companyName,
    year,
    month,
    scopeLabel: month && year ? `${companyName} • ${year}-${month}` : year ? `${companyName} • ${year}` : companyName,
    scopeKey: `${companyName ?? 'all'}-${year ?? 'all'}-${month ?? 'all'}`,
  };
}

export default function ExpenseChat() {
  const pathname = usePathname();
  const { companyName, year, month, scopeLabel, scopeKey } = getRouteContext(pathname);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastScopeKeyRef = useRef(scopeKey);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Greeting on first open
      setMessages([{
        role: 'assistant',
        content: `Hi, I'm Alladin. I can answer questions about your expenses in ${scopeLabel}. What would you like to know?`,
      }]);
    }
  }, [open, messages.length, scopeLabel]);

  useEffect(() => {
    if (lastScopeKeyRef.current === scopeKey) return;
    lastScopeKeyRef.current = scopeKey;
    setPendingDelete(null);
    setError('');

    if (!open || messages.length === 0) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        content: `Context updated. I’m now looking at ${scopeLabel}.`,
      },
    ]);
  }, [scopeKey, scopeLabel, open, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const runChatRequest = useCallback(async (
    nextMessages: Message[],
    options?: { confirmDelete?: boolean; clearPendingDeleteLocally?: boolean }
  ) => {
    setMessages(nextMessages);
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextMessages,
          companyName,
          year,
          month,
          confirmDelete: options?.confirmDelete ?? false,
          pendingDelete,
        }),
      });

      const data = (await res.json()) as Partial<ChatResponse> & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Request failed');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply ?? 'Done.' }]);

      if (data.pendingDelete) {
        setPendingDelete(data.pendingDelete);
      } else if (data.clearPendingDelete || options?.clearPendingDeleteLocally) {
        setPendingDelete(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [companyName, year, month, pendingDelete]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setInput('');
    await runChatRequest(nextMessages, {
      confirmDelete: Boolean(pendingDelete) && trimmed.toLowerCase() === 'i agree',
    });
  }, [messages, loading, runChatRequest, pendingDelete]);

  const cancelDelete = useCallback(() => {
    setPendingDelete(null);
    setMessages((prev) => [...prev, { role: 'assistant', content: 'Delete request canceled. Nothing was removed.' }]);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleDownloadMessage = useCallback((content: string) => {
    const scope = sanitizeFilenamePart(scopeLabel);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadTextFile(`expense-assistant-${scope}-${timestamp}.txt`, content);
  }, [scopeLabel]);

  const handleDownloadExcel = useCallback((content: string) => {
    const table = extractMarkdownTable(content);
    if (!table) return;

    const worksheet = XLSX.utils.aoa_to_sheet(table);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Chat Table');

    const scope = sanitizeFilenamePart(scopeLabel);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    XLSX.writeFile(workbook, `expense-assistant-${scope}-${timestamp}.xlsx`);
  }, [scopeLabel]);

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-4 right-4 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-accent-primary text-bg-primary shadow-[0_18px_45px_rgba(0,0,0,0.28)] transition-all hover:scale-105 hover:bg-accent-dark md:bottom-6 md:right-6"
          title="Open Alladin"
        >
          <div className="relative flex items-center justify-center">
            <AlladinMark className="h-7 w-7" />
            <LuSparkles className="absolute -right-2 -top-2 h-3.5 w-3.5" />
          </div>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-4 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[26rem] flex-col rounded-2xl border border-border-primary bg-bg-secondary shadow-2xl md:bottom-6 md:right-6"
          style={{ maxHeight: 'min(72vh, 44rem)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-accent-primary/10 text-accent-primary">
                <AlladinMark className="h-4.5 w-4.5" />
                <LuSparkles className="absolute -right-1 -top-1 h-3 w-3 text-accent-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Alladin</p>
                <p className="text-[10px] text-text-muted">
                  Genie for {scopeLabel}
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-1 text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            >
              <LuChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className="max-w-[85%]">
                  <div
                    className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-accent-primary text-bg-primary'
                        : 'bg-bg-tertiary text-text-primary'
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="mt-1.5 flex items-center gap-2 px-1">
                      <button
                        type="button"
                        onClick={() => handleDownloadMessage(msg.content)}
                        className="inline-flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-text-primary"
                      >
                        <LuDownload className="h-3 w-3" />
                        Save
                      </button>
                      {extractMarkdownTable(msg.content) && (
                        <button
                          type="button"
                          onClick={() => handleDownloadExcel(msg.content)}
                          className="inline-flex items-center gap-1 text-[10px] text-text-muted transition-colors hover:text-text-primary"
                        >
                          <LuFileSpreadsheet className="h-3 w-3" />
                          Excel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1.5 rounded-xl bg-bg-tertiary px-3 py-2">
                  <LuLoader className="h-3 w-3 animate-spin text-accent-primary" />
                  <span className="text-xs text-text-muted">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-error">{error}</p>
            )}

            {pendingDelete && !loading && (
              <div className="rounded-2xl border border-error/30 bg-error/5 p-3">
                <div className="mb-2 flex items-start gap-2">
                  <div className="mt-0.5 rounded-full bg-error/10 p-1">
                    <LuTriangle className="h-3.5 w-3.5 text-error" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Ready to move data to Trash</p>
                    <p className="mt-1 text-[11px] text-text-muted">
                      {pendingDelete.count} expense{pendingDelete.count === 1 ? '' : 's'} selected. This will soft-delete the matching data in Supabase.
                    </p>
                  </div>
                </div>
                <pre className="max-h-24 overflow-y-auto rounded-xl bg-bg-primary/70 p-2 text-[10px] leading-relaxed text-text-muted whitespace-pre-wrap">
                  {pendingDelete.summary}
                </pre>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="rounded-lg border border-border-primary px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:bg-bg-primary"
                  >
                    Cancel
                  </button>
                </div>
                <p className="mt-3 text-[11px] text-text-muted">
                  Type exactly <span className="font-semibold text-text-primary">I agree</span> in the chat box below to continue.
                </p>
              </div>
            )}

            {/* Suggestions — shown after greeting only */}
            {messages.length === 1 && !loading && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border-primary bg-bg-primary px-2.5 py-1 text-[10px] text-text-muted transition-colors hover:border-accent-primary/50 hover:text-accent-primary"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-border-primary p-3">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your expenses or say what to delete..."
                disabled={loading}
                className="flex-1 rounded-lg border border-border-primary bg-bg-tertiary px-3 py-2 text-xs text-text-primary placeholder-text-muted outline-none transition-colors focus:border-accent-primary focus:ring-1 focus:ring-accent-primary disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-primary text-bg-primary transition-colors hover:bg-accent-dark disabled:opacity-40"
              >
                <LuSend className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
