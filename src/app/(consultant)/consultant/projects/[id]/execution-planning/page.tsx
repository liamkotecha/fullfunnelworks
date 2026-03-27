"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Target, Clock, Users, AlertTriangle, Shield, BarChart3, RefreshCw } from "lucide-react";

const SUB_SECTIONS = [
  { id: "priorities",     label: "3.1 Growth Execution Planning & Priority Setting",     icon: Target,        description: "Translate goals into an execution plan with priorities and milestones" },
  { id: "ninety-day",     label: "3.2 90-Day Action Plans & Milestone Control",          icon: Clock,         description: "Rolling 90-day plans with actions, outcomes and ownership" },
  { id: "accountability", label: "3.3 Functional Accountability & Operating Model",      icon: Users,         description: "Define what each function must deliver to support growth" },
  { id: "risk",           label: "3.4 Resource, Risk & Dependency Management",           icon: AlertTriangle, description: "Track constraints that could slow delivery or reduce impact" },
  { id: "governance",     label: "3.5 Board, Leadership & Decision Governance",          icon: Shield,        description: "Set decision rights and review standards" },
  { id: "kpi-dashboard",  label: "3.6 KPI Dashboard, Thresholds & Intervention Rules",  icon: BarChart3,     description: "Define thresholds and intervention triggers" },
  { id: "reset",          label: "3.7 Quarterly Reset & Annual Value Creation Review",   icon: RefreshCw,     description: "Refresh priorities based on delivery evidence" },
];

export default function AdminExecutionPlanningHub() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push(`/consultant/projects/${id}`)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to project
      </button>

      <div>
        <h1 className="text-xl font-bold text-slate-900">Execution Planning</h1>
        <p className="text-sm text-slate-500 mt-1">
          90-day priorities, ownership by function, governance cadence, delivery controls, and growth metrics.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link
                href={`/consultant/projects/${id}/execution-planning/${s.id}`}
                className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 group"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">{s.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
