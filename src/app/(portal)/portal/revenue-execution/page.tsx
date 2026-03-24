"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, CheckCircle2, ArrowRight, Settings, Users, Database, Megaphone, BarChart3, Calendar, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/context/ProgressContext";

const SUB_SECTIONS = [
  { id: "methodology", label: "2.1 Sales Methodology Selection, Fit & Design", href: "/portal/revenue-execution/methodology", icon: Settings, description: "Confirm methodology matches customer journey and sales cycle" },
  { id: "adoption", label: "2.2 Adoption & Embedding Programme", href: "/portal/revenue-execution/adoption", icon: TrendingUp, description: "Turn methodology into everyday selling behaviour" },
  { id: "ownership", label: "2.3 Commercial Leadership & Named Ownership", href: "/portal/revenue-execution/ownership", icon: Users, description: "Assign clear accountability across the organisation" },
  { id: "crm", label: "2.4 CRM Integration & Revenue Process Control", href: "/portal/revenue-execution/crm", icon: Database, description: "Embed methodology into CRM as the revenue operating system" },
  { id: "campaigns", label: "2.5 Marketing Campaign Performance", href: "/portal/revenue-execution/campaigns", icon: Megaphone, description: "Link campaigns to strategic objectives with predicted outcomes" },
  { id: "scorecard", label: "2.6 Sales Performance & Balanced Scorecard", href: "/portal/revenue-execution/scorecard", icon: BarChart3, description: "Measure revenue, process discipline and people capability" },
  { id: "qbr", label: "2.7 Quarterly Business Review & Annual Reset", href: "/portal/revenue-execution/qbr", icon: Calendar, description: "Formalise review cycles and reset priorities" },
  { id: "people-cap", label: "2.8 People, Capability & Performance", href: "/portal/revenue-execution/people-cap", icon: Briefcase, description: "Hiring, onboarding, development and performance review" },
];

export default function RevenueExecutionPage() {
  const { progress } = useProgress();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revenue Execution</h1>
        <p className="text-sm text-slate-500 mt-1">
          Translate the initial review into a repeatable commercial operating model — sales methodology adoption, CRM-led performance management, campaign measurement, and a balanced scorecard.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const p = progress[`revenue_execution-${s.id}`];
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
        <Link href="/portal/revenue-execution/methodology" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-pink text-white text-sm font-semibold hover:bg-brand-pink/80 transition-colors">
          Start with Sales Methodology <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
