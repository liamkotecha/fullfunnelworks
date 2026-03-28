"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Ban,
  AlertTriangle,
  Receipt,
  ChevronRight,
  Mail,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ConsultantDTO, SubscriptionDTO, PlanDTO } from "@/types";
import { formatPence } from "@/lib/format";
import { useToast } from "@/components/notifications/ToastContext";
import { computeConsultantHealth, isCardExpiringSoon, ConsultantHealthStatus } from "@/lib/consultantHealth";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

const HEALTH_META: Record<ConsultantHealthStatus, { dot: string; pill: string; label: string }> = {
  healthy:    { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700",  label: "Healthy" },
  at_risk:    { dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700",    label: "At risk" },
  churn_risk: { dot: "bg-red-500",     pill: "bg-red-50 text-red-700",        label: "Churn risk" },
  new:        { dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-600",   label: "New" },
};

const SUB_META: Record<string, { dot: string; pill: string; label: string }> = {
  active:   { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", label: "Active" },
  trialing: { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700",       label: "Trialing" },
  past_due: { dot: "bg-red-500",     pill: "bg-red-50 text-red-600",         label: "Payment failed" },
  canceled: { dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-500",    label: "Canceled" },
  paused:   { dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700",     label: "Paused" },
};

function SubBadge({ status }: { status: string }) {
  const cfg = SUB_META[status] ?? { dot: "bg-slate-300", pill: "bg-slate-100 text-slate-500", label: status };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", cfg.pill)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function CapacityBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 100 ? "bg-red-500" : clamped >= 80 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">{clamped}%</span>
    </div>
  );
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const { error: toastError } = useToast();
  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionDTO[]>([]);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});

  const firstName = session?.user?.name?.split(" ")[0] ?? "";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/consultants").then((r) => r.json()),
      fetch("/api/admin/subscriptions").then((r) => r.json()),
      fetch("/api/admin/plans").then((r) => r.json()),
    ])
      .then(([c, s, p]) => {
        setConsultants(c.data ?? []);
        setSubscriptions(s.data ?? []);
        setPlans(p.data ?? []);
      })
      .catch(() => toastError("Couldn't load dashboard", "Please refresh"))
      .finally(() => setLoading(false));
  }, [toastError]);

  const mrrTotal = useMemo(
    () => subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.mrrPence ?? s.monthlyPricePence ?? 0), 0),
    [subscriptions]
  );
  const activeSubCount = useMemo(() => subscriptions.filter((s) => s.status === "active").length, [subscriptions]);
  const trialingCount  = useMemo(() => subscriptions.filter((s) => s.status === "trialing").length, [subscriptions]);
  const pastDueCount   = useMemo(() => subscriptions.filter((s) => s.status === "past_due").length, [subscriptions]);

  const attentionItems = useMemo(() => {
    return consultants
      .map((c) => {
        const sub = c.profile.subscription;
        const activeClientCount = Math.round(((c.profile.capacityPercent ?? 0) / 100) * (c.profile.maxActiveClients ?? 5));
        const health = computeConsultantHealth({
          createdAt: new Date(c.createdAt ?? 0),
          lastLoginAt: c.lastLoginAt ? new Date(c.lastLoginAt) : null,
          activeClientCount,
          maxClients: c.profile.maxActiveClients ?? 5,
          subscription: sub
            ? { status: sub.status, trialEnd: sub.trialEndsAt ? new Date(sub.trialEndsAt) : null, cardExpMonth: sub.cardExpMonth ?? null, cardExpYear: sub.cardExpYear ?? null }
            : null,
          healthOverride: c.profile.healthOverride ?? null,
        });
        const cardExpiring = isCardExpiringSoon(sub?.cardExpMonth ?? null, sub?.cardExpYear ?? null, 30);
        if (
          health.status === "churn_risk" ||
          (health.status === "at_risk" && cardExpiring)
        ) {
          const primaryReason = health.reasons[0] ?? (health.status === "churn_risk" ? "High churn risk" : "At risk");
          const emailType = sub?.status === "past_due" ? "payment_reminder" : c.lastLoginAt && (Date.now() - new Date(c.lastLoginAt).getTime()) > 14 * 864e5 ? "check_in" : "upgrade_nudge";
          return { id: c.id, label: c.name, subl: primaryReason, href: `/admin/consultants/${c.id}`, emailType, health: health.status as ConsultantHealthStatus };
        }
        return null;
      })
      .filter(Boolean) as { id: string; label: string; subl: string; href: string; emailType: string; health: ConsultantHealthStatus }[];
  }, [consultants]);

  const recentConsultants = useMemo(
    () => [...consultants]
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 8),
    [consultants]
  );

  if (loading) {
    return (
      <div className="px-8 pt-8 pb-10 space-y-6">
        <div className="h-8 w-56 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-slate-200/40 animate-pulse" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-64 rounded-xl bg-slate-200/40 animate-pulse" />
          <div className="h-64 rounded-xl bg-slate-200/40 animate-pulse" />
        </div>
      </div>
    );
  }

  if (consultants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-10">
        <div className="w-14 h-14 rounded-lg bg-[#1C1C1E] flex items-center justify-center mb-5">
          <Users className="w-6 h-6 text-slate-400" />
        </div>
        <h3 className="font-bold text-2xl text-slate-900 mb-2">No consultants yet</h3>
        <p className="text-sm text-slate-400 mb-7 max-w-xs leading-relaxed">
          Consultants who register will appear here. Set up plans first.
        </p>
        <Link href="/admin/plans">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-[#141414]/80 transition-colors"
          >
            Manage plans
          </motion.button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="px-8 pt-8 pb-4 flex items-end justify-between">
        <div>
          <h1 className="font-bold text-2xl text-slate-900">{greeting}, {firstName}.</h1>
          <p className="text-sm text-slate-400 mt-0.5">{format(new Date(), "EEEE, d MMMM yyyy")}</p>
        </div>
        <Link href="/admin/consultants">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#141414] text-white hover:bg-[#141414]/80 transition-colors"
          >
            View consultants
          </motion.button>
        </Link>
      </motion.div>

      {/* KPI cards */}
      <motion.div variants={fadeUp} className="px-8 pt-2 pb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Users,
              iconBg: "bg-sky-500/10",
              iconColor: "text-sky-500",
              label: "Consultants",
              value: String(consultants.length),
              sub: `${activeSubCount} with active plans`,
            },
            {
              icon: TrendingUp,
              iconBg: "bg-emerald-500/10",
              iconColor: "text-emerald-500",
              label: "MRR",
              value: formatPence(mrrTotal),
              sub: `${activeSubCount} paying subscription${activeSubCount !== 1 ? "s" : ""}`,
            },
            {
              icon: CreditCard,
              iconBg: "bg-blue-500/10",
              iconColor: "text-blue-500",
              label: "Trialing",
              value: String(trialingCount),
              sub: `${plans.filter((p) => p.isActive).length} active plan${plans.filter((p) => p.isActive).length !== 1 ? "s" : ""} available`,
            },
            {
              icon: Receipt,
              iconBg: pastDueCount > 0 ? "bg-red-500/10" : "bg-slate-100",
              iconColor: pastDueCount > 0 ? "text-red-500" : "text-slate-400",
              label: "Past due",
              value: String(pastDueCount),
              sub: pastDueCount > 0 ? "Needs attention" : "All subscriptions healthy",
            },
          ].map(({ icon: Icon, iconBg, iconColor, label, value, sub }) => (
            <div key={label} className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5 flex flex-col gap-3">
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", iconBg)}>
                <Icon className={cn("w-[18px] h-[18px]", iconColor)} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums mt-0.5">{value}</p>
              </div>
              <p className="text-xs text-slate-400">{sub}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Needs Attention + Latest Transactions row */}
      <div className="px-8 pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Attention (2/3) */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
          {attentionItems.length === 0 ? (
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50 flex-shrink-0">
                <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">All clear — nothing needs attention</p>
                <p className="text-xs text-slate-400 mt-0.5">No churn-risk or card-expiring consultants</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Needs Attention
                  <span className="ml-0.5 text-xs font-normal text-slate-400">{attentionItems.length}</span>
                </h2>
                <Link href="/admin/consultants?filter=churn_risk" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                  See all <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="divide-y divide-slate-100">
                {attentionItems.slice(0, 6).map((item) => {
                  const hmeta = HEALTH_META[item.health];
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                      <Link href={item.href} className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0", item.health === "churn_risk" ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500")}>
                          <Ban className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                            <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0", hmeta.pill)}>
                              <span className={cn("w-1 h-1 rounded-full", hmeta.dot)} />
                              {hmeta.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">{item.subl}</p>
                        </div>
                      </Link>
                      <button
                        disabled={!!sendingEmail[item.id]}
                        onClick={async () => {
                          setSendingEmail((s) => ({ ...s, [item.id]: true }));
                          try {
                            await fetch(`/api/admin/consultants/${item.id}/email`, {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ type: item.emailType }),
                            });
                          } finally {
                            setSendingEmail((s) => ({ ...s, [item.id]: false }));
                          }
                        }}
                        className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                        title="Send email"
                      >
                        {sendingEmail[item.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                      </button>
                      <Link href={item.href} className="flex-shrink-0">
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                      </Link>
                    </div>
                  );
                })}
              </div>
              {attentionItems.length > 6 && (
                <div className="px-5 py-3 border-t border-slate-100">
                  <Link href="/admin/consultants?filter=churn_risk" className="text-xs text-sky-600 hover:text-sky-700 font-medium">
                    +{attentionItems.length - 6} more consultants need attention
                  </Link>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Recent Subscriptions (1/3) */}
        <motion.div variants={fadeUp}>
          <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-4 pt-4 pb-3">
              <h2 className="text-sm font-semibold text-slate-900">Subscriptions</h2>
              <Link href="/admin/invoices" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {subscriptions.length === 0 ? (
              <div className="px-4 pb-5 text-center text-sm text-slate-400">No subscriptions yet</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {[...subscriptions]
                  .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
                  .slice(0, 6)
                  .map((sub) => {
                    const statusCfg = SUB_META[sub.status] ?? { dot: "bg-slate-300", pill: "bg-slate-100 text-slate-500", label: sub.status };
                    return (
                      <Link key={sub.id} href={`/admin/consultants/${sub.consultantId}`}>
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{sub.consultantName}</p>
                            <p className="text-xs text-slate-400 truncate">{sub.planName ?? "—"}</p>
                          </div>
                          <div className="text-right flex-shrink-0 space-y-0.5">
                            {sub.monthlyPricePence > 0 && (
                              <p className="text-sm font-semibold text-slate-900 tabular-nums">
                                £{(sub.monthlyPricePence / 100).toFixed(0)}<span className="text-xs font-normal text-slate-400">/mo</span>
                              </p>
                            )}
                            <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full", statusCfg.pill)}>
                              <span className={cn("w-1 h-1 rounded-full", statusCfg.dot)} />
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Consultants table (full width) */}
      <div className="px-8 pb-10">
        <motion.div variants={fadeUp}>
          <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h2 className="text-sm font-semibold text-slate-900">
                Consultants
                <span className="ml-1.5 text-xs font-normal text-slate-400">{consultants.length}</span>
              </h2>
              <Link href="/admin/consultants" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Consultant", "Plan", "Status", "Capacity", ""].map((h) => (
                    <th key={h} className="px-4 py-2 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider first:pl-5 last:pr-5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentConsultants.map((c) => {
                  const subStatus = (c.profile as unknown as Record<string, unknown>).subscriptionStatus as string | undefined;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="pl-5 pr-4 py-3">
                        <p className="font-medium text-slate-900 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {c.profile.plan?.name
                          ? <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100 font-medium">{c.profile.plan.name}</span>
                          : <span className="text-slate-400">No plan</span>}
                      </td>
                      <td className="px-4 py-3">
                        {subStatus ? <SubBadge status={subStatus} /> : <span className="text-xs text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <CapacityBar pct={c.profile.capacityPercent} />
                      </td>
                      <td className="pr-5 py-3">
                        <Link href={`/admin/consultants/${c.id}`}>
                          <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
