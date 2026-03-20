/**
 * ResumeCard — "Continue where you left off" card for the dashboard.
 * Highest priority element on the overview page.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Hand } from "lucide-react";

interface ResumeCardProps {
  /** User's display name */
  userName?: string;
  /** Sub-section label, e.g. "SWOT Analysis" */
  sectionLabel: string;
  /** Route to resume from */
  href: string;
  /** Answered / total for this sub-section */
  answeredCount: number;
  totalCount: number;
  /** E.g. "Yesterday", "2 days ago" */
  lastWorkedLabel: string;
  className?: string;
}

export function ResumeCard({
  userName,
  sectionLabel,
  href,
  answeredCount,
  totalCount,
  lastWorkedLabel,
  className,
}: ResumeCardProps) {
  const percent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <div className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-gradient-to-br from-white to-slate-50 p-6">
        <p className="text-lg text-slate-700">
          {userName ? (
            <>
              <Hand className="inline w-4 h-4 mr-1.5 text-slate-500" /> Welcome back, <span className="font-bold">{userName}</span>
            </>
          ) : (
            <>
              <Hand className="inline w-4 h-4 mr-1.5 text-slate-500" /> Welcome back
            </>
          )}
        </p>

        <div className="mt-4">
          <p className="text-sm text-slate-600">
            You&apos;re <span className="font-bold text-slate-900">{percent}%</span> through{" "}
            <span className="font-bold text-slate-900">{sectionLabel}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {answeredCount} of {totalCount} questions answered · Last worked on: {lastWorkedLabel}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-brand-blue"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          />
        </div>

        <Link
          href={href}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/80 transition-colors"
        >
          Continue {sectionLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
