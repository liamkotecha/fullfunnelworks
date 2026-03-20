"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { ToastProvider, useToast } from "./ToastContext";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { Toast, ToastVariant } from "@/types";

const ICONS: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const RING_COLORS: Record<ToastVariant, string> = {
  success: "bg-brand-green",
  error:   "bg-red-500",
  warning: "bg-amber-500",
  info:    "bg-blue-500",
};

const TEXT_COLORS: Record<ToastVariant, string> = {
  success: "text-brand-green",
  error:   "text-red-600",
  warning: "text-amber-600",
  info:    "text-blue-600",
};

const BG_COLORS: Record<ToastVariant, string> = {
  success: "bg-brand-green/10 border-brand-green/30",
  error:   "bg-red-50 border-red-200",
  warning: "bg-amber-50 border-amber-200",
  info:    "bg-blue-50 border-blue-200",
};

function ToastItem({ id, variant, title, message, duration = 5000 }: Toast) {
  const { dismiss } = useToast();
  const [progress, setProgress] = useState(100);
  const startRef = useRef<number>(Date.now());
  const rafRef = useRef<number>();
  const Icon = ICONS[variant];

  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(update);
      }
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [duration]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.94 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.94 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "relative w-80 rounded-lg border shadow overflow-hidden",
        BG_COLORS[variant]
      )}
    >
      <div className="flex items-start gap-3 p-4 pr-9">
        <Icon className={cn("w-5 h-5 mt-0.5 flex-shrink-0", TEXT_COLORS[variant])} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-navy leading-snug">{title}</p>
          {message && <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">{message}</p>}
        </div>
      </div>
      <button
        onClick={() => dismiss(id)}
        className="absolute top-3 right-3 p-0.5 rounded text-slate-400 hover:text-slate-600 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      {/* Progress bar */}
      <div className="h-0.5 bg-black/5">
        <div
          className={cn("h-full transition-none", RING_COLORS[variant])}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

function ToasterInner() {
  const { toasts } = useToast();
  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="sync">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem {...t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function Toaster() {
  return (
    <ToastProvider>
      <ToasterInner />
    </ToastProvider>
  );
}
