import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openAiApiKey = process.env.OPENAI_API_KEY ?? process.env.openai_key;
const openAiModel = process.env.OPENAI_MODEL ?? 'gpt-4.1-mini';

export async function POST(req: NextRequest) {
  try {
    if (!openAiApiKey) {
      return NextResponse.json({ error: 'OpenAI chat API key is not configured' }, { status: 500 });
    }

    // Authenticate the user via Supabase session cookie
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messages, year, month } = await req.json();

    // Fetch user's expenses for context — limit to current month/year if provided
    let query = supabase
      .from('expenses')
      .select('date, description, amount, category')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(500);

    if (year && month) {
      const monthKey = `${year}-${month}`;
      query = query.eq('month', monthKey);
    } else if (year) {
      query = query.eq('year', year);
    }

    const { data: expenses } = await query;

    // Summarize expenses for the system prompt
    const total = (expenses ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    const expenseSummary = (expenses ?? [])
      .map((e) => `${e.date} | ${e.description} | $${Number(e.amount).toFixed(2)} | ${e.category}`)
      .join('\n');

    const contextLabel = year && month
      ? `${year}-${month}`
      : year
        ? year
        : 'all time';

    const systemPrompt = `You are a helpful financial assistant built into Accountant's Best Friend, an expense tracking tool for self-employed professionals.

The user is asking about their business expenses. Here is their expense data for ${contextLabel} (${(expenses ?? []).length} expenses, total $${total.toFixed(2)}):

DATE | DESCRIPTION | AMOUNT | IRS CATEGORY
${expenseSummary || '(no expenses found for this period)'}

Answer questions about these expenses accurately. You can:
- Summarize totals by category, month, or date range
- Find specific expenses by description or amount
- Identify the largest expenses
- Calculate percentages and comparisons
- Suggest which IRS Schedule C line items apply

Be concise and specific. Use dollar amounts. If asked something outside of this expense data, politely say you can only help with their expense data.`;

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: openAiModel,
        store: false,
        instructions: systemPrompt,
        max_output_tokens: 1024,
        input: messages.map((m: { role: string; content: string }) => ({
          role: m.role,
          content: [
            {
              type: 'input_text',
              text: m.content,
            },
          ],
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      console.error('OpenAI chat API error:', payload);
      const message =
        payload?.error?.message ??
        'Failed to get response from OpenAI';

      return NextResponse.json({ error: message }, { status: 500 });
    }

    const reply = typeof payload?.output_text === 'string' ? payload.output_text.trim() : '';

    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
