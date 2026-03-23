"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback, useMemo } from "react";
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
  Search,
  ExternalLink,
  ChevronLeft,
  AlertTriangle,
  Clock,
  Receipt,
  CircleDollarSign,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import {
  ClientDTO,
  ProjectDTO,
  ProspectDTO,
  InvoiceDTO,
  PROSPECT_STAGE_META,
} from "@/types";
import type { ProspectStage } from "@/types";
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

/* ── pipeline stage styling (static for Tailwind purge) ────── */
const STAGE_CARD_STYLES: Record<string, { bg: string; border: string; dot: string; text: string }> = {
  blue:   { bg: "bg-blue-50",    border: "border-blue-200",    dot: "bg-blue-500",    text: "text-blue-700" },
  indigo: { bg: "bg-indigo-50",  border: "border-indigo-200",  dot: "bg-indigo-500",  text: "text-indigo-700" },
  purple: { bg: "bg-purple-50",  border: "border-purple-200",  dot: "bg-purple-500",  text: "text-purple-700" },
  amber:  { bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500",   text: "text-amber-700" },
  orange: { bg: "bg-orange-50",  border: "border-orange-200",  dot: "bg-orange-500",  text: "text-orange-700" },
  green:  { bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700" },
  gray:   { bg: "bg-slate-50",   border: "border-slate-200",   dot: "bg-slate-400",   text: "text-slate-600" },
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
function Avatar({ name, size = "w-7 h-7" }: { name: string; size?: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className={cn(
        "rounded-full bg-[#1C1C1E] flex items-center justify-center flex-shrink-0",
        size
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
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  /* Client table state */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects").then((r) => r.json()),
      fetch("/api/invoices").then((r) => r.json()),
    ]).then(([c, p, pr, inv]) => {
      setClients(c.data ?? []);
      setProjects(p.data ?? []);
      setProspects(pr.data ?? []);
      setInvoices(inv.data ?? []);
      setLoading(false);
    });

    // Fire-and-forget staleness sync
    fetch("/api/admin/staleness/sync", { method: "POST" })
      .then(() => fetch("/api/projects").then((r) => r.json()))
      .then((p) => {
        if (p.data) setProjects(p.data);
      })
      .catch(() => {});
  }, []);

  /* ── derived metrics ─────────────────────────────────────── */
  const blocked = projects.filter((p) => p.status === "blocked");
  const activeClients = clients.filter(
    (c) => c.status === "active" || c.status === "onboarding"
  );
  const staleProjects = projects.filter(
    (p) => p.staleness === "at_risk" || p.staleness === "stalled"
  );
  const atRiskProjects = staleProjects
    .filter((p) => p.staleness === "at_risk")
    .sort(
      (a, b) =>
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime()
    );
  const stalledProjects = staleProjects
    .filter((p) => p.staleness === "stalled")
    .sort(
      (a, b) =>
        new Date(a.lastActivityAt).getTime() -
        new Date(b.lastActivityAt).getTime()
    );

  const avgPortfolioProgress =
    clients.length > 0
      ? Math.round(
          clients.reduce((s, c) => s + (c.overallProgress ?? 0), 0) /
            clients.length
        )
      : 0;

  /* Pipeline metrics */
  const activeStages: ProspectStage[] = [
    "mql",
    "sql",
    "discovery",
    "proposal",
    "negotiating",
  ];
  const closedStages: ProspectStage[] = ["won", "lost"];
  const pipelineValue = prospects
    .filter((p) => activeStages.includes(p.stage))
    .reduce((s, p) => s + (p.dealValue ?? 0), 0);
  const leadsThisMonth = prospects.filter((p) => {
    const d = new Date(p.createdAt);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  }).length;
  const wonThisMonth = prospects.filter((p) => {
    if (p.stage !== "won" || !p.wonAt) return false;
    const d = new Date(p.wonAt);
    const now = new Date();
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const wonValue = wonThisMonth.reduce((s, p) => s + (p.dealValue ?? 0), 0);

  /* Invoice metrics */
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const outstandingInvoices = invoices.filter(
    (i) => i.status === "sent" || i.status === "overdue"
  );
  const overdueInvoices = invoices.filter((i) => i.status === "overdue");
  const totalRevenue = paidInvoices.reduce(
    (s, i) => s + i.amountPence,
    0
  );
  const totalOutstanding = outstandingInvoices.reduce(
    (s, i) => s + i.amountPence,
    0
  );
  const totalOverdue = overdueInvoices.reduce(
    (s, i) => s + i.amountPence,
    0
  );

  /* Project metrics */
  const inProgressProjects = projects.filter(
    (p) => p.status === "in_progress"
  );
  const completedProjects = projects.filter((p) => p.status === "completed");

  /* ── Terminate / Extend modal state ──────────────────────── */
  const [terminateTarget, setTerminateTarget] = useState<ProjectDTO | null>(
    null
  );
  const [terminateReason, setTerminateReason] = useState("");
  const [terminating, setTerminating] = useState(false);
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
            ? {
                ...p,
                staleness: "terminated" as const,
                terminatedAt: new Date().toISOString(),
                terminatedReason: terminateReason,
              }
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

  /* ── Needs attention items ───────────────────────────────── */
  const attentionItems = useMemo(() => {
    const items: {
      id: string;
      label: string;
      sublabel: string;
      severity: "red" | "amber" | "yellow";
      icon: React.ElementType;
      href: string;
      meta?: string;
    }[] = [];

    // Blocked projects
    blocked.forEach((p) => {
      const name =
        (p.clientId as unknown as { businessName?: string })?.businessName ??
        String(p.clientId);
      items.push({
        id: `block-${p.id}`,
        label: name,
        sublabel: p.blocks?.[p.blocks.length - 1]?.reason ?? "Blocked",
        severity: "red",
        icon: Ban,
        href: `/admin/projects/${p.id}`,
      });
    });

    // Overdue invoices
    overdueInvoices.forEach((inv) => {
      items.push({
        id: `inv-${inv.id}`,
        label: inv.clientName ?? inv.title,
        sublabel: `${inv.amountFormatted} overdue`,
        severity: "red",
        icon: Receipt,
        href: `/admin/invoices/${inv.id}`,
        meta: inv.dueDate
          ? formatDistanceToNow(new Date(inv.dueDate), { addSuffix: true })
          : undefined,
      });
    });

    // At-risk projects
    atRiskProjects.forEach((p) => {
      const name =
        (p.clientId as unknown as { businessName?: string })?.businessName ??
        String(p.clientId);
      const days = Math.round(
        (Date.now() - new Date(p.lastActivityAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      items.push({
        id: `risk-${p.id}`,
        label: name,
        sublabel: `At risk — ${days}d idle`,
        severity: "amber",
        icon: AlertTriangle,
        href: `/admin/projects/${p.id}`,
      });
    });

    // Stalled
    stalledProjects.forEach((p) => {
      const name =
        (p.clientId as unknown as { businessName?: string })?.businessName ??
        String(p.clientId);
      const days = Math.round(
        (Date.now() - new Date(p.lastActivityAt).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      items.push({
        id: `stall-${p.id}`,
        label: name,
        sublabel: `Stalled — ${days}d idle`,
        severity: "yellow",
        icon: Clock,
        href: `/admin/projects/${p.id}`,
      });
    });

    return items;
  }, [blocked, overdueInvoices, atRiskProjects, stalledProjects]);

  /* ── Client table filter + pagination ────────────────────── */
  const filtered = clients.filter((c) => {
    const matchSearch =
      search.trim() === "" ||
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  /* Greeting */
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? "Good morning"
      : hour < 18
        ? "Good afternoon"
        : "Good evening";
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  /* ── loading skeleton ──────────────────────────────────────── */
  if (loading) {
    return (
      <div className="px-8 pt-8 pb-10 space-y-6">
        <div className="h-8 w-56 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-slate-200/40 animate-pulse"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-xl bg-slate-200/40 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-200/40 animate-pulse" />
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
        <h3 className="font-bold text-2xl text-slate-900 mb-2">
          No clients yet
        </h3>
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

  /* ═══════════════════════════════════════════════════════════ */
  /* ═══ RENDER ═══════════════════════════════════════════════ */
  /* ═══════════════════════════════════════════════════════════ */

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        className="px-8 pt-8 pb-2 flex items-end justify-between"
      >
        <div>
          <h1 className="font-bold text-2xl text-slate-900">
            {greeting}, {firstName}.
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {format(new Date(), "EEEE, d MMMM yyyy")}
          </p>
        </div>
        <Link href="/admin/clients">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-medium"
            style={{ background: "#141414", color: "#fff" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add client
          </motion.button>
        </Link>
      </motion.div>

      {/* ── KPI STAT CARDS ─────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-8 pt-4 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Users2,
              iconBg: "bg-sky-500/10",
              iconColor: "text-sky-500",
              label: "Active Clients",
              value: activeClients.length,
              sub: `${clients.length} total · ${avgPortfolioProgress}% avg progress`,
            },
            {
              icon: TrendingUp,
              iconBg: "bg-violet-500/10",
              iconColor: "text-violet-500",
              label: "Pipeline Value",
              value: formatPence(pipelineValue),
              sub: `${leadsThisMonth} new lead${leadsThisMonth !== 1 ? "s" : ""} this month`,
            },
            {
              icon: CircleDollarSign,
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-500",
              label: "Revenue Collected",
              value: formatPence(totalRevenue),
              sub: `${paidInvoices.length} paid invoice${paidInvoices.length !== 1 ? "s" : ""}`,
            },
            {
              icon: Receipt,
              iconBg: totalOverdue > 0 ? "bg-red-500/10" : "bg-amber-500/10",
              iconColor: totalOverdue > 0 ? "text-red-500" : "text-amber-500",
              label: "Outstanding",
              value: formatPence(totalOutstanding),
              sub: totalOverdue > 0
                ? `${overdueInvoices.length} overdue (${formatPence(totalOverdue)})`
                : `${outstandingInvoices.length} pending`,
            },
          ].map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
            <div
              key={label}
              className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5 flex flex-col gap-3"
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  iconBg
                )}
              >
                <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {label}
                </p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">
                  {value}
                </p>
              </div>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── TWO-COLUMN GRID ────────────────────────────────── */}
      <div className="px-8 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (2/3) ────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── SALES PIPELINE ─────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Sales Pipeline
              </h2>
              <Link
                href="/admin/crm/pipeline"
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                View full pipeline <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {prospects.length === 0 ? (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-8 text-center">
                <p className="text-sm text-slate-400">
                  No prospects yet.{" "}
                  <Link
                    href="/admin/crm/pipeline"
                    className="text-slate-600 underline underline-offset-2"
                  >
                    Add your first lead
                  </Link>
                </p>
              </div>
            ) : (
              <>
                {/* Stage cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
                  {(activeStages as ProspectStage[]).map((stage) => {
                    const meta = PROSPECT_STAGE_META[stage];
                    const style =
                      STAGE_CARD_STYLES[meta.colour] ??
                      STAGE_CARD_STYLES.gray;
                    const stageProspects = prospects.filter(
                      (p) => p.stage === stage
                    );
                    const count = stageProspects.length;
                    const value = stageProspects.reduce(
                      (s, p) => s + (p.dealValue ?? 0),
                      0
                    );
                    return (
                      <Link key={stage} href="/admin/crm/pipeline">
                        <div
                          className={cn(
                            "rounded-xl border p-4 transition-shadow hover:shadow-md cursor-pointer",
                            style.bg,
                            style.border
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full",
                                style.dot
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs font-semibold uppercase tracking-wider",
                                style.text
                              )}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <p
                            className={cn(
                              "text-2xl font-bold tabular-nums",
                              style.text
                            )}
                          >
                            {count}
                          </p>
                          {value > 0 && (
                            <p className="text-xs text-slate-500 mt-1 tabular-nums">
                              {formatPence(value)}
                            </p>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Won / Lost row */}
                <div className="flex items-center gap-4 mt-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-medium text-slate-600">
                      Won:{" "}
                      <span className="font-bold text-emerald-600 tabular-nums">
                        {
                          prospects.filter((p) => p.stage === "won")
                            .length
                        }
                      </span>
                      {wonValue > 0 && (
                        <span className="text-slate-400 ml-1 tabular-nums">
                          ({formatPence(wonValue)} this month)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-xs font-medium text-slate-600">
                      Lost:{" "}
                      <span className="font-bold text-slate-500 tabular-nums">
                        {
                          prospects.filter((p) => p.stage === "lost")
                            .length
                        }
                      </span>
                    </span>
                  </div>
                  <div className="ml-auto text-xs text-slate-400">
                    {leadsThisMonth} new this month
                  </div>
                </div>
              </>
            )}
          </motion.div>

          {/* ── PROJECTS OVERVIEW ──────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Projects
              </h2>
              <Link
                href="/admin/projects"
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                All projects <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              {/* Project stats row */}
              <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
                {[
                  {
                    label: "In Progress",
                    count: inProgressProjects.length,
                    color: "text-blue-600",
                  },
                  {
                    label: "Completed",
                    count: completedProjects.length,
                    color: "text-emerald-600",
                  },
                  {
                    label: "Blocked",
                    count: blocked.length,
                    color: blocked.length > 0 ? "text-red-600" : "text-slate-400",
                  },
                  {
                    label: "Total",
                    count: projects.length,
                    color: "text-slate-900",
                  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="px-4 py-3.5 text-center">
                    <p
                      className={cn(
                        "text-xl font-bold tabular-nums",
                        color
                      )}
                    >
                      {count}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent active projects list */}
              <div className="divide-y divide-slate-50">
                {inProgressProjects.slice(0, 5).map((p) => {
                  const clientName =
                    (
                      p.clientId as unknown as {
                        businessName?: string;
                      }
                    )?.businessName ?? p.clientName ?? String(p.clientId);
                  return (
                    <Link
                      key={p.id}
                      href={`/admin/projects/${p.id}`}
                    >
                      <div className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {clientName}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {p.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-xs text-slate-400 tabular-nums">
                            {p.activeModules?.length ?? 0} modules
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
                {inProgressProjects.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No active projects
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ───────────────────────────── */}
        <div className="space-y-6">
          {/* ── NEEDS ATTENTION ─────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Needs Attention
            </h2>

            {attentionItems.length === 0 ? (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(112, 255, 162, 0.1)",
                  }}
                >
                  <CheckCircle2
                    className="w-[18px] h-[18px]"
                    style={{ color: "rgb(112, 255, 162)" }}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    All clear
                  </p>
                  <p className="text-xs text-slate-400">
                    No items needing attention
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] divide-y divide-slate-100 overflow-hidden">
                {attentionItems.slice(0, 6).map((item) => {
                  const Icon = item.icon;
                  const severityStyles = {
                    red: "bg-red-50 text-red-500",
                    amber: "bg-amber-50 text-amber-500",
                    yellow: "bg-yellow-50 text-yellow-600",
                  };
                  return (
                    <Link key={item.id} href={item.href}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer">
                        <div
                          className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                            severityStyles[item.severity]
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {item.sublabel}
                          </p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      </div>
                    </Link>
                  );
                })}
                {attentionItems.length > 6 && (
                  <div className="px-4 py-2.5 text-center">
                    <span className="text-xs text-slate-400">
                      +{attentionItems.length - 6} more
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* ── INVOICING ──────────────────────────────────── */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">
                Invoicing
              </h2>
              <Link
                href="/admin/invoices"
                className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                All invoices <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              {/* Mini stat grid */}
              <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                {[
                  {
                    label: "Draft",
                    count: invoices.filter((i) => i.status === "draft")
                      .length,
                    color: "text-slate-500",
                  },
                  {
                    label: "Sent",
                    count: invoices.filter((i) => i.status === "sent")
                      .length,
                    color: "text-amber-600",
                  },
                  {
                    label: "Paid",
                    count: paidInvoices.length,
                    color: "text-emerald-600",
                  },
                ].map(({ label, count, color }) => (
                  <div key={label} className="px-3 py-3 text-center">
                    <p
                      className={cn(
                        "text-lg font-bold tabular-nums",
                        color
                      )}
                    >
                      {count}
                    </p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Recent invoices */}
              <div className="divide-y divide-slate-50">
                {invoices.slice(0, 4).map((inv) => {
                  const statusStyles: Record<
                    string,
                    { dot: string; text: string }
                  > = {
                    draft: { dot: "bg-slate-300", text: "text-slate-500" },
                    sent: { dot: "bg-amber-400", text: "text-amber-600" },
                    paid: {
                      dot: "bg-emerald-500",
                      text: "text-emerald-600",
                    },
                    overdue: { dot: "bg-red-500", text: "text-red-600" },
                    void: { dot: "bg-slate-300", text: "text-slate-400" },
                  };
                  const s = statusStyles[inv.status] ?? statusStyles.draft;
                  return (
                    <Link key={inv.id} href={`/admin/invoices/${inv.id}`}>
                      <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50/60 transition-colors cursor-pointer">
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            s.dot
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-700 truncate">
                            {inv.clientName ?? inv.title}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold tabular-nums flex-shrink-0",
                            s.text
                          )}
                        >
                          {inv.amountFormatted}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {invoices.length === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-slate-400">
                    No invoices yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CLIENT TABLE ───────────────────────────────────── */}
      <motion.div variants={fadeUp} className="px-8 pb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Clients
            <span className="ml-2 text-xs font-normal text-slate-400">
              {filtered.length}
            </span>
          </h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search clients…"
                className="pl-8 pr-3 py-2 text-sm font-sans rounded-lg bg-white ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20 w-48 placeholder:text-slate-400"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="py-2 px-3 text-sm rounded-lg bg-white ring-1 ring-black/[0.08] text-slate-600 outline-none focus:ring-2 focus:ring-[#1C1C1E]/20"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="invited">Invited</option>
              <option value="paused">Paused</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  {[
                    "Client",
                    "Status",
                    "Consultant",
                    "Progress",
                    "Last active",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-sans text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-12 text-center font-sans text-sm text-slate-400"
                    >
                      No clients match your filters.
                    </td>
                  </tr>
                ) : (
                  paginated.map((client, i) => {
                    const pct = Math.round(
                      client.overallProgress ?? 0
                    );
                    return (
                      <motion.tr
                        key={client.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.03,
                          duration: 0.25,
                        }}
                        className="group hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={client.businessName}
                              size="w-8 h-8"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate">
                                {client.businessName}
                              </p>
                              {client.email && (
                                <p className="text-xs text-slate-400 truncate">
                                  {client.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={client.status} />
                        </td>
                        <td className="px-4 py-3">
                          {client.assignedConsultant ? (
                            <span className="text-sm text-slate-600 truncate">
                              {client.assignedConsultant.name}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[140px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <motion.div
                                className="h-full rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{
                                  duration: 0.7,
                                  delay: i * 0.04,
                                  ease: "easeOut",
                                }}
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
                            <span className="text-xs font-medium text-slate-500 w-8 text-right tabular-nums">
                              {pct}%
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-400">
                            {client.updatedAt
                              ? formatDistanceToNow(
                                  new Date(client.updatedAt),
                                  { addSuffix: true }
                                )
                              : "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/admin/clients/${client.id}`}
                          >
                            <span className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-all inline-flex">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </span>
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 tabular-nums">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from(
                  { length: totalPages },
                  (_, i) => i + 1
                )
                  .filter(
                    (n) =>
                      n === 1 ||
                      n === totalPages ||
                      Math.abs(n - page) <= 1
                  )
                  .reduce<(number | "...")[]>((acc, n, idx, arr) => {
                    if (
                      idx > 0 &&
                      (arr[idx - 1] as number) !== n - 1
                    )
                      acc.push("...");
                    acc.push(n);
                    return acc;
                  }, [])
                  .map((item, idx) =>
                    item === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-1 text-slate-300 text-sm"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={item}
                        onClick={() => setPage(item as number)}
                        className={cn(
                          "w-7 h-7 rounded-lg text-xs font-medium transition-colors",
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
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page === totalPages}
                  className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── TERMINATE MODAL ────────────────────────────────── */}
      {terminateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Terminate engagement
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              This will mark the project as terminated. All data is preserved
              read-only. This cannot be undone.
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
                onClick={() => {
                  setTerminateTarget(null);
                  setTerminateReason("");
                }}
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

      {/* ── EXTEND DEADLINE MODAL ──────────────────────────── */}
      {extendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Extend deadline
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Set a new due date for{" "}
              <strong>{extendTarget.title}</strong>.
            </p>
            <input
              type="date"
              value={extendDate}
              onChange={(e) => setExtendDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => {
                  setExtendTarget(null);
                  setExtendDate("");
                }}
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
    </motion.div>
  );
}
