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
    <form onSubmit={draft} className="grid gap-4">
      <div className="grid gap-3">
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-300">LinkedIn URL</label>
          <input
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="https://www.linkedin.com/in/..."
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            ref={inputRef}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-300">Your personal context</label>
          <textarea
            rows={4}
            className="resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Who you are, relationship to the prospect, why you're reaching out, any shared ties"
            value={personalContext}
            onChange={(e) => setPersonalContext(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-300">Optional: pasted LinkedIn profile content</label>
          <textarea
            rows={4}
            className="resize-none rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Paste scraped content here to improve personalization"
            value={linkedinContent}
            onChange={(e) => setLinkedinContent(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-slate-300">Tone</label>
          <select
            className="rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:bg-indigo-700 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || !linkedinUrl || !personalContext}
        >
          {loading ? "Drafting…" : "Draft email"}
        </button>
      </div>
      
      {error && (
        <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      
      {result && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold text-white">Subject</span>
            <button 
              className="text-xs text-indigo-400 hover:text-indigo-300 transition" 
              onClick={(e) => { e.preventDefault(); copy(result.subject); }}
            >
              Copy
            </button>
          </div>
          <p className="mb-4 text-slate-300">{result.subject}</p>
          <div className="mb-3 flex items-center justify-between border-t border-slate-700 pt-3">
            <span className="font-semibold text-white">Body</span>
            <button 
              className="text-xs text-indigo-400 hover:text-indigo-300 transition" 
              onClick={(e) => { e.preventDefault(); copy(result.body); }}
            >
              Copy
            </button>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-300">{result.body}</pre>
        </div>
      )}
    </form>
  );
}


