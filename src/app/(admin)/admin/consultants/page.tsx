"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight, ChevronUp, ChevronDown, AlertTriangle, Mail, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultantDTO, ConsultantHealthStatus } from "@/types";
import {
  computeConsultantHealth,
  isCardExpiringSoon,
  ConsultantHealthResult,
} from "@/lib/consultantHealth";
import { useToast } from "@/components/notifications/ToastContext";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.22 } } };

type FilterKey = "all" | ConsultantHealthStatus | "card_expiring";
type SortKey = "health" | "plan" | "lastActive" | "utilisation";

const HEALTH_ORDER: Record<ConsultantHealthStatus, number> = {
  churn_risk: 0, at_risk: 1, new: 2, healthy: 3,
};

const HEALTH_META: Record<ConsultantHealthStatus, { label: string; dot: string; pill: string }> = {
  healthy:    { label: "Healthy",    dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  at_risk:    { label: "At risk",    dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 ring-amber-200" },
  churn_risk: { label: "Churn risk", dot: "bg-red-500",     pill: "bg-red-50 text-red-700 ring-red-200" },
  new:        { label: "New",        dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-600 ring-slate-200" },
};

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "All", healthy: "Healthy", at_risk: "At risk",
  churn_risk: "Churn risk", new: "New", card_expiring: "Card expiring",
};

/* ── Plan badge (tier-coloured) ──────────────────────────────── */
function PlanBadge({ name }: { name?: string | null }) {
  if (!name)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">
        <AlertTriangle className="w-3 h-3" />
        No plan
      </span>
    );
  const lower = name.toLowerCase();
  const cls = lower.includes("enterprise")
    ? "bg-purple-50 text-purple-700 ring-purple-200"
    : lower.includes("growth")
    ? "bg-sky-50 text-sky-700 ring-sky-200"
    : "bg-slate-100 text-slate-600 ring-slate-200";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1", cls)}>
      {name}
    </span>
  );
}

/* ── Subscription cell ───────────────────────────────────────── */
const SUB_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  trialing: { label: "Trialing", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
  past_due: { label: "Past due", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  canceled: { label: "Canceled", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  paused:   { label: "Paused",   cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function SubscriptionCell({
  status, trialEndsAt, cardExpMonth, cardExpYear,
}: {
  status?: string | null;
  trialEndsAt?: string | null;
  cardExpMonth?: number | null;
  cardExpYear?: number | null;
}) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const meta = SUB_META[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 ring-slate-200" };
  let subLabel = meta.label;
  if (status === "trialing" && trialEndsAt) {
    const days = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / 86400000);
    if (days >= 0) subLabel = `Trialing · ${days}d left`;
  }
  const cardExpired = isCardExpiringSoon(cardExpMonth ?? null, cardExpYear ?? null, 0);
  const cardSoon = !cardExpired && isCardExpiringSoon(cardExpMonth ?? null, cardExpYear ?? null, 30);
  return (
    <div className="space-y-1">
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1", meta.cls)}>
        {subLabel}
      </span>
      {cardExpired && (
        <div className="text-[10px] font-medium text-red-600">Card expired</div>
      )}
      {cardSoon && !cardExpired && (
        <div className="text-[10px] font-medium text-amber-600">
          Card expiring {String(cardExpMonth).padStart(2, "0")}/{String(cardExpYear).slice(-2)}
        </div>
      )}
    </div>
  );
}

/* ── Utilisation bar ─────────────────────────────────────────── */
function UtilBar({ used, max }: { used: number; max: number }) {
  if (max === 0) return <span className="text-xs text-slate-400">—</span>;
  const pct = Math.min(100, Math.round((used / max) * 100));
  const colour =
    pct >= 90 ? "bg-blue-500" : pct >= 70 ? "bg-amber-400" : pct < 20 ? "bg-red-400" : "bg-emerald-400";
  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs text-slate-500 tabular-nums">{used}/{max}</span>
      </div>
    </div>
  );
}

/* ── Last active badge ───────────────────────────────────────── */
function LastActiveBadge({ lastLoginAt }: { lastLoginAt: string | null }) {
  if (!lastLoginAt)
    return <span className="text-xs text-amber-600 font-medium">Never logged in</span>;
  const diff = Math.floor((Date.now() - new Date(lastLoginAt).getTime()) / 86400000);
  const text =
    diff === 0 ? "Today" :
    diff === 1 ? "Yesterday" :
    diff < 7 ? `${diff} days ago` :
    diff < 30 ? `${Math.round(diff / 7)} week${Math.round(diff / 7) !== 1 ? "s" : ""} ago` :
    `${Math.round(diff / 30)} month${Math.round(diff / 30) !== 1 ? "s" : ""} ago`;
  return (
    <span className={cn("text-xs", diff >= 22 ? "text-red-600 font-medium" : "text-slate-600")}>
      {text}
    </span>
  );
}

/* ── Health badge with tooltip ───────────────────────────────── */
function HealthBadge({ health }: { health: ConsultantHealthResult }) {
  const meta = HEALTH_META[health.status];
  return (
    <div className="relative group/ht inline-flex">
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 cursor-default", meta.pill)}>
        <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </span>
      {health.reasons.length > 0 && (
        <div className="absolute invisible group-hover/ht:visible opacity-0 group-hover/ht:opacity-100 transition-opacity duration-150 bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none min-w-[200px]">
          <div className="bg-slate-900 text-white text-[11px] leading-relaxed rounded-lg px-3 py-2 shadow-xl text-left space-y-0.5">
            {health.reasons.map((r, i) => <p key={i}>{r}</p>)}
          </div>
          <div className="w-2 h-2 bg-slate-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
        </div>
      )}
    </div>
  );
}

/* ── Sortable column header ──────────────────────────────────── */
function SortTh({
  label, sortKey, current, dir, onSort, className,
}: {
  label: string; sortKey: SortKey; current: SortKey; dir: "asc" | "desc"; onSort: (k: SortKey) => void; className?: string;
}) {
  const active = current === sortKey;
  return (
    <th
      className={cn("px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:text-slate-600 transition-colors", className)}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {active ? (
          dir === "asc" ? <ChevronUp className="w-3 h-3 text-slate-600" /> : <ChevronDown className="w-3 h-3 text-slate-600" />
        ) : (
          <ChevronDown className="w-3 h-3 text-slate-300" />
        )}
      </span>
    </th>
  );
}

/* ── Main page ───────────────────────────────────────────────── */
type EnrichedConsultant = ConsultantDTO & { health: ConsultantHealthResult };

export default function ConsultantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();

  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sortKey, setSortKey] = useState<SortKey>("health");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (status === "authenticated" && (session?.user as { role?: string })?.role === "admin") {
      fetch("/api/admin/consultants")
        .then((r) => r.json())
        .then((data) => { setConsultants(data.data ?? []); setLoading(false); })
        .catch(() => { toastError("Failed to load consultants"); setLoading(false); });
    }
  }, [status, session, toastError]);

  // Compute health for each consultant
  const enriched = useMemo<EnrichedConsultant[]>(() =>
    consultants.map((c) => ({
      ...c,
      health: computeConsultantHealth({
        createdAt: new Date(c.createdAt),
        lastLoginAt: c.lastLoginAt ? new Date(c.lastLoginAt) : null,
        activeClientCount: c.profile.currentActiveClients,
        maxClients: c.profile.maxActiveClients,
        subscription: c.profile.subscription
          ? {
              status: c.profile.subscriptionStatus ?? c.profile.subscription.status,
              trialEnd: c.profile.subscription.trialEndsAt
                ? new Date(c.profile.subscription.trialEndsAt)
                : null,
              cardExpMonth: c.profile.subscription.cardExpMonth,
              cardExpYear: c.profile.subscription.cardExpYear,
            }
          : null,
        healthOverride: c.profile.healthOverride ?? null,
      }),
    })),
    [consultants],
  );

  // health counts for filter pill badges
  const counts = useMemo(() => {
    const m: Record<FilterKey, number> = { all: enriched.length, healthy: 0, at_risk: 0, churn_risk: 0, new: 0, card_expiring: 0 };
    for (const c of enriched) {
      m[c.health.status]++;
      if (isCardExpiringSoon(c.profile.subscription?.cardExpMonth ?? null, c.profile.subscription?.cardExpYear ?? null, 30))
        m.card_expiring++;
    }
    return m;
  }, [enriched]);

  // Filter
  const filtered = useMemo<EnrichedConsultant[]>(() => {
    let r = enriched;
    if (search) {
      const q = search.toLowerCase();
      r = r.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
    }
    if (filter === "card_expiring") {
      r = r.filter((c) =>
        isCardExpiringSoon(c.profile.subscription?.cardExpMonth ?? null, c.profile.subscription?.cardExpYear ?? null, 30),
      );
    } else if (filter !== "all") {
      r = r.filter((c) => c.health.status === filter);
    }
    return r;
  }, [enriched, search, filter]);

  // Sort
  const sorted = useMemo<EnrichedConsultant[]>(() => {
    const mult = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      if (sortKey === "health") return (HEALTH_ORDER[a.health.status] - HEALTH_ORDER[b.health.status]) * mult;
      if (sortKey === "plan") return ((a.profile.planName ?? "").localeCompare(b.profile.planName ?? "")) * mult;
      if (sortKey === "lastActive") {
        const da = a.lastLoginAt ? new Date(a.lastLoginAt).getTime() : 0;
        const db = b.lastLoginAt ? new Date(b.lastLoginAt).getTime() : 0;
        return (db - da) * mult;
      }
      if (sortKey === "utilisation") {
        return ((a.profile.capacityPercent ?? 0) - (b.profile.capacityPercent ?? 0)) * mult;
      }
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  async function handleQuickEmail(consultantId: string, emailType: string) {
    setSendingEmail((s) => ({ ...s, [consultantId]: true }));
    try {
      const res = await fetch(`/api/admin/consultants/${consultantId}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: emailType }),
      });
      if (!res.ok) throw new Error();
      toastSuccess("Email sent", "The consultant has been notified");
    } catch {
      toastError("Failed to send email", "Please try again");
    } finally {
      setSendingEmail((s) => ({ ...s, [consultantId]: false }));
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="px-8 pt-8 space-y-4">
        <div className="h-8 w-48 bg-slate-200/60 rounded animate-pulse" />
        <div className="h-10 w-full max-w-sm bg-slate-200/40 rounded animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200/40 animate-pulse" />
      </div>
    );
  }

  const LEFT_BORDER: Record<ConsultantHealthStatus, string> = {
    churn_risk: "border-l-[3px] border-l-red-400",
    at_risk:    "border-l-[3px] border-l-amber-400",
    healthy:    "",
    new:        "",
  };

  return (
    <motion.div className="px-8 pt-8 pb-12 space-y-5" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Consultants</h1>
          <p className="text-sm text-slate-500 mt-0.5">{consultants.length} total</p>
        </div>
        <button
          onClick={() => router.push("/admin/consultants/invite")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          + Invite consultant
        </button>
      </motion.div>

      {/* Search + filter pills */}
      <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(FILTER_LABELS) as FilterKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                filter === key
                  ? "bg-slate-900 text-white"
                  : "bg-white ring-1 ring-slate-200 text-slate-600 hover:ring-slate-400",
              )}
            >
              {FILTER_LABELS[key]}
              {counts[key] > 0 && filter !== key && (
                <span className={cn(
                  "text-[10px] rounded-full px-1.5 py-0.5 font-bold",
                  key === "churn_risk" ? "bg-red-100 text-red-700" :
                  key === "at_risk" ? "bg-amber-100 text-amber-700" :
                  key === "card_expiring" ? "bg-amber-100 text-amber-700" :
                  "bg-slate-100 text-slate-500"
                )}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Table */}
      {sorted.length === 0 ? (
        <motion.div variants={fadeUp} className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">
            {search || filter !== "all" ? "No consultants match your filters." : "No consultants yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="rounded-xl bg-white ring-1 ring-black/[0.06] overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="pl-5 pr-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Consultant
                </th>
                <SortTh label="Plan" sortKey="plan" current={sortKey} dir={sortDir} onSort={handleSort} className="px-4" />
                <th className="px-4 py-2.5 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Subscription
                </th>
                <SortTh label="Utilisation" sortKey="utilisation" current={sortKey} dir={sortDir} onSort={handleSort} className="px-4" />
                <SortTh label="Last Active" sortKey="lastActive" current={sortKey} dir={sortDir} onSort={handleSort} className="px-4" />
                <SortTh label="Health" sortKey="health" current={sortKey} dir={sortDir} onSort={handleSort} className="px-4" />
                <th className="pr-5 pl-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sorted.map((c) => {
                const sub = c.profile.subscription;
                const subStatus = c.profile.subscriptionStatus ?? sub?.status;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "hover:bg-slate-50/50 cursor-pointer transition-colors group",
                      LEFT_BORDER[c.health.status],
                    )}
                    onClick={() => router.push(`/admin/consultants/${c.id}`)}
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="font-medium text-sm text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlanBadge name={c.profile.planName} />
                    </td>
                    <td className="px-4 py-3.5">
                      <SubscriptionCell
                        status={subStatus}
                        trialEndsAt={sub?.trialEndsAt}
                        cardExpMonth={sub?.cardExpMonth}
                        cardExpYear={sub?.cardExpYear}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <UtilBar
                        used={c.profile.currentActiveClients}
                        max={c.profile.maxActiveClients}
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <LastActiveBadge lastLoginAt={c.lastLoginAt} />
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <HealthBadge health={c.health} />
                        {(c.health.status === "churn_risk" || c.health.status === "at_risk") && (
                          <button
                            disabled={sendingEmail[c.id]}
                            onClick={() => {
                              const type =
                                c.profile.subscriptionStatus === "past_due" ||
                                isCardExpiringSoon(sub?.cardExpMonth ?? null, sub?.cardExpYear ?? null, 30)
                                  ? "payment_reminder"
                                  : c.profile.subscriptionStatus === "trialing"
                                  ? "upgrade_nudge"
                                  : "check_in";
                              handleQuickEmail(c.id, type);
                            }}
                            title="Send alert email"
                            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-40"
                          >
                            {sendingEmail[c.id] ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Mail className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="pr-5 pl-4 py-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
