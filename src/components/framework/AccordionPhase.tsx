/**
 * AccordionPhase — enhanced accordion with completion state.
 * Used for Sales Methodology (5 phases with questions).
 */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AccordionPhaseItem {
  id: string;
  label: string;
  answeredCount: number;
  totalCount: number;
}

interface AccordionPhaseProps {
  phases: AccordionPhaseItem[];
  /** Render content for a phase by index */
  children: (index: number) => React.ReactNode;
  /** Allow multiple phases open at once? Default: false (single) */
  multiple?: boolean;
  className?: string;
}

export function AccordionPhase({
  phases,
  children,
  multiple = false,
  className,
}: AccordionPhaseProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    new Set(phases.length > 0 ? [phases[0].id] : [])
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!multiple) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      {phases.map((phase, i) => {
        const isOpen = openIds.has(phase.id);
        const percent = phase.totalCount ? Math.round((phase.answeredCount / phase.totalCount) * 100) : 0;
        const status = percent >= 100 ? "complete" : percent > 0 ? "in_progress" : "not_started";

        return (
          <div
            key={phase.id}
            className={cn(
              "rounded-lg border transition-colors duration-200 shadow",
              isOpen
                ? status === "complete"
                  ? "border-brand-green/30 bg-brand-green/5"
                  : "border-slate-200 bg-slate-50/50"
                : "border-slate-200 bg-white"
            )}
          >
            {/* Accordion header */}
            <button
              onClick={() => toggle(phase.id)}
              className="flex items-center w-full px-4 py-3 text-left gap-3"
            >
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </motion.div>

              <span className="flex-1 text-sm font-bold text-slate-900">
                Phase {i + 1}: {phase.label}
              </span>

              <span className="text-xs text-slate-500 flex-shrink-0">
                {phase.answeredCount} / {phase.totalCount} answered
              </span>

              {/* Status indicator */}
              {status === "complete" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <Check className="w-4 h-4 text-brand-green" />
                </motion.div>
              ) : (
                <span
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    status === "in_progress" ? "bg-amber-400" : "bg-slate-300"
                  )}
                />
              )}
            </button>

            {/* Accordion content */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 pt-1">
                    {children(i)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
