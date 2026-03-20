/**
 * WhatsNext — shown after completing all questions in a sub-section.
 * Compact completion badge + link to next section + "Review answers" button.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, LayoutDashboard, PenLine } from "lucide-react";

interface WhatsNextProps {
  completedTitle: string;
  nextTitle: string;
  nextHref: string;
  nextDescription?: string;
  /** Called when user wants to review/edit their answers */
  onReview?: () => void;
}

export function WhatsNext({
  completedTitle,
  nextTitle,
  nextHref,
  nextDescription,
  onReview,
}: WhatsNextProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-3"
    >
      {/* Compact completion badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="flex items-center gap-3 rounded-lg bg-[#141414] px-4 py-3"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-green flex items-center justify-center"
        >
          <Check className="w-3.5 h-3.5 text-[#141414]" strokeWidth={2.5} />
        </motion.span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-white/40 uppercase tracking-widest leading-none mb-0.5">
            Completed
          </p>
          <p className="text-sm font-bold text-white truncate">{completedTitle}</p>
        </div>
        {onReview && (
          <button
            onClick={onReview}
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 text-xs font-semibold text-white/70 hover:bg-white/20 hover:text-white transition-colors"
          >
            <PenLine className="w-3 h-3" />
            Review
          </button>
        )}
      </motion.div>

      {/* Next section card */}
      <div className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-6 text-center">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
          Next up
        </p>
        <p className="text-lg font-bold text-slate-900">{nextTitle}</p>
        {nextDescription && (
          <p className="text-sm text-slate-500 mt-1">{nextDescription}</p>
        )}
        <div className="flex items-center justify-center gap-3 mt-5">
          <Link
            href={nextHref}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#141414] text-white text-sm font-bold hover:opacity-85 transition-opacity"
          >
            Start {nextTitle}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/portal/overview"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
