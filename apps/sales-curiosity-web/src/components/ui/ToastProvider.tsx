"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

export type ToastVariant = "default" | "success" | "error" | "info";

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastContextValue = {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToastContext must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      const next: Toast = { id, variant: "default", durationMs: 2500, ...toast };
      setToasts((prev) => [next, ...prev].slice(0, 5));
      if (next.durationMs && next.durationMs > 0) {
        window.setTimeout(() => dismissToast(id), next.durationMs);
      }
      return id;
    },
    [dismissToast]
  );

  const value = useMemo<ToastContextValue>(() => ({ toasts, showToast, dismissToast }), [toasts, showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast" data-variant={t.variant || "default"}>
            {t.title && <div className="text-[13px] font-medium">{t.title}</div>}
            {t.description && <div className="text-[12px] opacity-80">{t.description}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}


