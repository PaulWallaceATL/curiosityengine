"use client";

import { useState } from "react";
import { useToast } from "./ui/useToast";
import { useEffect, useRef } from "react";

export default function TaskQuickCreate() {
  const [type, setType] = useState<"research" | "email" | "briefing">("research");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    function onOpen() {
      inputRef.current?.focus();
    }
    window.addEventListener("open-quick-task", onOpen as EventListener);
    return () => window.removeEventListener("open-quick-task", onOpen as EventListener);
  }, []);

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
      toast({ title: "Task created", description: "Task added to Admin dashboard.", variant: "success" });
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Task failed", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createTask} className="grid gap-3">
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-300">Type</label>
        <select
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="research">Research</option>
          <option value="email">Email</option>
          <option value="briefing">Briefing</option>
        </select>
      </div>
      
      <div className="grid gap-2">
        <label className="text-sm font-medium text-slate-300">Description</label>
        <input
          className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What should we do?"
          ref={inputRef}
        />
      </div>
      
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={loading || !description}
      >
        {loading ? "Creating…" : "Create task"}
      </button>
      
      {success && (
        <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/30 px-4 py-2 text-sm text-emerald-400">
          Task created successfully!
        </div>
      )}
      
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
    </form>
  );
}


