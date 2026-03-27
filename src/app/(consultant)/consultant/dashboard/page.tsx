"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  FolderKanban,
  Receipt,
  KanbanSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isThisMonth } from "date-fns";
import { formatPence } from "@/lib/format";
import type { ClientDTO, ProjectDTO, ProspectDTO, InvoiceDTO } from "@/types";

const PIPELINE_STAGES: { key: string; label: string }[] = [
  { key: "mql", label: "MQL" },
  { key: "sql", label: "SQL" },
  { key: "discovery", label: "Discovery" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiating", label: "Negotiating" },
];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  href,
  accent = "slate",
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  href: string;
  accent?: "blue" | "emerald" | "amber" | "red" | "slate";
}) {
  const accentMap = {
    blue:    { bg: "bg-blue-50",    icon: "text-blue-600",    border: "border-blue-100" },
    emerald: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-100" },
    amber:   { bg: "bg-amber-50",   icon: "text-amber-600",   border: "border-amber-100" },
    red:     { bg: "bg-red-50",     icon: "text-red-600",     border: "border-red-100" },
    slate:   { bg: "bg-slate-50",   icon: "text-slate-600",   border: "border-slate-100" },
  };
  const a = accentMap[accent];
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow flex items-center gap-4 group">
      <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0", a.bg)}>
        <Icon className={cn("w-5 h-5", a.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {trend && <p className="text-xs text-slate-400 mt-0.5">{trend}</p>}
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
    </Link>
  );
}

export default function ConsultantDashboardPage() {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [maxActiveClients, setMaxActiveClients] = useState<number>(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/me/profile").then((r) => r.json()),
    ])
      .then(([c, p, pr, inv, profile]) => {
        setClients(c.data ?? []);
        setProjects(p.data ?? []);
        setProspects(pr.data ?? []);
        setInvoices(inv.data ?? []);
        setMaxActiveClients(profile.maxActiveClients ?? 5);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeClients = clients.filter((c) => c.status === "active" || c.status === "onboarding");
  const blockedProjects = projects.filter((p) => p.status === "blocked");
  const atRiskProjects = projects.filter((p) => p.status === "blocked");
  const activeProjects = projects.filter((p) => p.status === "in_progress");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const totalOverdue = overdueInvoices.reduce((s, i) => s + i.amountPence, 0);

  // Revenue collected this month (paid invoices with paidAt in current month)
  const revenueThisMonth = invoices
    .filter((i) => i.status === "paid" && i.paidAt && isThisMonth(new Date(i.paidAt)))
    .reduce((s, i) => s + i.amountPence, 0);

  const activePipelineProspects = prospects.filter((p) =>
    ["mql", "sql", "discovery", "proposal", "negotiating"].includes(p.stage)
  );
  const pipelineValue = activePipelineProspects.reduce((s, p) => s + (p.dealValue ?? 0), 0);

  const needsAttentionProjects = [...blockedProjects, ...atRiskProjects];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-50" />
          ))}
        </div>
      </div>
    );
  }

  const clientCapPct = maxActiveClients > 0 ? (activeClients.length / maxActiveClients) * 100 : 0;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your workspace at a glance</p>
      </motion.div>

      {/* KPI stat cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/consultant/clients" className="card hover:shadow-md transition-shadow group">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Active Clients</p>
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {activeClients.length}
            <span className="text-sm font-normal text-slate-400 ml-1">/ {maxActiveClients}</span>
          </p>
          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                clientCapPct >= 90 ? "bg-red-500" : clientCapPct >= 70 ? "bg-amber-400" : "bg-blue-500"
              )}
              style={{ width: `${Math.min(clientCapPct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">{clients.length} total clients</p>
        </Link>

        <StatCard
          label="Pipeline Value"
          value={formatPence(pipelineValue)}
          icon={KanbanSquare}
          href="/consultant/crm/pipeline"
          accent="slate"
          trend={`${activePipelineProspects.length} active prospects`}
        />
        <StatCard
          label="Revenue This Month"
          value={formatPence(revenueThisMonth)}
          icon={DollarSign}
          href="/consultant/invoices"
          accent="emerald"
          trend="Paid invoices (MTD)"
        />
        <StatCard
          label="Overdue"
          value={formatPence(totalOverdue)}
          icon={Receipt}
          href="/consultant/invoices"
          accent={overdueInvoices.length > 0 ? "red" : "amber"}
          trend={overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}` : "All up to date"}
        />
      </motion.div>

      {/* Pipeline stage breakdown */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KanbanSquare className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Sales Pipeline</h2>
          </div>
          <Link href="/consultant/crm/pipeline" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            View board →
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {PIPELINE_STAGES.map(({ key, label }) => {
            const stageProspects = prospects.filter((p) => p.stage === key);
            const stageValue = stageProspects.reduce((s, p) => s + (p.dealValue ?? 0), 0);
            return (
              <Link
                key={key}
                href="/consultant/crm/pipeline"
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-center"
              >
                <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums">{stageProspects.length}</p>
                <p className="text-xs text-slate-400 tabular-nums mt-0.5">{formatPence(stageValue)}</p>
              </Link>
            );
          })}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention: blocked/at-risk projects + overdue invoices */}
        {(needsAttentionProjects.length > 0 || overdueInvoices.length > 0) && (
          <motion.div variants={fadeUp} className="card space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Needs Attention</h2>
            </div>
            <div className="space-y-2">
              {needsAttentionProjects.slice(0, 3).map((p) => (
                <Link
                  key={p.id}
                  href={`/consultant/projects/${p.id}`}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors group",
                    p.status === "blocked"
                      ? "border-red-100 hover:bg-red-50"
                      : "border-amber-100 hover:bg-amber-50"
                  )}
                >
                  <AlertTriangle className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", p.status === "blocked" ? "text-red-400" : "text-amber-400")} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400 capitalize">{p.status.replace("_", " ")}</p>
                  </div>
                </Link>
              ))}
              {overdueInvoices.slice(0, 3).map((inv) => (
                <Link
                  key={inv.id}
                  href={`/consultant/invoices/${inv.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{inv.title}</p>
                    <p className="text-xs text-red-400">
                      Due {inv.dueDate ? formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true }) : "—"}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-red-600 tabular-nums ml-4 flex-shrink-0">
                    {formatPence(inv.amountPence)}
                  </p>
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Recent clients */}
        <motion.div variants={fadeUp} className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Recent Clients</h2>
            </div>
            <Link href="/consultant/clients" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              View all →
            </Link>
          </div>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No clients yet.</p>
              <Link href="/consultant/clients" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                Add your first client →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {clients.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`/consultant/clients/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {c.businessName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{c.businessName}</p>
                  </div>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    c.status === "active" ? "bg-emerald-50 text-emerald-700" :
                    c.status === "onboarding" ? "bg-amber-50 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  )}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Active projects */}
        <motion.div variants={fadeUp} className="card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Active Projects</h2>
            </div>
            <Link href="/consultant/projects" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
              View all →
            </Link>
          </div>
          {activeProjects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No active projects.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeProjects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/consultant/projects/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">
                      {typeof p.clientId === "object" ? (p.clientId as { businessName?: string })?.businessName ?? "" : ""}
                    </p>
                  </div>
                  <FolderKanban className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
