"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  action: () => void;
};

type CommandPaletteContextValue = {
  open: () => void;
  close: () => void;
};

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null);

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext);
  if (!ctx) throw new Error("useCommandPalette must be used within <CommandPaletteProvider>");
  return ctx;
}

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const baseItems = useMemo<CommandItem[]>(() => [
    { id: "go-home", label: "Go to Home", hint: "Navigate", action: () => router.push("/") },
    { id: "go-admin", label: "Go to Admin", hint: "Navigate", action: () => router.push("/admin") },
    { id: "focus-email", label: "Focus Email Drafter", hint: "Action", action: () => {
      window.dispatchEvent(new CustomEvent("focus-email-drafter"));
    } },
    { id: "new-task", label: "Create Quick Task", hint: "Action", action: () => {
      window.dispatchEvent(new CustomEvent("open-quick-task"));
      router.push("/");
    } },
  ], [router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baseItems;
    return baseItems.filter((i) => i.label.toLowerCase().includes(q) || (i.hint || "").toLowerCase().includes(q));
  }, [baseItems, query]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      if (cmdOrCtrl && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
      if (e.key === "Escape") setIsOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <CommandPaletteContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 py-24 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-white/10 bg-white/90 shadow-2xl ring-1 ring-black/5 backdrop-blur transition dark:border-zinc-800 dark:bg-zinc-900/90" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-black/5 bg-white/60 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/60">
              <svg width="16" height="16" viewBox="0 0 24 24" className="opacity-60"><path fill="currentColor" d="M10 18q-3.35 0-5.675-2.325T2 10Q2 6.65 4.325 4.325T10 2q3.35 0 5.675 2.325T18 10q0 1.2-.325 2.3T16.7 14.3l4.5 4.5q.3.3.3.7t-.3.7q-.3.3-.7.3t-.7-.3l-4.5-4.5q-1 .725-2.1 1.05T10 18m0-2q2.5 0 4.25-1.75T16 10q0-2.5-1.75-4.25T10 4Q7.5 4 5.75 5.75T4 10q0 2.5 1.75 4.25T10 16"/></svg>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500"
              />
              <kbd className="rounded-md border bg-white/80 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">Esc</kbd>
            </div>
            <ul className="max-h-80 overflow-auto p-2">
              {filtered.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-zinc-500">No results</li>
              )}
              {filtered.map((item) => (
                <li key={item.id}>
                  <button
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-zinc-900 transition hover:bg-black/5 dark:text-zinc-100 dark:hover:bg-white/5"
                    onClick={() => { item.action(); close(); }}
                  >
                    <span>{item.label}</span>
                    {item.hint && <span className="text-[11px] opacity-60">{item.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </CommandPaletteContext.Provider>
  );
}


