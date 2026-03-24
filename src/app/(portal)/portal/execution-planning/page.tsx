"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ClipboardCheck, CheckCircle2, ArrowRight, Target, Calendar, Users, AlertTriangle, Shield, BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/context/ProgressContext";

const SUB_SECTIONS = [
  { id: "priorities", label: "3.1 Growth Execution Planning & Priority Setting", href: "/portal/execution-planning/priorities", icon: Target, description: "Translate goals into an execution plan with priorities and milestones" },
  { id: "ninety-day", label: "3.2 90-Day Action Plans & Milestone Control", href: "/portal/execution-planning/ninety-day", icon: Calendar, description: "Rolling 90-day plan with actions by workstream" },
  { id: "accountability", label: "3.3 Functional Accountability & Operating Model", href: "/portal/execution-planning/accountability", icon: Users, description: "Define what each function must deliver" },
  { id: "risk", label: "3.4 Resource, Risk & Dependency Management", href: "/portal/execution-planning/risk", icon: AlertTriangle, description: "Track constraints that could slow delivery" },
  { id: "governance", label: "3.5 Board, Leadership & Decision Governance", href: "/portal/execution-planning/governance", icon: Shield, description: "Set decision rights and review standards" },
  { id: "kpi-dashboard", label: "3.6 KPI Dashboard & Intervention Rules", href: "/portal/execution-planning/kpi-dashboard", icon: BarChart3, description: "Define thresholds and intervention triggers" },
  { id: "reset", label: "3.7 Quarterly Reset & Annual Value Creation", href: "/portal/execution-planning/reset", icon: RefreshCw, description: "Refresh priorities based on evidence and market change" },
];

export default function ExecutionPlanningPage() {
  const { progress } = useProgress();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Execution Planning</h1>
        <p className="text-sm text-slate-500 mt-1">
          Convert the commercial operating model into an execution programme — 90-day priorities, functional ownership, governance cadence, delivery controls, and growth measures.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const p = progress[`execution_planning-${s.id}`];
          const percent = p && p.totalCount > 0 ? Math.round((p.answeredCount / p.totalCount) * 100) : 0;
          const status = percent >= 100 ? "complete" : percent > 0 ? "in_progress" : "not_started";
          const Icon = s.icon;

          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={s.href} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors group">
                <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", status === "complete" ? "bg-brand-green/10 text-brand-green" : status === "in_progress" ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400")}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  {status === "complete" ? (
                    <span className="flex items-center gap-1 text-xs font-medium text-brand-green"><CheckCircle2 className="w-3.5 h-3.5" /> Complete</span>
                  ) : status === "in_progress" ? (
                    <span className="text-xs font-medium text-amber-600">{percent}%</span>
                  ) : (
                    <span className="text-xs text-slate-400">Not started</span>
                  )}
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Link href="/portal/execution-planning/priorities" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/80 transition-colors">
          Start with Priority Setting <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
