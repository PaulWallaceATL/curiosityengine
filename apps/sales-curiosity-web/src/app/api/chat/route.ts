import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai } from '../../../lib/openai';

const schema = z.object({
  message: z.string().min(1),
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { status: 200, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }

    const json = await req.json();
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: corsHeaders(origin) });
    }

    const { message } = parsed.data;

    // Simple echo with OpenAI placeholder to be replaced with streaming later
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: message },
      ],
    });

    const content = completion.choices?.[0]?.message?.content || '';
    return NextResponse.json({ ok: true, content }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders() });
  }
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true; // same-origin
  if (origin.startsWith('chrome-extension://')) return true;
  const allowed = [process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', 'http://localhost:3000', 'https://your-app.vercel.app'];
  return allowed.some((o) => origin.startsWith(o));
}

function corsHeaders(origin?: string | null) {
  const o = origin || '*';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  } as Record<string, string>;
}


