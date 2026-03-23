"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Ban,
  ChevronRight,
  Plus,
  Users,
  Users2,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Clock,
  XCircle,
  Mail,
  CalendarDays,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { ClientDTO, ProjectDTO, ProspectDTO, PROSPECT_STAGE_META } from "@/types";
import { formatPence } from "@/lib/format";

/* ── animation variants ─────────────────────────────────────── */
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

/* ── status config ──────────────────────────────────────────── */
const statusConfig: Record<
  string,
  { label: string; dot: string; pill: string }
> = {
  blocked: {
    label: "Blocked",
    dot: "bg-red-400",
    pill: "bg-red-50 text-red-500",
  },
  active: {
    label: "In progress",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-600",
  },
  onboarding: {
    label: "Onboarding",
    dot: "bg-amber-400",
    pill: "bg-amber-50 text-amber-600",
  },
  invited: {
    label: "Invited",
    dot: "bg-slate-300",
    pill: "bg-slate-100 text-slate-500",
  },
  paused: {
    label: "Paused",
    dot: "bg-slate-300",
    pill: "bg-slate-100 text-slate-400",
  },
};

/* ── status badge ────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? {
    label: status,
    dot: "bg-slate-300",
    pill: "bg-slate-100 text-slate-500",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans text-xs font-medium",
        cfg.pill
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

/* ── initials avatar ─────────────────────────────────────────── */
function Avatar({ name, size = 7 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        `w-${size} h-${size} rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0`
      )}
    >
      <span className="font-sans text-[10px] font-semibold text-white leading-none">
        {initials}
      </span>
    </div>
  );
}

/* ── page ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects").then((r) => r.json()),
    ]).then(([c, p, pr]) => {
      setClients(c.data ?? []);
      setProjects(p.data ?? []);
      setProspects(pr.data ?? []);
      setLoading(false);
    });

    // Run staleness sync on mount (fire and forget, then re-fetch projects)
    fetch("/api/admin/staleness/sync", { method: "POST" })
      .then(() => fetch("/api/projects").then((r) => r.json()))
      .then((p) => {
        if (p.data) setProjects(p.data);
      })
      .catch(() => {});
  }, []);

  /* derived  */
  const blocked = projects.filter((p) => p.status === "blocked");
  const activeClients = clients.filter((c) => c.status === "active" || c.status === "onboarding");

  // Stale projects
  const staleProjects = projects.filter(
    (p) => p.staleness === "at_risk" || p.staleness === "stalled"
  );
  const atRiskProjects = staleProjects
    .filter((p) => p.staleness === "at_risk")
    .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());
  const stalledProjects = staleProjects
    .filter((p) => p.staleness === "stalled")
    .sort((a, b) => new Date(a.lastActivityAt).getTime() - new Date(b.lastActivityAt).getTime());

  // Terminate modal state
  const [terminateTarget, setTerminateTarget] = useState<ProjectDTO | null>(null);
  const [terminateReason, setTerminateReason] = useState("");
  const [terminating, setTerminating] = useState(false);

  // Extend deadline state
  const [extendTarget, setExtendTarget] = useState<ProjectDTO | null>(null);
  const [extendDate, setExtendDate] = useState("");
  const [extending, setExtending] = useState(false);

  const handleTerminate = useCallback(async () => {
    if (!terminateTarget || !terminateReason.trim()) return;
    setTerminating(true);
    try {
      await fetch(`/api/projects/${terminateTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "terminate", reason: terminateReason }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === terminateTarget.id
            ? { ...p, staleness: "terminated" as const, terminatedAt: new Date().toISOString(), terminatedReason: terminateReason }
            : p
        )
      );
      setTerminateTarget(null);
      setTerminateReason("");
    } catch {
      // Silent fail
    } finally {
      setTerminating(false);
    }
  }, [terminateTarget, terminateReason]);

  const handleExtendDeadline = useCallback(async () => {
    if (!extendTarget || !extendDate) return;
    setExtending(true);
    try {
      await fetch(`/api/projects/${extendTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: extendDate }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p.id === extendTarget.id ? { ...p, dueDate: extendDate } : p
        )
      );
      setExtendTarget(null);
      setExtendDate("");
    } catch {
      // Silent fail
    } finally {
      setExtending(false);
    }
  }, [extendTarget, extendDate]);

  const avgPortfolioProgress =
    clients.length > 0
      ? Math.round(
          clients.reduce((s, c) => s + (c.overallProgress ?? 0), 0) /
            clients.length
        )
      : 0;

  /* Map blocked projects → attention items */
  const attentionItems = blocked.map((p) => ({
    id: p.id,
    clientName:
      (p.clientId as unknown as { businessName?: string })?.businessName ??
      String(p.clientId),
    projectName: p.title,
    blockReason: p.blocks?.[p.blocks.length - 1]?.reason ?? "No reason given",
    status: "blocked" as const,
    href: `/admin/projects/${p.id}`,
  }));

  const mostUrgent = attentionItems[0] ?? null;
  const secondaryItems = attentionItems.slice(1);

  /* filtered + paginated clients */
  const filtered = clients.filter((c) => {
    const matchSearch =
      search.trim() === "" ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const allSelected =
    paginated.length > 0 && paginated.every((c) => selected.has(c.id));
  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paginated.forEach((c) => next.delete(c.id));
    else paginated.forEach((c) => next.add(c.id));
    setSelected(next);
  };
  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  /* Greeting */
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  /* ── loading skeleton ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="px-10 pt-10 pb-10 space-y-6">
        <div className="h-8 w-56 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        <div className="h-24 rounded-lg bg-slate-200/40 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-lg bg-slate-200/40 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  /* ── empty state ───────────────────────────────────────────── */
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-10">
        <div className="w-14 h-14 rounded-lg bg-[#1C1C1E] flex items-center justify-center mb-5">
          <Users className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-bold text-2xl text-slate-900 mb-2">No clients yet</h3>
        <p className="font-sans text-sm text-slate-400 mb-7 max-w-xs leading-relaxed">
          Add your first client to start tracking their framework progress.
        </p>
        <Link href="/admin/clients">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-sans text-sm font-medium text-white"
            style={{ background: "rgb(108, 194, 255)" }}
          >
            <Plus className="w-4 h-4" />
            Add first client
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── ZONE 1 — Header ───────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-10 pt-10 pb-6">
        {/* Greeting row */}
        <div className="mb-5">
          <h1 className="font-bold text-3xl text-slate-900">
            {greeting}, {firstName}.
          </h1>
        </div>

        {/* Flowbite-style stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              Icon: Users2,
              iconColor: "text-sky-400",
              label: "Total Clients",
              value: clients.length,
              trend: projects.length,
              trendLabel: `project${projects.length !== 1 ? "s" : ""} total`,
              up: true,
              accent: false,
            },
            {
              Icon: TrendingUp,
              iconColor: "text-emerald-400",
              label: "Active",
              value: activeClients.length,
              trend: clients.length > 0 ? Math.round((activeClients.length / clients.length) * 100) : 0,
              trendLabel: "% of portfolio",
              up: true,
              accent: false,
            },
            {
              Icon: Ban,
              iconColor: "text-red-400",
              label: "Blocked",
              value: blocked.length,
              trend: blocked.length,
              trendLabel: blocked.length > 0 ? "need attention" : "all clear",
              up: blocked.length === 0,
              accent: blocked.length > 0,
            },
            {
              Icon: BarChart3,
              iconColor: "text-violet-400",
              label: "Avg Progress",
              value: `${avgPortfolioProgress}%`,
              trend: avgPortfolioProgress,
              trendLabel: "% completion",
              up: avgPortfolioProgress >= 50,
              accent: false,
            },
          ].map(({ Icon, iconColor, label, value, trend, trendLabel, up, accent }) => (
            <div
              key={label}
              className="bg-white rounded-lg shadow p-5 flex flex-col gap-3"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-[#1C1C1E] flex items-center justify-center flex-shrink-0">
                <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
              </div>

              {/* Label + value */}
              <div>
                <p className="font-sans text-sm text-slate-500 mb-0.5">{label}</p>
                <p className="font-sans text-[1.6rem] font-bold leading-none text-slate-900">
                  {value}
                </p>
              </div>

              {/* Trend badge */}
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-semibold",
                  accent
                    ? "text-red-500"
                    : up
                    ? "text-emerald-600"
                    : "text-amber-500"
                )}
              >
                {accent || !up ? (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                )}
                <span>
                  {trend} {trendLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── STALE PROJECTS WIDGET ─────────────────────────────── */}
      {(atRiskProjects.length > 0 || stalledProjects.length > 0) && (
        <motion.div variants={fadeUp} className="px-10 pb-6">
          <h2 className="font-sans text-base font-semibold text-slate-900 mb-3">Needs attention</h2>
          <div className="space-y-3">
            {/* At-risk projects (red) */}
            {atRiskProjects.map((p) => {
              const clientName = (p.clientId as unknown as { businessName?: string })?.businessName ?? String(p.clientId);
              const clientEmail = (p as unknown as { clientId?: { contactEmail?: string } }).clientId?.contactEmail ?? "";
              const days = Math.round((Date.now() - new Date(p.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} className="bg-red-500/10 border-l-4 border-red-500 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 mt-1.5" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-semibold text-slate-900 truncate">
                          {clientName} — {p.title}
                        </p>
                        <p className="font-sans text-xs text-slate-500 mt-0.5">
                          Status: At risk · Last active {formatDistanceToNow(new Date(p.lastActivityAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className="font-sans text-sm font-bold text-red-500 flex-shrink-0 tabular-nums">
                      {days} days idle
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-5">
                    <a
                      href={`mailto:${clientEmail}?subject=Re:%20${encodeURIComponent(p.title)}&body=Hi%20${encodeURIComponent((p.clientId as unknown as { contactName?: string })?.contactName ?? clientName)},%20I%20wanted%20to%20check%20in%20on%20your%20progress...`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Send message
                    </a>
                    <button
                      onClick={() => { setExtendTarget(p); setExtendDate(p.dueDate ?? ""); }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <CalendarDays className="w-3 h-3" />
                      Extend deadline
                    </button>
                    <button
                      onClick={() => setTerminateTarget(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="w-3 h-3" />
                      Terminate engagement
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Stalled projects (amber) */}
            {stalledProjects.map((p) => {
              const clientName = (p.clientId as unknown as { businessName?: string })?.businessName ?? String(p.clientId);
              const clientEmail = (p as unknown as { clientId?: { contactEmail?: string } }).clientId?.contactEmail ?? "";
              const days = Math.round((Date.now() - new Date(p.lastActivityAt).getTime()) / (1000 * 60 * 60 * 24));
              return (
                <div key={p.id} className="bg-amber-500/10 border-l-4 border-amber-500 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
                      <div className="min-w-0">
                        <p className="font-sans text-sm font-semibold text-slate-900 truncate">
                          {clientName} — {p.title}
                        </p>
                        <p className="font-sans text-xs text-slate-500 mt-0.5">
                          Status: Stalled · Last active {formatDistanceToNow(new Date(p.lastActivityAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <span className="font-sans text-sm font-bold text-amber-500 flex-shrink-0 tabular-nums">
                      {days} days idle
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-3 ml-5">
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View project
                    </Link>
                    <a
                      href={`mailto:${clientEmail}?subject=Re:%20${encodeURIComponent(p.title)}&body=Hi%20${encodeURIComponent((p.clientId as unknown as { contactName?: string })?.contactName ?? clientName)},%20I%20wanted%20to%20check%20in%20on%20your%20progress...`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      Message
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ── Terminate Modal ───────────────────────────────────── */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Terminate engagement</h3>
            <p className="text-sm text-slate-500 mb-4">
              This will mark the project as terminated and notify the client. All data is preserved read-only. This cannot be undone.
            </p>
            <textarea
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Reason for termination (required)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setTerminateTarget(null); setTerminateReason(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                disabled={!terminateReason.trim() || terminating}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {terminating ? "Terminating…" : "Terminate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Extend Deadline Modal ─────────────────────────────── */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Extend deadline</h3>
            <p className="text-sm text-slate-500 mb-4">
              Set a new due date for <strong>{extendTarget.title}</strong>.
            </p>
            <input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => { setExtendTarget(null); setExtendDate(""); }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExtendDeadline}
                disabled={!extendDate || extending}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {extending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pipeline snapshot ──────────────────────────────────── */}
      {prospects.length > 0 && (
        <motion.div variants={fadeUp} className="px-10 pb-6">
          <div className="rounded-lg bg-[#1C1C1E] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white/90">Pipeline</h3>
              <Link
                href="/admin/crm/pipeline"
                className="text-xs text-white/50 hover:text-white/80 flex items-center gap-1 transition-colors"
              >
                View full pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Stage pills */}
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {(["mql","sql","discovery","proposal","negotiating","won","lost"] as const).map((stage) => {
                const count = prospects.filter((p) => p.stage === stage).length;
                if (count === 0) return null;
                const meta = PROSPECT_STAGE_META[stage];
                const pillStyles: Record<string, string> = {
                  blue:   "bg-blue-500/15 text-blue-400",
                  indigo: "bg-indigo-500/15 text-indigo-400",
                  purple: "bg-purple-500/15 text-purple-400",
                  amber:  "bg-amber-500/15 text-amber-400",
                  orange: "bg-orange-500/15 text-orange-400",
                  green:  "bg-emerald-500/15 text-emerald-400",
                  gray:   "bg-gray-500/15 text-gray-400",
                };
                const dotStyles: Record<string, string> = {
                  blue:   "bg-blue-400",
                  indigo: "bg-indigo-400",
                  purple: "bg-purple-400",
                  amber:  "bg-amber-400",
                  orange: "bg-orange-400",
                  green:  "bg-emerald-400",
                  gray:   "bg-gray-400",
                };
                return (
                  <span
                    key={stage}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                      pillStyles[meta.colour] ?? "bg-gray-500/15 text-gray-400"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", dotStyles[meta.colour] ?? "bg-gray-400")} />
                    {meta.label} · {count}
                  </span>
                );
              })}
            </div>

            {/* Summary row */}
            <div className="flex items-center gap-6 text-xs text-white/50">
              <span>
                Pipeline value:{" "}
                <span className="text-white/80 font-medium">
                  {formatPence(
                    prospects
                      .filter((p) => !["won", "lost"].includes(p.stage))
                      .reduce((s, p) => s + (p.dealValue ?? 0), 0)
                  )}
                </span>
              </span>
              <span>
                Leads this month:{" "}
                <span className="text-white/80 font-medium">
                  {prospects.filter((p) => {
                    const d = new Date(p.createdAt);
                    const now = new Date();
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  }).length}
                </span>
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ZONE 2 — Primary attention card ───────────────────── */}
      {mostUrgent ? (
        <motion.div variants={fadeUp} className="px-10 pb-6">
          <Link href={mostUrgent.href}>
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative overflow-hidden rounded-lg bg-[#1C1C1E] p-6 cursor-pointer"
            >
              <div className="flex items-center gap-5">
                {/* Left icon ring */}
                <div className="relative flex-shrink-0">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ boxShadow: "inset 0 0 0 2px rgba(255,85,85,0.5)", background: "rgba(255,85,85,0.12)" }}>
                    <Ban className="w-6 h-6" style={{ color: "rgb(255, 85, 85)" }} />
                  </div>
                </div>

                {/* Middle content */}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs uppercase tracking-widest mb-1" style={{ color: "rgb(255, 85, 85)" }}>
                    Needs immediate attention
                  </p>
                  <h2 className="font-bold text-xl text-white">
                    {mostUrgent.clientName}
                  </h2>
                </div>

                {/* Right arrow */}
                <motion.div
                  whileHover={{ x: 2 }}
                  className="flex-shrink-0 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
                >
                  <ArrowRight className="w-4 h-4 text-white" />
                </motion.div>
              </div>

              {/* Ambient glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none" style={{ background: "rgba(255,85,85,0.08)" }} />
            </motion.div>
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="px-10 pb-6">
          <div className="rounded-lg bg-[#1C1C1E] shadow p-5 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: "rgba(112, 255, 162, 0.1)",
                boxShadow: "inset 0 0 0 1px rgba(112, 255, 162, 0.2)",
              }}
            >
              <CheckCircle2
                className="w-5 h-5"
                style={{ color: "rgb(112, 255, 162)" }}
              />
            </div>
            <div>
              <p className="font-sans text-sm font-medium text-white">
                All clear
              </p>
              <p className="font-sans text-xs text-slate-400 mt-0.5">
                No blocked projects or items needing attention
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Secondary attention items ─────────────────────────── */}
      {secondaryItems.length > 0 && (
        <motion.div variants={fadeUp} className="px-10 pb-6">
          <div className="bg-white rounded-lg shadow divide-y divide-slate-50 overflow-hidden">
            {secondaryItems.map((item) => (
              <Link key={item.id} href={item.href}>
                <motion.div
                  whileHover={{ backgroundColor: "#FAFAF8" }}
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full flex-shrink-0",
                      item.status === "blocked"
                        ? "bg-red-400"
                        : "bg-amber-400"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-sans text-sm font-medium text-slate-900">
                      {item.clientName}
                    </span>
                    <span className="font-sans text-sm text-slate-400 ml-2">
                      {item.projectName}
                    </span>
                  </div>
                  <span className="font-sans text-xs text-slate-400 flex-shrink-0">
                    {item.blockReason}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── ZONE 3 — Client table ─────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-10 pb-10">
        {/* Table header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-sans text-base font-semibold text-slate-900">
            All clients
            <span className="ml-2 text-xs font-normal text-slate-400">
              {filtered.length} total
            </span>
          </h2>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search clients…"
                className="pl-8 pr-3 py-2 text-sm font-sans rounded-lg bg-white ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20 w-48 placeholder:text-slate-400"
              />
            </div>

            {/* Status filter */}
            <div className="relative">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                className="pl-8 py-2.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="onboarding">Onboarding</option>
                <option value="invited">Invited</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Add client */}
            <Link href="/admin/clients">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-medium"
                style={{ background: "rgb(108, 194, 255)", color: "#141414" }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add client
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Bulk action bar */}
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 px-4 py-2.5 bg-[#1C1C1E] rounded-lg flex items-center gap-3"
          >
            <span className="font-sans text-xs text-slate-300">
              {selected.size} selected
            </span>
            <button
              onClick={() => setSelected(new Set())}
              className="font-sans text-xs text-slate-400 hover:text-white"
            >
              Clear
            </button>
          </motion.div>
        )}

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="rounded border-slate-300 accent-[#1C1C1E] cursor-pointer"
                    />
                  </th>
                  {["Client", "Status", "Consultant", "Progress", "Last active", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center font-sans text-sm text-slate-400">
                      No clients match your filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((client, i) => {
                    const pct = Math.round(client.overallProgress ?? 0);
                    const isSelected = selected.has(client.id);
                    return (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className={cn(
                          "group transition-colors",
                          isSelected ? "bg-slate-50" : "hover:bg-slate-50/60"
                        )}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-3.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleOne(client.id)}
                            className="rounded border-slate-300 accent-[#1C1C1E] cursor-pointer"
                          />
                        </td>

                        {/* Client name + email */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={client.businessName} size={8} />
                            <div className="min-w-0">
                              <p className="font-sans text-sm font-semibold text-slate-900 truncate">
                                {client.businessName}
                              </p>
                              {client.email && (
                                <p className="font-sans text-xs text-slate-400 truncate">
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <StatusBadge status={client.status} />
                        </td>

                        {/* Consultant */}
                        <td className="px-4 py-3.5">
                          {client.assignedConsultant ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={client.assignedConsultant.name} size={6} />
                              <span className="font-sans text-sm text-slate-600 truncate max-w-[120px]">
                                {client.assignedConsultant.name}
                              </span>
                            </div>
                          ) : (
                            <span className="font-sans text-xs text-slate-300">Unassigned</span>
                          )}
                        </td>

                        {/* Progress */}
                        <td className="px-4 py-3.5 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.7, delay: i * 0.04, ease: "easeOut" }}
                                style={{
                                  background:
                                    pct === 100
                                      ? "#22c55e"
                                      : pct > 0
                                      ? "#3b82f6"
                                      : "transparent",
                                }}
                              />
                            </div>
                            <span className="font-sans text-xs font-medium text-slate-500 w-8 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>

                        {/* Last active */}
                        <td className="px-4 py-3.5">
                          <span className="font-sans text-sm text-slate-400">
                            {client.updatedAt
                              ? formatDistanceToNow(new Date(client.updatedAt), { addSuffix: true })
                              : "—"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Link href={`/admin/clients/${client.id}`}>
                              <motion.button
                                whileHover={{ scale: 1.08 }}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                title="Open client"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </motion.button>
                            </Link>
                            <motion.button
                              whileHover={{ scale: 1.08 }}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                              title="More options"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
            <p className="font-sans text-xs text-slate-400">
              Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce<(number | "...")[]>((acc, n, idx, arr) => {
                  if (idx > 0 && (arr[idx - 1] as number) !== n - 1) acc.push("...");
                  acc.push(n);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-slate-300 text-sm">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={cn(
                        "w-7 h-7 rounded-lg font-sans text-xs font-medium transition-colors",
                        page === item
                          ? "bg-[#1C1C1E] text-white"
                          : "text-slate-500 hover:bg-slate-100"
                      )}
                    >
                      {item}
                    </button>
                  )
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
