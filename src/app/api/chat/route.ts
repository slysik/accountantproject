import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';

const anthropicKey = process.env.claude_key ?? process.env.ANTHROPIC_API_KEY;
const claudeModel = 'claude-haiku-4-5-20251001';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

type ExpenseRow = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  company_name: string | null;
  year: string | null;
  month: string | null;
};

type DeleteIntent = {
  action: 'answer' | 'prepare_delete' | 'cancel';
  target: 'expenses' | 'month' | 'year';
  companyName: string | null;
  year: string | null;
  month: string | null;
  category: string | null;
  descriptionContains: string | null;
  amountMin: number | null;
  amountMax: number | null;
  deleteAllInScope: boolean;
};

type PendingDelete = {
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
};

type ChatRequestBody = {
  messages: ChatMessage[];
  year?: string;
  month?: string;
  companyName?: string;
  confirmDelete?: boolean;
  pendingDelete?: PendingDelete | null;
};

function isAgreementMessage(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === 'i agree';
}

function normalizeMonth(month: string | null | undefined): string | null {
  if (!month) return null;
  if (/^\d{2}$/.test(month)) return month;
  if (/^\d{4}-\d{2}$/.test(month)) return month.slice(5);
  return null;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function summarizeMatches(expenses: ExpenseRow[]): string {
  return expenses
    .slice(0, 5)
    .map((expense) => {
      const company = expense.company_name ? ` | ${expense.company_name}` : '';
      return `${expense.date}${company} | ${expense.description} | ${formatCurrency(Number(expense.amount))}`;
    })
    .join('\n');
}

async function extractDeleteIntent(
  messages: ChatMessage[],
  context: { companyName?: string; year?: string; month?: string }
): Promise<DeleteIntent | null> {
  const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;
  if (!latestUserMessage) return null;

  const client = new Anthropic({ apiKey: anthropicKey });

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 300,
    tools: [
      {
        name: 'classify_delete_intent',
        description: 'Classify whether the user wants to delete expense data and extract the parameters.',
        input_schema: {
          type: 'object' as const,
          required: [
            'action', 'target', 'companyName', 'year', 'month',
            'category', 'descriptionContains', 'amountMin', 'amountMax', 'deleteAllInScope',
          ],
          properties: {
            action: { type: 'string', enum: ['answer', 'prepare_delete', 'cancel'] },
            target: { type: 'string', enum: ['expenses', 'month', 'year'] },
            companyName: { type: ['string', 'null'] },
            year: { type: ['string', 'null'] },
            month: { type: ['string', 'null'] },
            category: { type: ['string', 'null'] },
            descriptionContains: { type: ['string', 'null'] },
            amountMin: { type: ['number', 'null'] },
            amountMax: { type: ['number', 'null'] },
            deleteAllInScope: { type: 'boolean' },
          },
        },
      },
    ],
    tool_choice: { type: 'auto' },
    system: `You classify whether a user's latest message is asking to delete expense data.

Rules:
- action = "prepare_delete" only if the user is explicitly asking to delete, remove, or trash expense data.
- action = "cancel" only if the user is canceling a pending delete request.
- Otherwise action = "answer".
- target = "month" when the user wants to delete an entire month of expenses.
- target = "year" when the user wants to delete an entire year of expenses.
- target = "expenses" for selective expense deletion.
- Use the current page context when the user refers to "this month", "this year", or the current company.
- month must be two digits like "01" when known.
- deleteAllInScope should be true only when the user means to delete everything in the resolved scope.`,
    messages: [
      {
        role: 'user',
        content: `Current context:
companyName=${context.companyName ?? 'null'}
year=${context.year ?? 'null'}
month=${context.month ?? 'null'}

Latest user message:
${latestUserMessage}`,
      },
    ],
  });

  const toolUse = response.content.find((block) => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') return null;

  return toolUse.input as DeleteIntent;
}

async function generateReply(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const client = new Anthropic({ apiKey: anthropicKey });

  const response = await client.messages.create({
    model: claudeModel,
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const text = response.content.find((block) => block.type === 'text');
  return text?.type === 'text' ? text.text.trim() : '';
}

function buildSystemPrompt(
  expenses: ExpenseRow[],
  context: { year?: string; month?: string; companyName?: string }
): string {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const expenseSummary = expenses
    .map((expense) =>
      `${expense.date} | ${expense.company_name ?? 'My Company'} | ${expense.description} | ${formatCurrency(Number(expense.amount))} | ${expense.category}`
    )
    .join('\n');

  const contextLabel = context.year && context.month
    ? `${context.companyName ? `${context.companyName} / ` : ''}${context.year}-${context.month}`
    : context.year
      ? `${context.companyName ? `${context.companyName} / ` : ''}${context.year}`
      : context.companyName
        ? context.companyName
        : 'all time';

  return `You are a helpful financial assistant built into Accountant's Best Friend, an expense tracking tool for self-employed professionals.

The user is asking about their business expenses. Here is their expense data for ${contextLabel} (${expenses.length} expenses, total ${formatCurrency(total)}):

DATE | COMPANY | DESCRIPTION | AMOUNT | IRS CATEGORY
${expenseSummary || '(no expenses found for this period)'}

Answer questions about these expenses accurately. Be concise and specific. Use dollar amounts. If asked something outside of this expense data, politely say you can only help with their expense data.`;
}

function filterExpenses(
  expenses: ExpenseRow[],
  intent: DeleteIntent,
  context: { companyName?: string; year?: string; month?: string }
) {
  const resolvedCompany = intent.companyName ?? context.companyName ?? null;
  const resolvedYear = intent.year ?? context.year ?? null;
  const resolvedMonth = normalizeMonth(intent.month ?? context.month);
  const category = intent.category?.trim().toLowerCase() ?? null;
  const descriptionContains = intent.descriptionContains?.trim().toLowerCase() ?? null;

  return expenses.filter((expense) => {
    const expenseYear = expense.year ?? expense.month?.slice(0, 4) ?? null;
    const expenseMonth = normalizeMonth(expense.month);

    if (resolvedCompany && expense.company_name !== resolvedCompany) return false;
    if (resolvedYear && expenseYear !== resolvedYear) return false;
    if (resolvedMonth && expenseMonth !== resolvedMonth) return false;
    if (category && !(expense.category ?? '').toLowerCase().includes(category)) return false;
    if (descriptionContains && !expense.description.toLowerCase().includes(descriptionContains)) return false;
    if (intent.amountMin !== null && Number(expense.amount) < intent.amountMin) return false;
    if (intent.amountMax !== null && Number(expense.amount) > intent.amountMax) return false;

    return true;
  });
}

function buildPendingDelete(
  matchedExpenses: ExpenseRow[],
  intent: DeleteIntent,
  context: { companyName?: string; year?: string; month?: string }
): PendingDelete {
  const total = matchedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  return {
    type: intent.target,
    expenseIds: matchedExpenses.map((e) => e.id),
    count: matchedExpenses.length,
    total,
    companyName: intent.companyName ?? context.companyName ?? null,
    year: intent.year ?? context.year ?? null,
    month: normalizeMonth(intent.month ?? context.month),
    category: intent.category,
    descriptionContains: intent.descriptionContains,
    summary: summarizeMatches(matchedExpenses),
  };
}

async function softDeleteExpenses(
  supabase: ReturnType<typeof createServerClient>,
  userId: string,
  expenseIds: string[]
) {
  if (expenseIds.length === 0) return 0;
  let deleted = 0;
  const CHUNK_SIZE = 500;
  for (let i = 0; i < expenseIds.length; i += CHUNK_SIZE) {
    const chunk = expenseIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from('expenses')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', chunk);
    if (error) throw error;
    deleted += chunk.length;
  }
  return deleted;
}

export async function POST(req: NextRequest) {
  try {
    if (!anthropicKey) {
      return NextResponse.json({ error: 'Chat API key is not configured' }, { status: 500 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ChatRequestBody;
    const { messages, year, month, companyName, confirmDelete, pendingDelete } = body;
    const context = { companyName, year, month };

    let query = supabase
      .from('expenses')
      .select('id, date, description, amount, category, company_name, year, month')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(500);

    if (companyName) query = query.eq('company_name', companyName);
    if (year && month) query = query.eq('month', `${year}-${normalizeMonth(month) ?? month}`);
    else if (year) query = query.eq('year', year);

    const { data: scopedExpenses, error: scopedError } = await query;
    if (scopedError) throw scopedError;

    // Handle confirmed delete
    if (confirmDelete && pendingDelete) {
      const latestUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content;
      if (!isAgreementMessage(latestUserMessage)) {
        return NextResponse.json({ reply: 'Delete not confirmed. To proceed, type exactly: I agree' });
      }

      const deletedCount = await softDeleteExpenses(supabase, user.id, pendingDelete.expenseIds);

      if (pendingDelete.type === 'year' && pendingDelete.companyName && pendingDelete.year) {
        await supabase
          .from('folders')
          .delete()
          .eq('user_id', user.id)
          .eq('company_name', pendingDelete.companyName)
          .eq('year', pendingDelete.year);
      }

      return NextResponse.json({
        reply: `Moved ${deletedCount} expense${deletedCount === 1 ? '' : 's'} to trash for ${formatCurrency(pendingDelete.total)}. You can restore them from Trash if needed.`,
        deletedCount,
        clearPendingDelete: true,
      });
    }

    const intent = await extractDeleteIntent(messages, context);

    if (intent?.action === 'cancel') {
      return NextResponse.json({ reply: 'Delete request canceled. Nothing was removed.', clearPendingDelete: true });
    }

    if (intent?.action === 'prepare_delete') {
      const { data: allExpenses } = await supabase
        .from('expenses')
        .select('id, date, description, amount, category, company_name, year, month')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(5000);

      const matchedExpenses = filterExpenses((allExpenses ?? []) as ExpenseRow[], intent, context);

      const isBroadDelete = intent.target === 'expenses' &&
        !intent.companyName && !intent.year && !intent.month &&
        !intent.category && !intent.descriptionContains &&
        intent.amountMin === null && intent.amountMax === null;

      if (isBroadDelete) {
        return NextResponse.json({ reply: 'That delete request is too broad. Please narrow it by company, year, month, category, description, or amount.' });
      }

      if (matchedExpenses.length === 0) {
        return NextResponse.json({ reply: 'I could not find any matching expenses to delete.' });
      }

      const pending = buildPendingDelete(matchedExpenses, intent, context);
      const scopeLabel = pending.type === 'month'
        ? `${pending.companyName ? `${pending.companyName} / ` : ''}${pending.year}-${pending.month}`
        : pending.type === 'year'
          ? `${pending.companyName ? `${pending.companyName} / ` : ''}${pending.year}`
          : 'the matching expenses';

      const extraCount = pending.count > 5 ? `\n...and ${pending.count - 5} more.` : '';

      return NextResponse.json({
        reply: `I found ${pending.count} expense${pending.count === 1 ? '' : 's'} in ${scopeLabel} totaling ${formatCurrency(pending.total)}.\n\nPreview:\n${pending.summary}${extraCount}\n\nIf this looks right, type exactly: I agree`,
        pendingDelete: pending,
      });
    }

    const reply = await generateReply(
      buildSystemPrompt((scopedExpenses ?? []) as ExpenseRow[], context),
      messages
    );

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to get response' }, { status: 500 });
  }
}
