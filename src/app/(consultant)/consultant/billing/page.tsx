"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Users,
  Package,
  Calendar,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { formatDate } from "@/lib/utils";

const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

const STATUS_META: Record<string, { label: string; pill: string; icon: React.ComponentType<{ className?: string }> }> = {
  active:   { label: "Active",    pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  trialing: { label: "Trial",     pill: "bg-blue-50 text-blue-700 border-blue-200",          icon: CheckCircle2 },
  past_due: { label: "Past due",  pill: "bg-red-50 text-red-600 border-red-200",             icon: AlertTriangle },
  canceled: { label: "Canceled",  pill: "bg-slate-100 text-slate-500 border-slate-200",      icon: AlertTriangle },
  paused:   { label: "Paused",    pill: "bg-amber-50 text-amber-700 border-amber-200",        icon: AlertTriangle },
};

interface BillingData {
  plan: {
    id: string;
    name: string;
    description: string | null;
    monthlyPricePence: number;
    maxActiveClients: number;
    allowedModules: string[];
  } | null;
  subscription: {
    id: string;
    status: string;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    stripeSubscriptionId: string | null;
  } | null;
  activeClients: number;
  maxActiveClients: number;
}

export default function ConsultantBillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/consultant/billing")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError("Could not load billing information."); setLoading(false); });
  }, []);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/consultant/billing/portal", { method: "POST" });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 pt-2">
        <div className="h-8 w-40 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-40 rounded-xl bg-slate-100 animate-pulse" />
        <div className="h-32 rounded-xl bg-slate-100 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto pt-8 text-center">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-600">{error}</p>
      </div>
    );
  }

  const status = data?.subscription?.status ?? "none";
  const statusMeta = STATUS_META[status];
  const clientCapPct = data
    ? Math.min(100, Math.round((data.activeClients / data.maxActiveClients) * 100))
    : 0;

  const nextBillingDate = data?.subscription?.currentPeriodEnd
    ? formatDate(new Date(data.subscription.currentPeriodEnd))
    : data?.subscription?.trialEndsAt
    ? formatDate(new Date(data.subscription.trialEndsAt))
    : null;

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your plan and subscription</p>
      </motion.div>

      {/* Plan card */}
      <motion.div variants={fadeUp} className="card space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-medium">Current Plan</p>
              <p className="text-lg font-bold text-slate-900">
                {data?.plan?.name ?? "No plan"}
              </p>
            </div>
          </div>
          {statusMeta && (
            <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border", statusMeta.pill)}>
              <statusMeta.icon className="w-3.5 h-3.5" />
              {statusMeta.label}
            </span>
          )}
        </div>

        {data?.plan && (
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {formatPence(data.plan.monthlyPricePence)}
            <span className="text-sm font-normal text-slate-400 ml-1">/ month</span>
          </div>
        )}

        {data?.plan?.description && (
          <p className="text-sm text-slate-500">{data.plan.description}</p>
        )}

        {/* Client usage bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Users className="w-4 h-4 text-slate-400" />
              Active clients
            </div>
            <span className="text-sm font-medium text-slate-900 tabular-nums">
              {data?.activeClients ?? 0} / {data?.maxActiveClients ?? 5}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                clientCapPct >= 100 ? "bg-red-500" : clientCapPct >= 80 ? "bg-amber-400" : "bg-emerald-500"
              )}
              style={{ width: `${clientCapPct}%` }}
            />
          </div>
          {clientCapPct >= 80 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {clientCapPct >= 100 ? "Client cap reached — upgrade to add more" : "Approaching client limit"}
            </p>
          )}
        </div>

        {/* Allowed modules */}
        {data?.plan?.allowedModules && data.plan.allowedModules.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Included modules</p>
            <div className="flex flex-wrap gap-1.5">
              {data.plan.allowedModules.map((mod) => (
                <span key={mod} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium capitalize">
                  {mod.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Subscription dates */}
      {data?.subscription && (
        <motion.div variants={fadeUp} className="card space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900 text-sm">Billing Schedule</h2>
          </div>
          <dl className="grid grid-cols-2 gap-4">
            {data.subscription.currentPeriodStart && (
              <div>
                <dt className="text-xs text-slate-400">Period started</dt>
                <dd className="text-sm font-medium text-slate-900 mt-0.5">
                  {formatDate(new Date(data.subscription.currentPeriodStart))}
                </dd>
              </div>
            )}
            {nextBillingDate && (
              <div>
                <dt className="text-xs text-slate-400">
                  {status === "trialing" ? "Trial ends" : "Next renewal"}
                </dt>
                <dd className="text-sm font-medium text-slate-900 mt-0.5">{nextBillingDate}</dd>
              </div>
            )}
          </dl>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={openBillingPortal}
          disabled={portalLoading || !data?.subscription?.stripeSubscriptionId}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
          Manage billing & invoices
        </button>
        <Link
          href="/pricing"
          className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          View all plans
        </Link>
      </motion.div>

      {!data?.subscription?.stripeSubscriptionId && (
        <motion.div variants={fadeUp} className="text-xs text-slate-400 -mt-2">
          Stripe billing portal is available once your subscription is linked to Stripe.
        </motion.div>
      )}
    </motion.div>
  );
}
