'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { LuBot, LuSend, LuX, LuChevronDown, LuLoader } from 'react-icons/lu';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ExpenseChatProps {
  year?: string;
  month?: string;
}

const SUGGESTIONS = [
  'What did I spend the most on?',
  'Show me a category breakdown',
  'What are my top 5 expenses?',
  'How much did I spend on meals?',
];

export default function ExpenseChat({ year, month }: ExpenseChatProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      // Greeting on first open
      setMessages([{
        role: 'assistant',
        content: `Hi! I can answer questions about your expenses${month && year ? ` for ${year}-${month}` : year ? ` for ${year}` : ''}. What would you like to know?`,
      }]);
    }
  }, [open, messages.length, year, month]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          year,
          month,
        }),
      });

      if (!res.ok) throw new Error('Request failed');
      const data = await res.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [messages, loading, year, month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary text-bg-primary shadow-lg transition-all hover:bg-accent-dark hover:scale-105"
          title="Ask about your expenses"
        >
          <LuBot className="h-5 w-5" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 flex w-80 flex-col rounded-2xl border border-border-primary bg-bg-secondary shadow-2xl sm:w-96" style={{ maxHeight: '70vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-primary px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-accent-primary/10">
                <LuBot className="h-4 w-4 text-accent-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-text-primary">Expense Assistant</p>
                <p className="text-[10px] text-text-muted">
                  {month && year ? `${year}-${month}` : year ?? 'All expenses'}
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
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-accent-primary text-bg-primary'
                      : 'bg-bg-tertiary text-text-primary'
                  }`}
                >
                  {msg.content}
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
                placeholder="Ask about your expenses..."
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
