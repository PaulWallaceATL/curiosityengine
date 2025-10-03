import { z } from 'zod';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export const ChatResponseSchema = z.object({ ok: z.boolean(), content: z.string().optional(), error: z.string().optional() });
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || 'Request failed');
  return data as T;
}

export async function chat(message: string) {
  const data = await request<ChatResponse>('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
  return ChatResponseSchema.parse(data);
}

async function getToken(): Promise<string | null> {
  try {
    const result = await chrome.storage.local.get(['authToken']);
    return (result as any)?.authToken || null;
  } catch {
    return null;
  }
}


