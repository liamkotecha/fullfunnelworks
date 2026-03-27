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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { formatPence } from "@/lib/format";
import type { ClientDTO, ProjectDTO, ProspectDTO, InvoiceDTO } from "@/types";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ])
      .then(([c, p, pr, inv]) => {
        setClients(c.data ?? []);
        setProjects(p.data ?? []);
        setProspects(pr.data ?? []);
        setInvoices(inv.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeClients = clients.filter((c) => c.status === "active" || c.status === "onboarding");
  const blockedProjects = projects.filter((p) => p.status === "blocked");
  const activeProjects = projects.filter((p) => p.status === "in_progress");
  const outstandingInvoices = invoices.filter((i) => i.status === "sent" || i.status === "overdue");
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const totalOutstanding = outstandingInvoices.reduce((s, i) => s + i.amountPence, 0);

  const pipelineValue = prospects
    .filter((p) => ["mql", "sql", "discovery", "proposal", "negotiating"].includes(p.stage))
    .reduce((s, p) => s + (p.dealValue ?? 0), 0);

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
        <StatCard
          label="Active Clients"
          value={activeClients.length}
          icon={Users}
          href="/consultant/clients"
          accent="blue"
          trend={`${clients.length} total`}
        />
        <StatCard
          label="Projects"
          value={activeProjects.length}
          icon={FolderKanban}
          href="/consultant/projects"
          accent="emerald"
          trend={blockedProjects.length > 0 ? `${blockedProjects.length} blocked` : "All on track"}
        />
        <StatCard
          label="Outstanding"
          value={formatPence(totalOutstanding)}
          icon={Receipt}
          href="/consultant/invoices"
          accent={overdueInvoices.length > 0 ? "red" : "amber"}
          trend={overdueInvoices.length > 0 ? `${overdueInvoices.length} overdue` : `${outstandingInvoices.length} unpaid`}
        />
        <StatCard
          label="Pipeline"
          value={formatPence(pipelineValue)}
          icon={KanbanSquare}
          href="/consultant/crm/pipeline"
          accent="slate"
          trend={`${prospects.filter((p) => ["mql","sql","discovery","proposal","negotiating"].includes(p.stage)).length} active`}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked / At-risk projects */}
        {blockedProjects.length > 0 && (
          <motion.div variants={fadeUp} className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-slate-900">Blocked Projects</h2>
              </div>
              <Link href="/consultant/projects" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {blockedProjects.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/consultant/projects/${p.id}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-100 hover:bg-red-50 transition-colors group"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{p.title}</p>
                    <p className="text-xs text-slate-400">
                      {typeof p.clientId === "object" ? p.clientId?.businessName ?? "" : ""}
                    </p>
                  </div>
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
              <Link
                href="/consultant/clients"
                className="mt-2 inline-block text-sm text-blue-600 hover:underline"
              >
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

        {/* Overdue invoices */}
        {overdueInvoices.length > 0 && (
          <motion.div variants={fadeUp} className="card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-slate-900">Overdue Invoices</h2>
              </div>
              <Link href="/consultant/invoices" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
                View all →
              </Link>
            </div>
            <div className="space-y-2">
              {overdueInvoices.slice(0, 4).map((inv) => (
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
                      {typeof p.clientId === "object" ? p.clientId?.businessName ?? "" : ""}
                    </p>
                  </div>
                  {p.dueDate && (
                    <p className="text-xs text-slate-300 tabular-nums flex-shrink-0">
                      {formatDistanceToNow(new Date(p.dueDate), { addSuffix: true })}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
