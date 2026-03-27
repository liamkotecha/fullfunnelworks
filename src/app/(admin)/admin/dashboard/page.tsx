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
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ConsultantDTO, SubscriptionDTO, PlanDTO } from "@/types";
import { formatPence } from "@/lib/format";
import { useToast } from "@/components/notifications/ToastContext";
import { formatDate } from "@/lib/utils";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp  = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } };

const SUB_META: Record<string, { dot: string; pill: string; label: string }> = {
  active:   { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700", label: "Active" },
  trialing: { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700",       label: "Trialing" },
  past_due: { dot: "bg-red-500",     pill: "bg-red-50 text-red-600",         label: "Past due" },
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
    () => subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + (s.mrrPence ?? 0), 0),
    [subscriptions]
  );
  const activeSubCount = useMemo(() => subscriptions.filter((s) => s.status === "active").length, [subscriptions]);
  const trialingCount  = useMemo(() => subscriptions.filter((s) => s.status === "trialing").length, [subscriptions]);
  const pastDueCount   = useMemo(() => subscriptions.filter((s) => s.status === "past_due").length, [subscriptions]);

  const planBreakdown = useMemo(() => {
    const m: Record<string, { name: string; count: number; mrrPence: number }> = {};
    for (const s of subscriptions) {
      if (!s.planId) continue;
      if (!m[s.planId]) m[s.planId] = { name: s.planName ?? s.planId, count: 0, mrrPence: 0 };
      m[s.planId].count += 1;
      if (s.status === "active") m[s.planId].mrrPence += s.mrrPence ?? 0;
    }
    return Object.values(m).sort((a, b) => b.count - a.count);
  }, [subscriptions]);

  const attentionItems = useMemo(() => {
    return subscriptions
      .filter((s) => s.status === "past_due")
      .map((s) => ({
        id: s.id,
        label: s.consultantName ?? "Consultant",
        subl: `Past due — ${s.planName ?? "plan"}`,
        href: `/admin/consultants/${s.consultantId}`,
      }));
  }, [subscriptions]);

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

      {/* Two-column grid */}
      <div className="px-8 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultants table (2/3) */}
        <motion.div variants={fadeUp} className="lg:col-span-2">
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

        {/* Right column (1/3) */}
        <div className="space-y-6">
          {/* Needs attention */}
          <motion.div variants={fadeUp}>
            {attentionItems.length === 0 ? (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-4">Needs Attention</h2>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-emerald-50">
                    <CheckCircle2 className="w-[18px] h-[18px] text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">All clear</p>
                    <p className="text-xs text-slate-400">No items needing attention</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
                <div className="px-4 pt-4 pb-3">
                  <h2 className="text-sm font-semibold text-slate-900">Needs Attention</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {attentionItems.map((item) => (
                    <Link key={item.id} href={item.href}>
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors cursor-pointer">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-red-50 text-red-500">
                          <Ban className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{item.label}</p>
                          <p className="text-xs text-slate-400 truncate">{item.subl}</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Plan breakdown */}
          <motion.div variants={fadeUp}>
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-4 pb-3">
                <h2 className="text-sm font-semibold text-slate-900">Plans</h2>
                <Link href="/admin/plans" className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors">
                  Manage <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              {planBreakdown.length === 0 ? (
                <div className="px-4 pb-5 text-center text-sm text-slate-400">
                  No active subscriptions yet
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {planBreakdown.map((p) => (
                    <div key={p.name} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.count} consultant{p.count !== 1 ? "s" : ""}</p>
                      </div>
                      {p.mrrPence > 0 && (
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">
                          {formatPence(p.mrrPence)}<span className="text-xs text-slate-400 font-normal">/mo</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {subscriptions.length > 0 && (
                <div className="border-t border-slate-100 px-4 py-3 flex items-center justify-between">
                  <Link href="/admin/invoices" className="text-xs text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors">
                    View all subscriptions <ArrowRight className="w-3 h-3" />
                  </Link>
                  <span className="text-xs text-slate-400 tabular-nums">{formatDate(new Date().toISOString())}</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
