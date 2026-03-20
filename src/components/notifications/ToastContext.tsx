"use client";
import { createContext, useContext, useState, useCallback, useRef } from "react";
import type { Toast, ToastVariant } from "@/types";
import { generateId } from "@/lib/utils";

interface ToastContextValue {
  toasts: Toast[];
  toast: (opts: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const toast = useCallback(
    (opts: Omit<Toast, "id">) => {
      const id = generateId();
      const duration = opts.duration ?? 5000;
      setToasts((prev) => [...prev, { ...opts, id }]);
      const timer = setTimeout(() => dismiss(id), duration);
      timers.current.set(id, timer);
    },
    [dismiss]
  );

  const make = useCallback(
    (variant: ToastVariant) =>
      (title: string, message?: string) =>
        toast({ variant, title, message }),
    [toast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        toast,
        dismiss,
        success: make("success"),
        error: make("error"),
        warning: make("warning"),
        info: make("info"),
      }}
    >
      {children}
    </ToastContext.Provider>
  );
}
