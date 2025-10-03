"use client";

import { useCommandPalette } from "./CommandPalette";

export default function PaletteFAB() {
  const { open } = useCommandPalette();
  return (
    <button
      onClick={open}
      aria-label="Open Command Palette"
      className="fixed bottom-20 right-6 z-50 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/80 text-zinc-900 shadow-lg backdrop-blur transition hover:scale-105 hover:shadow-xl active:scale-95 dark:border-white/10 dark:bg-zinc-900/90 dark:text-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="M5 13q-.425 0-.712-.288T4 12t.288-.712T5 11h14q.425 0 .713.288T20 12t-.288.713T19 13zm0 4q-.425 0-.712-.288T4 16t.288-.712T5 15h10q.425 0 .713.288T16 16t-.288.713T15 17zM5 9q-.425 0-.712-.288T4 8t.288-.712T5 7h14q.425 0 .713.288T20 8t-.288.713T19 9z"/></svg>
    </button>
  );
}


