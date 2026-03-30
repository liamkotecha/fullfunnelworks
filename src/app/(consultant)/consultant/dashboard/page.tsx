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
  CheckCircle2,
  ArrowRight,
  DollarSign,
  Lock,
  Sparkles,
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

/* ── Shimmer skeleton ─────────────────────────────────────── */
function Shimmer({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 rounded-lg", className)} />
  );
}

function KpiSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-center gap-3">
        <Shimmer className="w-9 h-9 rounded-xl flex-shrink-0" />
        <Shimmer className="h-3 w-24" />
      </div>
      <Shimmer className="h-8 w-20" />
      <Shimmer className="h-2.5 w-32" />
    </div>
  );
}

/* ── Consistent KPI card ─────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  extra,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  href: string;
  extra?: React.ReactNode;
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-all group flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", iconBg)}>
          <Icon className={cn("w-4 h-4", iconColor)} />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-200 group-hover:text-slate-400 transition-colors" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900 tabular-nums leading-none">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
      </div>
      {extra}
    </Link>
  );
}

export default function ConsultantDashboardPage() {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [maxActiveClients, setMaxActiveClients] = useState<number>(5);
  const [planName, setPlanName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
      fetch("/api/me/profile").then((r) => r.json()),
      fetch("/api/consultant/billing").then((r) => r.json()),
    ])
      .then(([c, p, pr, inv, profile, billing]) => {
        setClients(c.data ?? []);
        setProjects(p.data ?? []);
        setProspects(pr.data ?? []);
        setInvoices(inv.data ?? []);
        setMaxActiveClients(profile.maxActiveClients ?? 5);
        setPlanName(billing.plan?.name ?? null);
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

  const revenueThisMonth = invoices
    .filter((i) => i.status === "paid" && i.paidAt && isThisMonth(new Date(i.paidAt)))
    .reduce((s, i) => s + i.amountPence, 0);

  const activePipelineProspects = prospects.filter((p) =>
    ["mql", "sql", "discovery", "proposal", "negotiating"].includes(p.stage)
  );
  const pipelineValue = activePipelineProspects.reduce((s, p) => s + (p.dealValue ?? 0), 0);

  const needsAttentionProjects = [...blockedProjects, ...atRiskProjects];

  // Pipeline is available on Growth and Enterprise plans only
  const hasPipelineAccess = planName === "Growth" || planName === "Enterprise";

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-1.5">
          <Shimmer className="h-7 w-40" />
          <Shimmer className="h-4 w-56" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <KpiSkeleton key={i} />)}
        </div>
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-16" />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="rounded-lg border border-slate-100 p-3 space-y-2">
                <Shimmer className="h-3 w-12 mx-auto" />
                <Shimmer className="h-6 w-6 mx-auto" />
                <Shimmer className="h-3 w-10 mx-auto" />
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card space-y-4">
              <div className="flex items-center justify-between">
                <Shimmer className="h-4 w-28" />
                <Shimmer className="h-3 w-14" />
              </div>
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center gap-3 p-2.5">
                  <Shimmer className="w-7 h-7 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Shimmer className="h-3.5 w-36" />
                    <Shimmer className="h-3 w-20" />
                  </div>
                  <Shimmer className="h-5 w-14 rounded-full" />
                </div>
              ))}
            </div>
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
        <KpiCard
          label="Active Clients"
          value={`${activeClients.length} / ${maxActiveClients}`}
          sub={`${clients.length} total client${clients.length !== 1 ? "s" : ""}`}
          icon={Users}
          iconBg="bg-brand-blue/10"
          iconColor="text-brand-blue"
          href="/consultant/clients"
          extra={
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  clientCapPct >= 90 ? "bg-red-500" : clientCapPct >= 70 ? "bg-amber-400" : "bg-brand-blue"
                )}
                style={{ width: `${Math.min(clientCapPct, 100)}%` }}
              />
            </div>
          }
        />
        <KpiCard
          label="Pipeline Value"
          value={formatPence(pipelineValue)}
          sub={`${activePipelineProspects.length} active prospect${activePipelineProspects.length !== 1 ? "s" : ""}`}
          icon={KanbanSquare}
          iconBg="bg-slate-100"
          iconColor="text-slate-500"
          href="/consultant/crm/pipeline"
        />
        <KpiCard
          label="Revenue This Month"
          value={formatPence(revenueThisMonth)}
          sub="Paid invoices (MTD)"
          icon={DollarSign}
          iconBg="bg-brand-green/10"
          iconColor="text-brand-green"
          href="/consultant/invoices"
        />
        <KpiCard
          label="Overdue"
          value={formatPence(totalOverdue)}
          sub={overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue invoice${overdueInvoices.length > 1 ? "s" : ""}` : "All up to date"}
          icon={Receipt}
          iconBg={overdueInvoices.length > 0 ? "bg-red-50" : "bg-slate-100"}
          iconColor={overdueInvoices.length > 0 ? "text-red-500" : "text-slate-400"}
          href="/consultant/invoices"
        />
      </motion.div>

      {/* Pipeline stage breakdown — gated to Growth/Enterprise */}
      <motion.div variants={fadeUp}>
        {hasPipelineAccess ? (
          <div className="card space-y-4">
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
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-colors text-center"
                  >
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
                    <p className="text-xl font-bold text-slate-900 tabular-nums">{stageProspects.length}</p>
                    <p className="text-xs text-slate-400 tabular-nums mt-0.5">{formatPence(stageValue)}</p>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="card relative overflow-hidden">
            {/* Blurred preview */}
            <div className="select-none pointer-events-none opacity-30 blur-[2px] space-y-4">
              <div className="flex items-center gap-2">
                <KanbanSquare className="w-4 h-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Sales Pipeline</h2>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {PIPELINE_STAGES.map(({ key, label }) => (
                  <div key={key} className="p-3 rounded-lg border border-slate-100 text-center">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
                    <p className="text-xl font-bold text-slate-900">—</p>
                    <p className="text-xs text-slate-400 mt-0.5">£0</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Upsell overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-[1px] rounded-lg">
              <div className="flex flex-col items-center text-center max-w-xs px-4">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center mb-3">
                  <Lock className="w-5 h-5 text-brand-blue" />
                </div>
                <p className="font-semibold text-slate-900 text-sm mb-1">Sales Pipeline &amp; CRM</p>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Track prospects, manage your pipeline, and forecast revenue. Available on the <span className="font-semibold text-slate-700">Growth</span> plan and above.
                </p>
                <Link
                  href="/consultant/billing"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-blue text-[#141414] text-xs font-bold hover:bg-brand-blue/90 hover:shadow-[0_0_18px_rgba(108,194,255,0.35)] transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade plan
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Needs Attention */}
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
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors group"
                >
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-red-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-red-400">Action required — project is stuck and not progressing</p>
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
              <Link href="/consultant/clients" className="mt-2 inline-block text-sm text-brand-blue hover:underline">
                Add your first client →
              </Link>
            </div>
          ) : (
            <div className="space-y-1">
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
                    "text-[11px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide",
                    c.status === "active" ? "bg-brand-green/10 text-brand-green" :
                    c.status === "onboarding" ? "bg-amber-50 text-amber-600" :
                    "bg-slate-100 text-slate-400"
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
            <div className="space-y-1">
              {activeProjects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/consultant/projects/${p.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <CheckCircle2 className="w-4 h-4 text-brand-green flex-shrink-0" />
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
