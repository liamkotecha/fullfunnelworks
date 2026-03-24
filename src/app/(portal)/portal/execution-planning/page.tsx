"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Target, Calendar, Users, AlertTriangle, Shield, BarChart3, RefreshCw } from "lucide-react";

const SUB_SECTIONS = [
  { id: "priorities", label: "3.1 Growth Execution Planning & Priority Setting", href: "/portal/execution-planning/priorities", icon: Target, description: "Priorities, sequencing, owners and milestones" },
  { id: "ninety-day", label: "3.2 90-Day Action Plans & Milestone Control", href: "/portal/execution-planning/ninety-day", icon: Calendar, description: "Rolling 90-day plan by workstream" },
  { id: "accountability", label: "3.3 Functional Accountability & Operating Model", href: "/portal/execution-planning/accountability", icon: Users, description: "What each function must deliver" },
  { id: "risk", label: "3.4 Resource, Risk & Dependency Management", href: "/portal/execution-planning/risk", icon: AlertTriangle, description: "People, technology, budget constraints" },
  { id: "governance", label: "3.5 Board, Leadership & Decision Governance", href: "/portal/execution-planning/governance", icon: Shield, description: "Decision rights and review cadence" },
  { id: "kpi-dashboard", label: "3.6 KPI Dashboard & Intervention Rules", href: "/portal/execution-planning/kpi-dashboard", icon: BarChart3, description: "Thresholds and intervention triggers" },
  { id: "reset", label: "3.7 Quarterly Reset & Annual Value Creation", href: "/portal/execution-planning/reset", icon: RefreshCw, description: "Priority refresh and lessons learned" },
];

export default function ExecutionPlanningPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Execution Planning</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your consultant&apos;s execution programme — 90-day priorities, functional ownership, governance cadence, and growth measures for your engagement.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link href={s.href} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 transition-colors group hover:border-slate-300">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center">
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
