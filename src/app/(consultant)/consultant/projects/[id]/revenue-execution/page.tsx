"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Settings, TrendingUp, Users, Database, Megaphone, BarChart3, Calendar, Briefcase } from "lucide-react";

const SUB_SECTIONS = [
  { id: "methodology",  label: "2.1 Sales Methodology Selection, Fit & Design", icon: Settings,    description: "Confirm methodology matches customer journey and sales cycle" },
  { id: "adoption",     label: "2.2 Adoption & Embedding Programme",            icon: TrendingUp,  description: "Turn methodology into everyday selling behaviour" },
  { id: "ownership",    label: "2.3 Commercial Leadership & Named Ownership",   icon: Users,       description: "Assign clear accountability across the organisation" },
  { id: "crm",          label: "2.4 CRM Integration & Revenue Process Control", icon: Database,    description: "Embed methodology into CRM as the revenue operating system" },
  { id: "campaigns",    label: "2.5 Marketing Campaign Performance",            icon: Megaphone,   description: "Link campaigns to strategic objectives with predicted outcomes" },
  { id: "scorecard",    label: "2.6 Sales Performance & Balanced Scorecard",    icon: BarChart3,   description: "Measure revenue, process discipline and people capability" },
  { id: "qbr",          label: "2.7 Quarterly Business Review & Annual Reset",  icon: Calendar,    description: "Formalise review cycles and reset priorities" },
  { id: "people-cap",   label: "2.8 People, Capability & Performance",          icon: Briefcase,   description: "Hiring, onboarding, development and performance review" },
];

export default function AdminRevenueExecutionHub() {
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
        <h1 className="text-xl font-bold text-slate-900">Revenue Execution</h1>
        <p className="text-sm text-slate-500 mt-1">
          Sales methodology adoption, CRM-led performance management, campaign measurement, and a balanced scorecard.
        </p>
      </div>

      <div className="space-y-3">
        {SUB_SECTIONS.map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link
                href={`/consultant/projects/${id}/revenue-execution/${s.id}`}
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
