/**
 * EmptyState — welcoming zero-progress screen for new clients.
 * Shows when the user has not answered any fields yet.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Map, ArrowRight } from "lucide-react";

interface EmptyStateProps {
  /** Route to the shortest/easiest first section (e.g. Assessment Checklist) */
  startHref: string;
  startLabel?: string;
  className?: string;
}

export function EmptyState({
  startHref,
  startLabel = "Assessment Checklist",
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      <div className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-8 sm:p-12 text-center max-w-xl mx-auto">
        <div className="mx-auto w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
          <Map className="w-7 h-7 text-slate-500" />
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Your Growth Strategy Framework is ready
        </h2>

        <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
          This framework will guide your business through People, Product, and
          Process — at your own pace.
        </p>

        <div className="mt-6">
          <p className="text-sm font-medium text-slate-700 mb-3">
            We recommend starting here:
          </p>
          <Link
            href={startHref}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/80 transition-colors"
          >
            Begin: {startLabel}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          You can work through this over days or weeks.
          <br />
          Everything saves automatically as you go.
        </p>
      </div>
    </motion.div>
  );
}
