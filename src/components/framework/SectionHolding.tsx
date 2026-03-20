/**
 * SectionHolding — placeholder for sections not yet built.
 * Shows icon, title, upcoming sub-sections, and back link.
 */
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import React from "react";

interface SectionHoldingProps {
  icon: React.ReactNode;
  title: string;
  subSections: string[];
}

export function SectionHolding({
  icon,
  title,
  subSections,
}: SectionHoldingProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto text-center py-16"
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 16, delay: 0.1 }}
        className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-slate-100 mb-5"
      >
        {icon}
      </motion.div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="text-sm text-slate-500 mt-2">
        This section is being prepared.
      </p>

      <div className="mt-6 text-left inline-block">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
          Sub-sections coming:
        </p>
        <ul className="space-y-2">
          {subSections.map((s) => (
            <li
              key={s}
              className="text-sm text-slate-600 flex items-center gap-2.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <Link
          href="/portal/overview"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Overview
        </Link>
      </div>
    </motion.div>
  );
}
