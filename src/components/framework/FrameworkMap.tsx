/**
 * FrameworkMap — visual grid of all 8 sections + sub-sections.
 * Shows mini progress bar, field counts, status badges, and CTA.
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldStatus } from "@/lib/framework-nav";

export interface FrameworkMapSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  progress: number;
  status: FieldStatus;
  href?: string;
  children: {
    id: string;
    label: string;
    progress: number;
    status: FieldStatus;
    answeredCount: number;
    totalCount: number;
    href: string;
  }[];
}

interface FrameworkMapProps {
  sections: FrameworkMapSection[];
  className?: string;
}

function StatusBadge({ status }: { status: FieldStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
        status === "complete" && "bg-brand-green/10 text-brand-green",
        status === "in_progress" && "bg-amber-100 text-amber-700",
        status === "not_started" && "bg-slate-100 text-slate-500"
      )}
    >
      {status === "complete" && <Check className="w-2.5 h-2.5" />}
      {status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Not started"}
    </span>
  );
}

function CTAButton({ status, href }: { status: FieldStatus; href: string }) {
  const labels = {
    not_started: "Start",
    in_progress: "Resume",
    complete: "Review",
  };
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
    >
      {labels[status]} <ArrowRight className="w-3 h-3" />
    </Link>
  );
}

export function FrameworkMap({ sections, className }: FrameworkMapProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", className)}>
      {sections.map((section) => {
        const isExpanded = expandedIds.has(section.id);
        const hasChildren = section.children.length > 0;

        return (
          <motion.div
            key={section.id}
            layout
            className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden"
          >
            {/* Section header */}
            <button
              onClick={() => hasChildren ? toggle(section.id) : undefined}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-3 text-left",
                hasChildren && "cursor-pointer hover:bg-slate-50 transition-colors"
              )}
            >
              <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 flex-shrink-0 text-slate-600">
                {section.icon}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-slate-900 block truncate">
                  {section.label}
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div
                      className={cn(
                        "h-full rounded-full",
                        section.status === "complete" ? "bg-brand-green" : "bg-brand-blue"
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${section.progress}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 tabular-nums w-7 text-right">
                    {section.progress}%
                  </span>
                </div>
              </div>
              {hasChildren && (
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                </motion.div>
              )}
              {!hasChildren && section.href && (
                <CTAButton status={section.status} href={section.href} />
              )}
            </button>

            {/* Expanded children */}
            <AnimatePresence initial={false}>
              {isExpanded && hasChildren && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {section.children.map((child) => (
                      <div
                        key={child.id}
                        className="flex items-center gap-3 px-4 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-slate-700 block truncate">
                            {child.label}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 h-0.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={cn(
                                  "h-full rounded-full transition-all duration-300",
                                  child.status === "complete" ? "bg-brand-green" : "bg-brand-blue"
                                )}
                                style={{ width: `${child.progress}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 tabular-nums">
                              {child.answeredCount}/{child.totalCount}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={child.status} />
                        <CTAButton status={child.status} href={child.href} />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
