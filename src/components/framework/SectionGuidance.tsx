/**
 * SectionGuidance — context callout below the progress header.
 * Explains why this section matters + estimated time commitment.
 */
"use client";

import { motion } from "framer-motion";
import { Lightbulb, Clock } from "lucide-react";

interface SectionGuidanceProps {
  intro: string;
  estimatedMinutes: number;
  description?: string;
}

export function SectionGuidance({ intro, estimatedMinutes, description }: SectionGuidanceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="flex gap-4 rounded-lg border border-slate-100 bg-slate-50/70 px-5 py-4"
    >
      <motion.div
        initial={{ rotate: -20, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.2, type: "spring", stiffness: 220, damping: 14 }}
        className="flex-shrink-0 mt-0.5"
      >
        <Lightbulb className="w-4 h-4 text-brand-blue" />
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4 mb-1.5">
          <p className="type-overline mb-1.5">
            Why this matters
          </p>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Clock className="w-3 h-3 text-slate-400" />
            <span className="type-meta">~{estimatedMinutes} min</span>
          </div>
        </div>
        <p className="type-body">{intro}</p>
        {description && (
          <p className="type-sub mt-1">{description}</p>
        )}
      </div>
    </motion.div>
  );
}
