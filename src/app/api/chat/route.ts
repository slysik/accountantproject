import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openAiApiKey = process.env.OPENAI_API_KEY ?? process.env.openai_key;
const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

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

const DELETE_INTENT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'action',
    'target',
    'companyName',
    'year',
    'month',
    'category',
    'descriptionContains',
    'amountMin',
    'amountMax',
    'deleteAllInScope',
  ],
  properties: {
    action: {
      type: 'string',
      enum: ['answer', 'prepare_delete', 'cancel'],
    },
    target: {
      type: 'string',
      enum: ['expenses', 'month', 'year'],
    },
    companyName: { type: ['string', 'null'] },
    year: { type: ['string', 'null'] },
    month: { type: ['string', 'null'] },
    category: { type: ['string', 'null'] },
    descriptionContains: { type: ['string', 'null'] },
    amountMin: { type: ['number', 'null'] },
    amountMax: { type: ['number', 'null'] },
    deleteAllInScope: { type: 'boolean' },
  },
} as const;

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

async function callOpenAI(body: Record<string, unknown>) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    console.error('OpenAI chat API error:', payload);
    const message = payload?.error?.message ?? 'Failed to get response from OpenAI';
    throw new Error(message);
  }

  return payload;
}

async function extractDeleteIntent(
  messages: ChatMessage[],
  context: { companyName?: string; year?: string; month?: string }
): Promise<DeleteIntent | null> {
  const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
  if (!latestUserMessage) return null;

  const payload = await callOpenAI({
    model: openAiModel,
    store: false,
    max_output_tokens: 300,
    instructions: `You classify whether a user's latest message is asking to delete expense data.

Return JSON only.

Rules:
- action = "prepare_delete" only if the user is explicitly asking to delete, remove, or trash expense data.
- action = "cancel" only if the user is canceling a pending delete request.
- Otherwise action = "answer".
- target = "month" when the user wants to delete an entire month of expenses.
- target = "year" when the user wants to delete an entire year of expenses.
- target = "expenses" for selective expense deletion by description, category, amount, or similar filters.
- Use the current page context when the user refers to "this month", "this year", or the current company.
- month must be two digits like "01" when known.
- If a field is unknown, return null for it.
- deleteAllInScope should be true only when the user means to delete everything in the resolved month/year/scope.`,
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Current context:
companyName=${context.companyName ?? 'null'}
year=${context.year ?? 'null'}
month=${context.month ?? 'null'}

Latest user message:
${latestUserMessage}`,
          },
        ],
      },
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'delete_intent',
        strict: true,
        schema: DELETE_INTENT_SCHEMA,
      },
    },
  });

  try {
    const text = typeof payload?.output_text === 'string' ? payload.output_text.trim() : '';
    return text ? (JSON.parse(text) as DeleteIntent) : null;
  } catch (error) {
    console.error('Failed to parse delete intent:', error);
    return null;
  }
}

async function generateReply(systemPrompt: string, messages: ChatMessage[]): Promise<string> {
  const payload = await callOpenAI({
    model: openAiModel,
    store: false,
    instructions: systemPrompt,
    max_output_tokens: 1024,
    input: messages.map((message) => ({
      role: message.role,
      content: [
        {
          type: 'input_text',
          text: message.content,
        },
      ],
    })),
  });

  return typeof payload?.output_text === 'string' ? payload.output_text.trim() : '';
}

function buildSystemPrompt(
  expenses: ExpenseRow[],
  context: { year?: string; month?: string; companyName?: string }
): string {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const expenseSummary = expenses
    .map((expense) =>
      `${expense.date} | ${(expense.company_name ?? 'My Company')} | ${expense.description} | ${formatCurrency(Number(expense.amount))} | ${expense.category}`
    )
    .join('\n');

  const contextLabel = context.year && context.month
    ? `${context.companyName ? `${context.companyName} / ` : ''}${context.year}-${context.month}`
    : context.year
      ? `${context.companyName ? `${context.companyName} / ` : ''}${context.year}`
      : context.companyName
        ? `${context.companyName}`
        : 'all time';

  return `You are a helpful financial assistant built into Accountant's Best Friend, an expense tracking tool for self-employed professionals.

The user is asking about their business expenses. Here is their expense data for ${contextLabel} (${expenses.length} expenses, total ${formatCurrency(total)}):

DATE | COMPANY | DESCRIPTION | AMOUNT | IRS CATEGORY
${expenseSummary || '(no expenses found for this period)'}

Answer questions about these expenses accurately. You can:
- Summarize totals by category, month, or date range
- Find specific expenses by description or amount
- Identify the largest expenses
- Calculate percentages and comparisons
- Explain what a delete request would affect, but do not claim a delete already happened unless it was explicitly confirmed and executed by the app

Be concise and specific. Use dollar amounts. If asked something outside of this expense data, politely say you can only help with their expense data.`;
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
    const companyName = expense.company_name ?? null;
    const expenseYear = expense.year ?? expense.month?.slice(0, 4) ?? null;
    const expenseMonth = normalizeMonth(expense.month);

    if (resolvedCompany && companyName !== resolvedCompany) return false;
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
  const companyName = intent.companyName ?? context.companyName ?? null;
  const year = intent.year ?? context.year ?? null;
  const month = normalizeMonth(intent.month ?? context.month);
  const total = matchedExpenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  return {
    type: intent.target,
    expenseIds: matchedExpenses.map((expense) => expense.id),
    count: matchedExpenses.length,
    total,
    companyName,
    year,
    month,
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

  for (let index = 0; index < expenseIds.length; index += CHUNK_SIZE) {
    const chunk = expenseIds.slice(index, index + CHUNK_SIZE);
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
    if (!openAiApiKey) {
      return NextResponse.json({ error: 'OpenAI chat API key is not configured' }, { status: 500 });
    }

    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json()) as ChatRequestBody;
    const { messages, year, month, companyName, confirmDelete, pendingDelete } = body;

    const context = { companyName, year, month };

    const { data: scopedExpenses, error: scopedError } = await (
      (() => {
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

        return query;
      })()
    );

    if (scopedError) throw scopedError;

    if (confirmDelete && pendingDelete) {
      const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user')?.content;
      if (!isAgreementMessage(latestUserMessage)) {
        return NextResponse.json({
          reply: 'Delete not confirmed. To proceed, type exactly: I agree',
        });
      }

      const deletedCount = await softDeleteExpenses(supabase, user.id, pendingDelete.expenseIds);

      if (pendingDelete.type === 'year' && pendingDelete.companyName && pendingDelete.year) {
        const { error: folderError } = await supabase
          .from('folders')
          .delete()
          .eq('user_id', user.id)
          .eq('company_name', pendingDelete.companyName)
          .eq('year', pendingDelete.year);

        if (folderError) throw folderError;
      }

      return NextResponse.json({
        reply: `Moved ${deletedCount} expense${deletedCount === 1 ? '' : 's'} to trash for ${formatCurrency(pendingDelete.total)}. You can restore them later from Trash if needed.`,
        deletedCount,
        clearPendingDelete: true,
      });
    }

    const intent = await extractDeleteIntent(messages, context);

    if (intent?.action === 'cancel') {
      return NextResponse.json({
        reply: 'Delete request canceled. Nothing was removed.',
        clearPendingDelete: true,
      });
    }

    if (intent?.action === 'prepare_delete') {
      const { data: allExpenses, error: allExpensesError } = await supabase
        .from('expenses')
        .select('id, date, description, amount, category, company_name, year, month')
        .eq('user_id', user.id)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(5000);

      if (allExpensesError) throw allExpensesError;

      const matchedExpenses = filterExpenses((allExpenses ?? []) as ExpenseRow[], intent, context);
      const isBroadAllAccountDelete =
        intent.target === 'expenses' &&
        !intent.companyName &&
        !intent.year &&
        !intent.month &&
        !intent.category &&
        !intent.descriptionContains &&
        intent.amountMin === null &&
        intent.amountMax === null;

      if (isBroadAllAccountDelete) {
        return NextResponse.json({
          reply: 'That delete request is too broad to run from chat. Please narrow it by company, year, month, category, description, or amount first.',
        });
      }

      if ((intent.target === 'month' && !(intent.year ?? year) && !(intent.month ?? month)) ||
          (intent.target === 'year' && !(intent.year ?? year))) {
        return NextResponse.json({
          reply: 'I need a clearer time scope before deleting. Tell me which year or month you want removed.',
        });
      }

      if (matchedExpenses.length === 0) {
        return NextResponse.json({
          reply: 'I could not find any matching expenses to delete. Try narrowing the description, category, company, or date range.',
        });
      }

      const pending = buildPendingDelete(matchedExpenses, intent, context);
      const scopeLabel =
        pending.type === 'month'
          ? `${pending.companyName ? `${pending.companyName} / ` : ''}${pending.year}-${pending.month}`
          : pending.type === 'year'
            ? `${pending.companyName ? `${pending.companyName} / ` : ''}${pending.year}`
            : 'the matching expenses';

      const preview = pending.summary;
      const extraCount = pending.count > 5 ? `\n...and ${pending.count - 5} more.` : '';

      return NextResponse.json({
        reply: `I found ${pending.count} expense${pending.count === 1 ? '' : 's'} in ${scopeLabel} totaling ${formatCurrency(pending.total)}.

Preview:
${preview}${extraCount}

If this looks right, type exactly: I agree

I will only move those expenses to Trash in Supabase after that exact confirmation.`,
        pendingDelete: pending,
      });
    }

    const reply = await generateReply(buildSystemPrompt((scopedExpenses ?? []) as ExpenseRow[], context), messages);

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to get response' }, { status: 500 });
  }
}
