/**
 * SectionProgressHeader — sticky dark header matching sidebar bg.
 * Shows section progress, autosave pulse, and jump-to-next shortcut.
 * Always dark (#141414) — authoritative, premium, respects the C-suite audience.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionProgressHeaderProps {
  title: string;
  answeredCount: number;
  totalCount: number;
  lastSavedAt: Date | string | null;
  onJumpToNext?: () => void;
  className?: string;
}

export function SectionProgressHeader({
  title,
  answeredCount,
  totalCount,
  lastSavedAt,
  className,
}: SectionProgressHeaderProps) {
  const percent = totalCount === 0 ? 0 : Math.round((answeredCount / totalCount) * 100);
  const isComplete = percent >= 100;

  return (
    <div
      className={cn(
        "sticky top-16 z-20 rounded bg-[#141414] px-5 py-4",
        className
      )}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white truncate flex-1 min-w-0" style={{ letterSpacing: "-0.02em" }}>{title}</h2>

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Autosave zap + inline progress bar */}
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="w-3 h-3 text-white/40" />
            </motion.div>
            {/* Mini progress track */}
            <div className="relative w-24 h-[3px] rounded-full bg-white/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: isComplete
                    ? "rgb(112,255,162)"
                    : "rgb(108,194,255)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
              />
            </div>
          </div>

          {/* Question count */}
          <span className="text-sm font-semibold text-white/60 tabular-nums">
            {answeredCount}/{totalCount}
          </span>

          {/* Animated percent / complete indicator */}
          <AnimatePresence mode="wait">
            {isComplete ? (
              <motion.div
                key="complete"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 18 }}
              >
                <CheckCircle2 className="w-4 h-4 text-brand-green" strokeWidth={2} />
              </motion.div>
            ) : (
              <motion.span
                key={percent}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.18 }}
                className="text-sm font-bold text-brand-blue tabular-nums w-8 text-right"
              >
                {percent}%
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>


    </div>
  );
}
