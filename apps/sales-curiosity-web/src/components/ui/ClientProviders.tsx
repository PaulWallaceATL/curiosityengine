"use client";

import { ToastProvider } from "./ToastProvider";
import { CommandPaletteProvider } from "./CommandPalette";
import PaletteFAB from "./PaletteFAB";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <CommandPaletteProvider>
        {children}
        <PaletteFAB />
      </CommandPaletteProvider>
    </ToastProvider>
  );
}


