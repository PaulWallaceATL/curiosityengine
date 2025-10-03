import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { openai } from '../../../lib/openai';

const legacySchema = z.object({
  subject: z.string().min(1),
  context: z.string().min(1),
});

const linkedinSchema = z.object({
  // Accept relaxed strings; we'll normalize/validate at runtime
  linkedinUrl: z.string().min(3),
  personalContext: z.string().min(1),
  linkedinContent: z.string().optional(),
  tone: z.enum(['casual', 'professional', 'warm', 'concise']).optional(),
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

    // Support both legacy and new schema for flexibility
    const legacy = legacySchema.safeParse(json);
    const modern = linkedinSchema.safeParse(json);

    if (!legacy.success && !modern.success) {
      return NextResponse.json({ error: 'Invalid payload: provide linkedinUrl and personalContext or subject and context.' }, { status: 400, headers: corsHeaders(origin) });
    }

    const useMock = process.env.NEXT_PUBLIC_MOCK_AI === '1' || process.env.MOCK_AI === '1';

    if (legacy.success) {
      const { subject, context } = legacy.data;
      if (useMock) {
        const mock = generateMockEmail('https://linkedin.com/in/mock', context, undefined, 'professional');
        return NextResponse.json({ ok: true, subject: mock.subject, body: mock.body }, { headers: corsHeaders(origin) });
      }
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Draft a concise, professional outreach email.' },
          { role: 'user', content: `Subject: ${subject}\nContext: ${context}` },
        ],
      });
      const draft = completion.choices?.[0]?.message?.content || '';
      return NextResponse.json({ ok: true, subject, body: draft }, { headers: corsHeaders(origin) });
    } else if (modern.success) {
      // Modern flow: use LinkedIn URL and context
      const { linkedinUrl, personalContext } = modern.data;
      const normalizedUrl = normalizeLinkedinUrl(linkedinUrl);
      let enrichedContent = modern.data.linkedinContent;
      // Optional server-side fetch of LinkedIn content when enabled
      if (!enrichedContent && (process.env.ENABLE_LINKEDIN_FETCH === '1')) {
        try {
          enrichedContent = await fetchLinkedinText(normalizedUrl);
        } catch (e) {
          console.warn('LinkedIn fetch failed:', e);
        }
      }
      const prompt = buildEmailPrompt({ linkedinUrl: normalizedUrl, personalContext, linkedinContent: enrichedContent, tone: modern.data.tone });
      try {
        if (useMock) {
          const mock = generateMockEmail(normalizedUrl, personalContext, enrichedContent, modern.data.tone);
          return NextResponse.json({ ok: true, subject: mock.subject, body: mock.body }, { headers: corsHeaders(origin) });
        }
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are an expert SDR writing highly personalized, relevant emails. Keep it short, specific, and value-driven.' },
            { role: 'user', content: prompt },
          ],
        });
        const content = completion.choices?.[0]?.message?.content || '';
        const { subject, body } = parseEmail(content);
        return NextResponse.json({ ok: true, subject, body }, { headers: corsHeaders(origin) });
      } catch (apiErr: any) {
        if (useMock) {
          const mock = generateMockEmail(normalizedUrl, personalContext, enrichedContent, modern.data.tone);
          return NextResponse.json({ ok: true, subject: mock.subject, body: mock.body }, { headers: corsHeaders(origin) });
        }
        // Graceful message for quota or key issues
        const message = apiErr?.code === 'insufficient_quota' || apiErr?.status === 429
          ? 'OpenAI quota exceeded. Please update billing or use a key with quota.'
          : 'Upstream AI error. Please try again.';
        return NextResponse.json({ error: message }, { status: 500, headers: corsHeaders(origin) });
      }
    } else {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: corsHeaders(origin) });
    }
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

function normalizeLinkedinUrl(raw: string): string {
  let v = (raw || '').trim();
  if (!/^https?:\/\//i.test(v)) v = `https://${v}`;
  return v;
}

function buildEmailPrompt(input: { linkedinUrl: string; personalContext: string; linkedinContent?: string; tone?: string }) {
  const tone = input.tone || 'professional';
  return [
    `You will generate a short, specific outreach email.`,
    `- LinkedIn profile URL: ${input.linkedinUrl}`,
    input.linkedinContent ? `- LinkedIn profile content: ${input.linkedinContent}` : `- If content is missing, infer from the URL and keep assumptions modest.`,
    `- Sender context (who I am, who these people are to me): ${input.personalContext}`,
    `- Tone: ${tone}`,
    `Format the response exactly as:`,
    `Subject: <one compelling subject line>`,
    `Body:`,
    `<3-6 sentence email body with a single clear CTA>`,
  ].join('\n');
}

function parseEmail(text: string): { subject: string; body: string } {
  const subjectMatch = text.match(/Subject:\s*(.+)/i);
  const bodyIndex = text.indexOf('Body:');
  const subject = subjectMatch ? subjectMatch[1].trim() : 'Quick intro';
  const body = bodyIndex >= 0 ? text.slice(bodyIndex + 5).trim() : text.trim();
  return { subject, body };
}

async function fetchLinkedinText(url: string): Promise<string | undefined> {
  // IMPORTANT: Many LinkedIn pages are behind auth and block scraping.
  // This fetch only works if the URL is publicly accessible and CORS allows it.
  // For production, fetch via your extension content script or a dedicated scraper/backend integration.
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SalesCuriosityBot/1.0)'
      },
      // Avoid sending cookies; respect privacy and TOS.
      credentials: 'omit',
      cache: 'no-store',
    } as RequestInit);
    if (!res.ok) return undefined;
    const html = await res.text();
    // Basic text extraction fallback; prefer extension scraping for accuracy.
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.slice(0, 4000);
  } catch {
    return undefined;
  }
}

function generateMockEmail(linkedinUrl: string, personalContext: string, linkedinContent?: string, tone?: string) {
  const subject = `Quick intro — exploring a fit based on your work at ${new URL(linkedinUrl).pathname.split('/').pop() || 'LinkedIn'}`;
  const body = [
    `Hi there — I came across your profile (${linkedinUrl}) and thought I’d reach out.`,
    `Context: ${personalContext}.`,
    linkedinContent ? `From your profile: ${linkedinContent.slice(0, 160)}...` : `I kept this short since I don’t have full profile text.`,
    `Would you be open to a quick 15-minute chat next week to see if this is useful?`,
    `Best,\nSales Curiosity`
  ].join('\n\n');
  return { subject, body };
}


