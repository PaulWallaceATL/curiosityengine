import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabase } from '../../../lib/supabase';

const createSchema = z.object({
  type: z.enum(['research', 'email', 'briefing']),
  description: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  return NextResponse.json({}, { status: 200, headers: corsHeaders(origin) });
}

export async function GET(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }

    // If Supabase env is missing, fall back to in-memory store for local demo
    const supabase = getSupabase();
    if (!supabase) {
      const tasks = getMemoryStore();
      return NextResponse.json({ ok: true, tasks }, { headers: corsHeaders(origin) });
    }

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({ ok: true, tasks: data }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('GET /api/tasks error', err);
    // Graceful fallback for local dev if DB errors
    const tasks = getMemoryStore();
    return NextResponse.json({ ok: true, tasks, note: 'Using in-memory store due to DB error' }, { status: 200, headers: corsHeaders() });
  }
}

export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin');
    if (!isAllowedOrigin(origin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403, headers: corsHeaders(origin) });
    }
    const json = await req.json();
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400, headers: corsHeaders(origin) });
    }
    const payload = parsed.data as any;

    const supabase = getSupabase();
    if (!supabase) {
      const task = addToMemoryStore(payload);
      return NextResponse.json({ ok: true, task, note: 'Stored in-memory (no Supabase env)' }, { headers: corsHeaders(origin) });
    }

    const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();
    if (error) throw error;
    return NextResponse.json({ ok: true, task: data }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('POST /api/tasks error', err);
    // Try to use the payload if it was valid earlier
    let task: TaskRecord | null = null;
    try {
      const body = await req.clone().json();
      const parsed = createSchema.safeParse(body);
      if (parsed.success) {
        task = addToMemoryStore(parsed.data as any);
      }
    } catch {}
    if (!task) task = addToMemoryStoreFallback();
    return NextResponse.json({ ok: true, task, note: 'Stored in-memory due to DB error' }, { status: 200, headers: corsHeaders() });
  }
}

function isAllowedOrigin(origin: string | null) {
  // Allow same-origin (no Origin header) and common local dev host
  if (!origin) return true;
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

type TaskRecord = { id: string; user_id?: string; type: 'research' | 'email' | 'briefing'; description: string; created_at: string; metadata?: Record<string, unknown> };
type GlobalWithStore = typeof globalThis & { __TASKS_STORE?: TaskRecord[] };

function getMemoryStore(): TaskRecord[] {
  const g = globalThis as GlobalWithStore;
  if (!g.__TASKS_STORE) g.__TASKS_STORE = [];
  return g.__TASKS_STORE;
}

function addToMemoryStore(input?: Partial<TaskRecord>): TaskRecord {
  const store = getMemoryStore();
  const record: TaskRecord = {
    id: cryptoRandomId(),
    type: (input?.type as any) || 'research',
    description: input?.description || 'New task',
    created_at: new Date().toISOString(),
    metadata: input?.metadata || {},
    user_id: input?.user_id,
  };
  store.unshift(record);
  return record;
}

function addToMemoryStoreFallback(): TaskRecord {
  return addToMemoryStore({ description: 'Created (fallback)' });
}

function cryptoRandomId(): string {
  try {
    // Create a short random id
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2);
  }
}


