/**
 * SectionProgressHeader — sticky dark header matching sidebar bg.
 * Shows section progress, autosave pulse, and jump-to-next shortcut.
 * Always dark (#141414) — authoritative, premium, respects the C-suite audience.
 */
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";

/* ── Portal breadcrumb route map ────────────────────────────── */
interface RouteInfo { section: string; sectionHref: string; }
const ROUTE_MAP: Record<string, RouteInfo> = {
  "/portal/assessment":                        { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/assessment/checklist":              { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/assessment/swot":                   { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/assessment/most":                   { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/assessment/gap":                    { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/assessment/leadership":             { section: "Assessment",          sectionHref: "/portal/assessment/checklist" },
  "/portal/people":                            { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/people/team":                       { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/people/structure":                  { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/people/challenges":                 { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/people/methodology":                { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/people/process-builder":            { section: "People",              sectionHref: "/portal/people/team" },
  "/portal/process":                           { section: "Process",             sectionHref: "/portal/process/checklist" },
  "/portal/process/checklist":                 { section: "Process",             sectionHref: "/portal/process/checklist" },
  "/portal/process/builder":                   { section: "Process",             sectionHref: "/portal/process/checklist" },
  "/portal/process/methodology":               { section: "Process",             sectionHref: "/portal/process/checklist" },
  "/portal/product":                           { section: "Product",             sectionHref: "/portal/product/outcomes" },
  "/portal/product/outcomes":                  { section: "Product",             sectionHref: "/portal/product/outcomes" },
  "/portal/product/challenges":                { section: "Product",             sectionHref: "/portal/product/outcomes" },
  "/portal/gtm":                               { section: "GTM",                 sectionHref: "/portal/gtm/market" },
  "/portal/gtm/market":                        { section: "GTM",                 sectionHref: "/portal/gtm/market" },
  "/portal/gtm/competition":                   { section: "GTM",                 sectionHref: "/portal/gtm/market" },
  "/portal/revenue-execution":                 { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/scorecard":       { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/methodology":     { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/campaigns":       { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/adoption":        { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/crm":             { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/ownership":       { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/people-cap":      { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/revenue-execution/qbr":             { section: "Revenue Execution",   sectionHref: "/portal/revenue-execution/scorecard" },
  "/portal/execution-planning":                { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/priorities":     { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/ninety-day":     { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/accountability": { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/governance":     { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/risk":           { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/kpi-dashboard":  { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/execution-planning/reset":          { section: "Execution Planning",  sectionHref: "/portal/execution-planning/priorities" },
  "/portal/kpis":                              { section: "KPIs",                sectionHref: "/portal/kpis" },
  "/portal/roadmap":                           { section: "Roadmap",             sectionHref: "/portal/roadmap" },
  "/portal/modeller":                          { section: "Modeller",            sectionHref: "/portal/modeller" },
  "/portal/modeller/hiring":                   { section: "Modeller",            sectionHref: "/portal/modeller" },
};

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
  const pathname = usePathname();
  const routeInfo = ROUTE_MAP[pathname];

  return (
    <div
      className={cn(
        "sticky top-16 z-20 rounded bg-[#141414] px-5 py-4",
        className
      )}
    >
      {/* Breadcrumb */}
      {routeInfo && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1 mb-2">
          <Link
            href="/portal/overview"
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Overview
          </Link>
          <ChevronRight className="w-3 h-3 text-white/20 flex-shrink-0" />
          <Link
            href={routeInfo.sectionHref}
            className="text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            {routeInfo.section}
          </Link>
        </nav>
      )}

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
