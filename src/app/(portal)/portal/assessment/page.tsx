"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, CheckCircle2, ArrowRight, FileText, Grid3X3, Target, BarChart3, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/context/ProgressContext";
import { trackEvent } from "@/lib/analytics";

const SUB_SECTIONS = [
  {
    id: "checklist",
    label: "Assessment Checklist",
    href: "/portal/assessment/checklist",
    icon: CheckCircle,
    description: "Quick readiness check across your organisation",
    estimate: "~5 mins",
  },
  {
    id: "swot",
    label: "SWOT Analysis",
    href: "/portal/assessment/swot",
    icon: Grid3X3,
    description: "Strengths, Weaknesses, Opportunities, Threats",
    estimate: "~40 mins",
  },
  {
    id: "most",
    label: "MOST Analysis",
    href: "/portal/assessment/most",
    icon: Target,
    description: "Mission, Objectives, Strategy, Tactics alignment",
    estimate: "~40 mins",
  },
  {
    id: "gap",
    label: "Gap Analysis",
    href: "/portal/assessment/gap",
    icon: BarChart3,
    description: "Identify and prioritize capability gaps",
    estimate: "~6 mins",
  },
  {
    id: "leadership",
    label: "Leadership Questions",
    href: "/portal/assessment/leadership",
    icon: Users,
    description: "10 strategic questions for commercial leadership",
    estimate: "~20 mins",
  },
];

export default function AssessmentPage() {
  const { progress } = useProgress();
  const trackedRef = useRef(false);

  // Track assessment_started on first visit (no responses yet)
  useEffect(() => {
    if (trackedRef.current) return;
    const hasAnyProgress = SUB_SECTIONS.some((s) => {
      const p = progress[`assessment-${s.id}`];
      return p && p.answeredCount > 0;
    });
    if (!hasAnyProgress) {
      trackEvent("assessment_started", { section: "assessment" });
    }
    trackedRef.current = true;
  }, [progress]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Assessment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Conduct a comprehensive assessment of your current capabilities across
          People, Product, and Process.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const p = progress[`assessment-${s.id}`];
          const percent =
            p && p.totalCount > 0
              ? Math.round((p.answeredCount / p.totalCount) * 100)
              : 0;
          const status =
            percent >= 100
              ? "complete"
              : percent > 0
                ? "in_progress"
                : "not_started";
          const Icon = s.icon;

          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={s.href}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors group"
              >
                <div
                  className={cn(
                    "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
                    status === "complete"
                      ? "bg-brand-green/10 text-brand-green"
                      : status === "in_progress"
                        ? "bg-brand-blue/10 text-[#141414]"
                        : "bg-slate-100 text-slate-400"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {s.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {status === "complete" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-green">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Complete
                    </span>
                  ) : status === "in_progress" ? (
                    <span className="text-xs font-medium text-[#141414]">
                      {percent}%
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {s.estimate}
                    </span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/portal/assessment/checklist"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/80 transition-colors"
        >
          Start with Assessment Checklist
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
