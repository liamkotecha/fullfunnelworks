"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight, Settings, Users, Database, Megaphone, BarChart3, Calendar, Briefcase } from "lucide-react";

const SUB_SECTIONS = [
  { id: "methodology", label: "2.1 Sales Methodology Selection, Fit & Design", href: "/portal/revenue-execution/methodology", icon: Settings, description: "Methodology fit assessment and customer journey mapping" },
  { id: "adoption", label: "2.2 Adoption & Embedding Programme", href: "/portal/revenue-execution/adoption", icon: TrendingUp, description: "Adoption plan, coaching cadence and reinforcement" },
  { id: "ownership", label: "2.3 Commercial Leadership & Named Ownership", href: "/portal/revenue-execution/ownership", icon: Users, description: "Named accountability across the organisation" },
  { id: "crm", label: "2.4 CRM Integration & Revenue Process Control", href: "/portal/revenue-execution/crm", icon: Database, description: "CRM configuration, dashboards and data governance" },
  { id: "campaigns", label: "2.5 Marketing Campaign Performance", href: "/portal/revenue-execution/campaigns", icon: Megaphone, description: "Campaign plans, predicted outcomes and review" },
  { id: "scorecard", label: "2.6 Sales Performance & Balanced Scorecard", href: "/portal/revenue-execution/scorecard", icon: BarChart3, description: "Revenue, customer, process and people measures" },
  { id: "qbr", label: "2.7 Quarterly Business Review & Annual Reset", href: "/portal/revenue-execution/qbr", icon: Calendar, description: "Review cycles and priority refresh" },
  { id: "people-cap", label: "2.8 People, Capability & Performance", href: "/portal/revenue-execution/people-cap", icon: Briefcase, description: "Competency, onboarding and succession" },
];

export default function RevenueExecutionPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Revenue Execution</h1>
        <p className="text-sm text-slate-500 mt-1">
          Your consultant&apos;s analysis of sales methodology adoption, CRM-led performance management, campaign measurement, and the balanced scorecard for your engagement.
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
