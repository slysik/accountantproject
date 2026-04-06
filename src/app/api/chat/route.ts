import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const anthropicApiKey = process.env.claude_key ?? process.env.ANTHROPIC_API_KEY;

const anthropic = new Anthropic({
  apiKey: anthropicApiKey!,
});

export async function POST(req: NextRequest) {
  try {
    if (!anthropicApiKey) {
      return NextResponse.json({ error: 'Chat API key is not configured' }, { status: 500 });
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

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';
    return NextResponse.json({ reply });
  } catch (err) {
    console.error('Chat API error:', err);
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
