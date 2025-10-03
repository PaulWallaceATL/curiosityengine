"use client";

import { useState } from "react";
import { useToast } from "./ui/useToast";
import { useEffect, useRef } from "react";

export default function EmailDrafter() {
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [linkedinContent, setLinkedinContent] = useState("");
  const [tone, setTone] = useState<"casual" | "professional" | "warm" | "concise">("professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    function onFocus() {
      inputRef.current?.focus();
    }
    window.addEventListener("focus-email-drafter", onFocus as EventListener);
    return () => window.removeEventListener("focus-email-drafter", onFocus as EventListener);
  }, []);

  const inputRef = useRef<HTMLInputElement | null>(null);

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
      toast({ title: "Draft ready", description: "Your AI-drafted email is ready.", variant: "success" });
    } catch (e: any) {
      setError(e.message);
      toast({ title: "Draft failed", description: e.message, variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Copied to clipboard", variant: "info", durationMs: 1500 });
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
            ref={inputRef}
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
            className="skeleton resize-none rounded-md border bg-white px-3 py-2 text-sm outline-none transition placeholder:text-zinc-400 focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950"
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
          <div className="card-surface rounded-lg border bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
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


