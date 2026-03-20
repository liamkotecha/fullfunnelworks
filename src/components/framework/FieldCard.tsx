/**
 * FieldCard — completion state wrapper for questions/inputs.
 * Shows visual state: not started, focused, answered+saved, saving.
 */
"use client";

import { useState, useRef, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldCardProps {
  fieldId: string;
  isAnswered: boolean;
  isSaving: boolean;
  isSaved?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  /** Hide the persistent green check when answered (e.g. for checklist items with their own check) */
  hideCompletionCheck?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FieldCard = memo(function FieldCard({
  fieldId,
  isAnswered,
  isSaving,
  isSaved = false,
  hasError = false,
  onRetry,
  hideCompletionCheck = false,
  children,
  className,
}: FieldCardProps) {
  const [isFocused, setIsFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const borderColor = hasError
    ? "border-amber-300"
    : isFocused
      ? "border-slate-400"
      : "border-slate-200";

  const bgColor = isFocused
    ? "bg-slate-50"
    : "bg-white";

  return (
    <div
      ref={ref}
      id={`field-${fieldId}`}
      className={cn(
        "relative rounded-lg border p-5 pr-10 transition-all duration-200",
        borderColor,
        bgColor,
        className
      )}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
    >
      {/* Top-right status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <AnimatePresence mode="wait">
          {isSaving && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-xs text-amber-600"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving…</span>
            </motion.div>
          )}

          {isSaved && !isSaving && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1 text-xs text-brand-green"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Saved</span>
            </motion.div>
          )}

          {hasError && !isSaving && (
            <motion.button
              key="error"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={onRetry}
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Not saved — tap to retry</span>
            </motion.button>
          )}

          {!hideCompletionCheck && isAnswered && !isSaving && !isSaved && !hasError && (
            <motion.div
              key="check"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-[#141414] text-brand-green"
            >
              <Check className="w-3 h-3" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {children}
    </div>
  );
});
