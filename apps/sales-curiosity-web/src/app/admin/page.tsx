"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Task = {
  id: string;
  user_id?: string;
  type: "research" | "email" | "briefing";
  description: string;
  created_at: string;
};

export default function AdminPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState<Task["type"]>("research");
  const [description, setDescription] = useState("");
  const [filter, setFilter] = useState<"all" | Task["type"]>("all");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  // Check authorization on mount
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Check if user has admin role
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (error || !userData || (userData.role !== 'org_admin' && userData.role !== 'super_admin')) {
      router.push('/');
      return;
    }

    setAuthorized(true);
  }

  // Don't render anything until auth check is complete
  if (authorized === null) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(to bottom, rgb(15 23 42), rgb(15 23 42))'
      }}>
        <div style={{ color: '#94a3b8' }}>Checking authorization...</div>
      </div>
    );
  }

  if (!authorized) {
    return null; // Router will redirect
  }

  async function fetchTasks() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", { method: "GET" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch tasks");
      setTasks(data.tasks || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create task");
      setDescription("");
      await fetchTasks();
      setSuccessMsg("Task created successfully");
      setTimeout(() => setSuccessMsg(null), 2000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  const filtered = tasks.filter((t) => (filter === "all" ? true : t.type === filter));
  const total = tasks.length;
  const byType = {
    research: tasks.filter((t) => t.type === "research").length,
    email: tasks.filter((t) => t.type === "email").length,
    briefing: tasks.filter((t) => t.type === "briefing").length,
  } as const;

  return (
    <main className="min-h-screen bg-gradient-to-b from-indigo-950 via-zinc-950 to-black">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-indigo-200">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Live demo — no auth required
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Sales Curiosity — Admin</h1>
            <p className="mt-1 text-sm text-zinc-300">Create and review tasks powering the extension experience.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchTasks()}
              className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white backdrop-blur transition hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="opacity-70"><path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="1.5"/><path d="M21 3v6h-6" stroke="currentColor" strokeWidth="1.5"/></svg>
              Refresh
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Total tasks" value={total} accent="bg-blue-500" />
          <StatCard label="Research" value={byType.research} accent="bg-emerald-500" />
          <StatCard label="Email / Briefing" value={byType.email + byType.briefing} accent="bg-amber-500" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <form onSubmit={createTask} className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-lg backdrop-blur">
              <h2 className="text-base font-medium text-white">Create task</h2>
              <p className="mt-1 text-xs text-zinc-300">Describe the action for the engine to perform.</p>
              <div className="mt-4 grid gap-3">
                <div className="grid gap-1.5">
                  <label className="text-xs text-zinc-300">Type</label>
                  <select
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-2 text-sm text-white outline-none transition focus:ring-2 focus:ring-indigo-500"
                    value={type}
                    onChange={(e) => setType(e.target.value as Task["type"])}
                  >
                    <option value="research">research</option>
                    <option value="email">email</option>
                    <option value="briefing">briefing</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs text-zinc-300">Description</label>
                  <textarea
                    rows={4}
                    className="resize-none rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-500"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Research ACME Corp decision makers and summarize the top 5 insights"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                  disabled={loading || !description}
                >
                  {loading ? "Working…" : "Create task"}
                </button>
                {successMsg && (
                  <p className="text-xs text-emerald-400">{successMsg}</p>
                )}
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
            </form>
          </div>

          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-medium text-white">Recent tasks</h2>
              <div className="flex items-center gap-2">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="rounded-md border border-white/10 bg-white/5 px-2 py-1.5 text-xs text-white outline-none"
                >
                  <option value="all">All types</option>
                  <option value="research">Research</option>
                  <option value="email">Email</option>
                  <option value="briefing">Briefing</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur">
              {loading && tasks.length === 0 ? (
                <div className="p-6">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-10 text-center">
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="text-zinc-400"><path d="M4 7a2 2 0 0 1 2-2h8.5a2 2 0 0 1 1.6.8l2.5 3.3a2 2 0 0 1 .4 1.2V17a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7Z" stroke="currentColor" strokeWidth="1.5"/><path d="M8 12h8M8 15h5" stroke="currentColor" strokeWidth="1.5"/></svg>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">No tasks yet. Create your first one on the left.</p>
                </div>
              ) : (
                <table className="w-full table-fixed text-sm">
                  <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide dark:bg-zinc-950">
                    <tr>
                      <th className="px-4 py-3 w-[120px]">Type</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 w-[180px]">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, idx) => (
                      <tr key={t.id} className={idx % 2 === 0 ? "" : "bg-zinc-50/60 dark:bg-zinc-950/60"}>
                        <td className="px-4 py-3">
                          <span className={
                            "inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs capitalize " +
                            (t.type === "research"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : t.type === "email"
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300")
                          }>
                            {t.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-zinc-800 dark:text-zinc-200">{t.description}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{new Date(t.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Email drafting panel */}
            <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-base font-medium">Draft personalized email from LinkedIn</h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Paste a LinkedIn profile URL and describe your personal context. Optionally paste scraped profile content.</p>

              <EmailDrafter />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function EmailDrafter() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [tone, setTone] = useState<"casual" | "professional" | "warm" | "concise">("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);

  async function draft(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinUrl, personalContext, linkedinContent: linkedinContent || undefined, tone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to draft email");
      setResult({ subject: data.subject, body: data.body });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <form onSubmit={draft} className="mt-4 grid gap-4 lg:grid-cols-2">
      <div className="grid gap-3">
        <div className="grid gap-1.5">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">LinkedIn URL</label>
          <input
            className="rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="https://www.linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Your personal context</label>
          <textarea
            rows={4}
            className="resize-none rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Who you are, relationship to the prospect, why you’re reaching out, any shared ties"
            value={personalContext}
            onChange={(e) => setPersonalContext(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Optional: pasted LinkedIn profile content</label>
          <textarea
            rows={6}
            className="resize-none rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Paste scraped content here to improve personalization"
            value={linkedinContent}
            onChange={(e) => setLinkedinContent(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Tone</label>
          <select
            className="w-fit rounded-md border bg-white px-2 py-1.5 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-950"
            value={tone}
            onChange={(e) => setTone(e.target.value as any)}
          >
            <option value="professional">Professional</option>
            <option value="warm">Warm</option>
            <option value="casual">Casual</option>
            <option value="concise">Concise</option>
          </select>
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
          disabled={loading || !linkedinUrl || !personalContext}
        >
          {loading ? "Drafting…" : "Draft email"}
        </button>
        {error && <p className="text-xs text-red-600">{error}</p>}
        {result && (
          <div className="rounded-lg border bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center justify-between">
              <strong>Subject</strong>
              <button className="text-xs underline" onClick={(e) => { e.preventDefault(); copy(result.subject); }}>Copy</button>
            </div>
            <p className="mb-4">{result.subject}</p>
            <div className="mb-2 flex items-center justify-between">
              <strong>Body</strong>
              <button className="text-xs underline" onClick={(e) => { e.preventDefault(); copy(result.body); }}>Copy</button>
            </div>
            <pre className="whitespace-pre-wrap text-sm leading-6">{result.body}</pre>
          </div>
        )}
      </div>
    </form>
  );
}

function StatCard(props: { label: string; value: number; accent: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className={`absolute -right-6 -top-6 size-16 rounded-full opacity-20 ${props.accent}`}></div>
      <p className="text-xs text-zinc-600 dark:text-zinc-400">{props.label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">{props.value}</p>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 rounded bg-zinc-200 dark:bg-zinc-800"></div>
      <div className="h-4 w-5/6 rounded bg-zinc-200 dark:bg-zinc-800"></div>
      <div className="h-4 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800"></div>
    </div>
  );
}


