/**
 * SuggestedNextStep — finds the easiest next entry point and suggests it.
 * Logic: sub-section with the lowest total field count that has 0% completion.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lightbulb, ArrowRight } from "lucide-react";
import type { FieldStatus } from "@/lib/framework-nav";

export interface SuggestionTarget {
  label: string;
  parentLabel: string;
  href: string;
  totalCount: number;
  status: FieldStatus;
}

interface SuggestedNextStepProps {
  /** All available sub-sections with their progress */
  targets: SuggestionTarget[];
  className?: string;
}

export function SuggestedNextStep({ targets, className }: SuggestedNextStepProps) {
  // Find the not-started sub-section with the fewest questions (quickest win)
  const notStarted = targets.filter((t) => t.status === "not_started" && t.totalCount > 0);

  // If all started, find the one with least remaining
  let suggestion: SuggestionTarget | null = null;

  if (notStarted.length > 0) {
    suggestion = notStarted.reduce((min, t) => (t.totalCount < min.totalCount ? t : min));
  } else {
    // Try in-progress ones
    const inProgress = targets.filter((t) => t.status === "in_progress");
    if (inProgress.length > 0) {
      suggestion = inProgress[0];
    }
  }

  if (!suggestion) return null; // Everything is complete!

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className={className}
    >
      <div className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
            <Lightbulb className="w-4.5 h-4.5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Suggested next step</p>
            <p className="text-sm text-slate-600 mt-1">
              {suggestion.parentLabel} — {suggestion.label}{" "}
              <span className="text-slate-400">
                ({suggestion.status === "not_started" ? `0 / ${suggestion.totalCount} answered` : "In progress"})
              </span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {suggestion.status === "not_started"
                ? "This is the shortest unanswered section right now."
                : "Continue where you left off."}
            </p>
            <Link
              href={suggestion.href}
              className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
            >
              {suggestion.status === "not_started" ? "Start" : "Resume"} {suggestion.label}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
