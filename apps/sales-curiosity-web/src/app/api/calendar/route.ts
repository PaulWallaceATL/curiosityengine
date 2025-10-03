import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders() });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') || '';
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }
    // Placeholder: return empty calendar events for now
    return NextResponse.json({ ok: true, events: [] }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500, headers: corsHeaders() });
  }
}

function isAllowedOrigin(origin: string) {
  const allowed = ['chrome-extension://', process.env.NEXT_PUBLIC_APP_URL || '', 'https://your-app.vercel.app'];
  return allowed.some((prefix) => origin.startsWith(prefix));
}

function corsHeaders(origin?: string) {
  const o = origin || '*';
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  } as Record<string, string>;
}


