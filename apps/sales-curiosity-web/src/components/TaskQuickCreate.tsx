"use client";

import { useState } from "react";

export default function TaskQuickCreate() {
  const [type, setType] = useState<"research" | "email" | "briefing">("research");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create task");
      setDescription("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createTask} className="rounded-xl border bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-base font-medium">Quick task</h2>
      <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Create a task that will appear in the Admin dashboard.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Type</label>
          <select
            className="rounded-md border bg-white px-2 py-2 text-sm outline-none transition focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
            value={type}
            onChange={(e) => setType(e.target.value as any)}
          >
            <option value="research">research</option>
            <option value="email">email</option>
            <option value="briefing">briefing</option>
          </select>
        </div>
        <div className="grid gap-1.5 sm:col-span-2">
          <label className="text-xs text-zinc-600 dark:text-zinc-300">Description</label>
          <input
            className="rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What should we do?"
          />
        </div>
        <div className="sm:col-span-2 flex items-center gap-3">
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !description}
          >
            {loading ? "Creating…" : "Create task"}
          </button>
          {success && <span className="text-xs text-emerald-600">Created!</span>}
          {error && <span className="text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </form>
  );
}


