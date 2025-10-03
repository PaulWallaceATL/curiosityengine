"use client";

import { useToastContext } from "./ToastProvider";

export function useToast() {
  const { showToast, dismissToast } = useToastContext();
  return { toast: showToast, dismiss: dismissToast };
}


