"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  FolderKanban,
  CreditCard,
  LayoutDashboard,
  Loader2,
  Check,
  X,
  ChevronRight,
  BadgeCheck,
  Pencil,
  AlertCircle,
  Eye,
  Activity,
  Mail,
  ShieldCheck,
  Clock,
  CreditCard as CardIcon,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { formatDate } from "@/lib/utils";
import {
  ClientDTO,
  ProjectDTO,
  InvoiceDTO,
  PlanDTO,
  MODULE_META,
  INVOICE_STATUS_META,
  CLIENT_STATUS_META,
  AdminEmailDTO,
} from "@/types";
import {
  computeConsultantHealth,
  isCardExpiringSoon,
  ConsultantHealthStatus,
} from "@/lib/consultantHealth";
import { useToast } from "@/components/notifications/ToastContext";
import { Badge } from "@/components/ui/Badge";

type Tab = "overview" | "clients" | "projects" | "billing" | "health";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview",  label: "Overview",          icon: LayoutDashboard },
  { id: "clients",   label: "Clients",           icon: Users },
  { id: "projects",  label: "Projects",          icon: FolderKanban },
  { id: "billing",   label: "Billing",           icon: CreditCard },
  { id: "health",    label: "Health & Retention", icon: Activity },
];

const SUB_STATUS_META: Record<string, { label: string; dot: string; pill: string }> = {
  active:   { label: "Active",    dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  trialing: { label: "Trial",     dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  past_due: { label: "Past due",  dot: "bg-red-500",     pill: "bg-red-50 text-red-600" },
  canceled: { label: "Canceled",  dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-500" },
  paused:   { label: "Paused",    dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700" },
  none:     { label: "No plan",   dot: "bg-slate-300",   pill: "bg-slate-100 text-slate-400" },
};

function SubBadge({ status }: { status: string }) {
  const cfg = SUB_STATUS_META[status] ?? SUB_STATUS_META.none;
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
      <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">{clamped}%</span>
    </div>
  );
}

interface ConsultantDetail {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastLoginAt: string | null;
  loginHistory: string[];
  profile: {
    maxActiveClients: number;
    specialisms: string[];
    totalLeadsAssigned: number;
    healthOverride: "healthy" | null;
    healthOverrideNote: string | null;
    healthOverrideAt: string | null;
    plan: PlanDTO | null;
    subscription: {
      id: string;
      status: string;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      trialEndsAt: string | null;
      canceledAt: string | null;
      notes: string | null;
      cardExpMonth: number | null;
      cardExpYear: number | null;
      stripeSubscriptionId: string | null;
    } | null;
  };
}

export default function ConsultantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [consultant, setConsultant] = useState<ConsultantDetail | null>(null);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [loadingConsultant, setLoadingConsultant] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [editingPlan, setEditingPlan] = useState(false);
  const [viewingAs, setViewingAs] = useState(false);
  // Health tab state
  const [adminEmails, setAdminEmails] = useState<AdminEmailDTO[]>([]);
  const [cardDetails, setCardDetails] = useState<{ brand: string; last4: string; expMonth: number; expYear: number } | null | undefined>(undefined);
  const [healthOverrideNote, setHealthOverrideNote] = useState("");
  const [savingOverride, setSavingOverride] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<Record<string, boolean>>({});

  // Auth guard
  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as { role?: string })?.role !== "admin") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  // Load consultant + plans
  const loadConsultant = useCallback(async () => {
    try {
      const [cRes, pRes] = await Promise.all([
        fetch(`/api/admin/consultants/${params.id}`),
        fetch("/api/admin/plans"),
      ]);
      const [cData, pData] = await Promise.all([cRes.json(), pRes.json()]);
      setConsultant(cData.data ?? null);
      setPlans(pData.data ?? []);
      setSelectedPlanId(cData.data?.profile?.plan?.id ?? "");
    } catch {
      toastError("Couldn't load consultant", "Please refresh");
    } finally {
      setLoadingConsultant(false);
    }
  }, [params.id, toastError]);

  useEffect(() => { loadConsultant(); }, [loadConsultant]);

  // Load tab data on demand
  useEffect(() => {
    if (!consultant) return;
    if (tab === "clients" && clients.length === 0) {
      setLoadingTab(true);
      fetch(`/api/clients?assignedConsultant=${params.id}`)
        .then((r) => r.json())
        .then((d) => { setClients(d.data ?? []); setLoadingTab(false); })
        .catch(() => setLoadingTab(false));
    }
    if (tab === "projects" && projects.length === 0) {
      setLoadingTab(true);
      fetch(`/api/projects?assignedConsultant=${params.id}`)
        .then((r) => r.json())
        .then((d) => { setProjects(d.data ?? []); setLoadingTab(false); })
        .catch(() => setLoadingTab(false));
    }
    if (tab === "billing" && invoices.length === 0) {
      setLoadingTab(true);
      fetch(`/api/invoices?consultantId=${params.id}`)
        .then((r) => r.json())
        .then((d) => { setInvoices(d.data ?? []); setLoadingTab(false); })
        .catch(() => setLoadingTab(false));
    }
    if (tab === "health") {
      // Fetch admin emails (always refresh)
      fetch(`/api/admin/consultants/${params.id}/email`)
        .then((r) => r.json())
        .then((d) => setAdminEmails(d.data ?? []))
        .catch(() => {});
      // Fetch card details lazily (only once)
      if (cardDetails === undefined) {
        fetch(`/api/admin/consultants/${params.id}/card`)
          .then((r) => r.json())
          .then((d) => setCardDetails(d.data ?? null))
          .catch(() => setCardDetails(null));
      }
    }
  }, [tab, consultant, params.id, clients.length, projects.length, invoices.length, cardDetails]);

  const handleAssignPlan = useCallback(async () => {
    if (!selectedPlanId) return;
    setSavingPlan(true);
    try {
      const res = await fetch(`/api/admin/consultants/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId }),
      });
      if (!res.ok) throw new Error("Failed to assign plan");
      await loadConsultant();
      setEditingPlan(false);
      success("Plan assigned", "Consultant's limits have been updated");
    } catch (e) {
      toastError("Failed to assign plan", (e as Error).message);
    } finally {
      setSavingPlan(false);
    }
  }, [selectedPlanId, params.id, loadConsultant, success, toastError]);

  if (loadingConsultant) {
    return (
      <div className="px-8 pt-8 space-y-4">
        <div className="h-6 w-32 bg-slate-200/60 rounded animate-pulse" />
        <div className="h-20 rounded-xl bg-slate-200/40 animate-pulse" />
        <div className="h-64 rounded-xl bg-slate-200/40 animate-pulse" />
      </div>
    );
  }

  if (!consultant) {
    return (
      <div className="px-8 pt-8">
        <Link href="/admin/consultants" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Consultants
        </Link>
        <p className="text-slate-500">Consultant not found.</p>
      </div>
    );
  }

  const subStatus = consultant.profile.subscription?.status ?? "none";
  const currentActive = clients.filter(
    (c) => c.status === "active" || c.status === "onboarding"
  ).length;
  const maxActive = consultant.profile.maxActiveClients ?? 5;
  const capacityPct = maxActive > 0 ? Math.round((currentActive / maxActive) * 100) : 0;

  return (
    <div className="px-8 pt-8 pb-12">
      {/* Back */}
      <Link
        href="/admin/consultants"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        All consultants
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#1C1C1E] flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-base">
              {consultant.name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("")}
            </span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{consultant.name}</h1>
            <p className="text-sm text-slate-400">{consultant.email}</p>
          </div>
          <SubBadge status={subStatus} />
        </div>
        <button
          disabled={viewingAs}
          onClick={async () => {
            setViewingAs(true);
            const res = await fetch("/api/admin/view-as-consultant", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ consultantId: consultant.id }),
            });
            if (res.ok) {
              window.location.href = "/consultant/dashboard";
            } else {
              setViewingAs(false);
            }
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {viewingAs ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          View as consultant
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
              tab === t.id
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-700"
            )}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────── */}
      {tab === "overview" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Plan card */}
          <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm text-slate-900">Current Plan</h2>
              <button
                onClick={() => setEditingPlan(!editingPlan)}
                className="flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Change plan
              </button>
            </div>

            {editingPlan ? (
              <div className="space-y-3">
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
                >
                  <option value="">Select a plan…</option>
                  {plans.filter((p) => p.isActive).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPence(p.monthlyPricePence)}/mo
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleAssignPlan}
                    disabled={savingPlan || !selectedPlanId}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-40 transition-colors"
                  >
                    {savingPlan && <Loader2 className="w-3 h-3 animate-spin" />}
                    <Check className="w-3 h-3" />
                    Assign
                  </button>
                  <button
                    onClick={() => { setEditingPlan(false); setSelectedPlanId(consultant.profile.plan?.id ?? ""); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : consultant.profile.plan ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-sky-500" />
                  <span className="font-semibold text-slate-900">{consultant.profile.plan.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Monthly</p>
                    <p className="font-bold text-slate-900 mt-0.5">{formatPence(consultant.profile.plan.monthlyPricePence)}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">Annual</p>
                    <p className="font-bold text-slate-900 mt-0.5">{formatPence(consultant.profile.plan.annualPricePence)}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs text-slate-600">
                  <span>Max {consultant.profile.plan.maxActiveClients} clients</span>
                  <span>·</span>
                  <span>{consultant.profile.plan.maxProjectsPerClient} project{consultant.profile.plan.maxProjectsPerClient !== 1 ? "s" : ""}/client</span>
                  {consultant.profile.plan.trialDays > 0 && (
                    <>
                      <span>·</span>
                      <span>{consultant.profile.plan.trialDays}d trial</span>
                    </>
                  )}
                </div>
                {consultant.profile.plan.allowedModules.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {consultant.profile.plan.allowedModules.map((m) => (
                      <span
                        key={m}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-sky-50 text-sky-700 border border-sky-100"
                      >
                        {MODULE_META[m]?.label ?? m}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <AlertCircle className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">No plan assigned</p>
                <p className="text-xs text-slate-400 mt-0.5">Click &quot;Change plan&quot; to assign one</p>
              </div>
            )}
          </div>

          {/* Subscription + stats */}
          <div className="space-y-4">
            {consultant.profile.subscription && (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
                <h2 className="font-semibold text-sm text-slate-900 mb-3">Subscription</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <SubBadge status={consultant.profile.subscription.status} />
                  </div>
                  {consultant.profile.subscription.trialEndsAt && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Trial ends</span>
                      <span className="text-slate-900 font-medium">
                        {formatDate(consultant.profile.subscription.trialEndsAt)}
                      </span>
                    </div>
                  )}
                  {consultant.profile.subscription.currentPeriodEnd && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Period ends</span>
                      <span className="text-slate-900 font-medium">
                        {formatDate(consultant.profile.subscription.currentPeriodEnd)}
                      </span>
                    </div>
                  )}
                  {consultant.profile.subscription.notes && (
                    <div className="mt-2 p-2.5 bg-amber-50 rounded-lg text-xs text-amber-700">
                      {consultant.profile.subscription.notes}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5 space-y-3">
              <h2 className="font-semibold text-sm text-slate-900">Stats</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active clients</span>
                  <span className="font-semibold text-slate-900">
                    {currentActive}
                    <span className="text-slate-400 font-normal">/{maxActive}</span>
                  </span>
                </div>
                <CapacityBar pct={capacityPct} />
                <div className="flex justify-between">
                  <span className="text-slate-500">Total leads assigned</span>
                  <span className="font-semibold text-slate-900">{consultant.profile.totalLeadsAssigned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Joined</span>
                  <span className="text-slate-900">{formatDate(consultant.createdAt)}</span>
                </div>
                {consultant.profile.plan && (
                  <>
                    <div className="pt-1 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-2">Plan usage</p>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active clients</span>
                      <span className="font-semibold text-slate-900">
                        {currentActive}
                        <span className="text-slate-400 font-normal">/{consultant.profile.plan.maxActiveClients}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Projects / client</span>
                      <span className="font-semibold text-slate-900">
                        {projects.length}
                        <span className="text-slate-400 font-normal"> used · max {consultant.profile.plan.maxProjectsPerClient}/client</span>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Clients Tab ──────────────────────────────── */}
      {tab === "clients" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {loadingTab ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-200/40 animate-pulse" />
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500">No clients yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Client", "Status", "Progress", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider first:pl-5 last:pr-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {clients.map((c) => {
                    const meta = CLIENT_STATUS_META?.[c.status];
                    return (
                      <tr key={c._id} className="hover:bg-slate-50/50">
                        <td className="pl-5 pr-4 py-3.5">
                          <p className="font-medium text-slate-900">{c.businessName}</p>
                          <p className="text-xs text-slate-400">{c.email}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {meta ? (
                            <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", meta.pill)}>
                              <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                              {meta.label}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">{c.status}</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {c.overallProgress !== undefined ? `${Math.round(c.overallProgress)}%` : "—"}
                        </td>
                        <td className="pr-5 py-3.5 text-right">
                          <Link
                            href={`/admin/clients/${c._id}`}
                            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Projects Tab ─────────────────────────────── */}
      {tab === "projects" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {loadingTab ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-slate-200/40 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <FolderKanban className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-slate-500">No projects yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {["Project", "Client", "Status", ""].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider first:pl-5 last:pr-5"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {projects.map((p) => {
                    const statusColors: Record<string, string> = {
                      in_progress: "bg-amber-50 text-amber-700",
                      blocked: "bg-red-50 text-red-600",
                      completed: "bg-emerald-50 text-emerald-700",
                      not_started: "bg-slate-100 text-slate-500",
                    };
                    const clientName =
                      typeof p.clientId === "object" && "businessName" in p.clientId
                        ? p.clientId.businessName
                        : p.clientName ?? "—";
                    const clientId =
                      typeof p.clientId === "object" && "_id" in p.clientId
                        ? p.clientId._id
                        : String(p.clientId);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50">
                        <td className="pl-5 pr-4 py-3.5 font-medium text-slate-900">{p.title}</td>
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/admin/clients/${clientId}`}
                            className="text-sky-600 hover:text-sky-700 text-xs font-medium"
                          >
                            {clientName}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              statusColors[p.status] ?? "bg-slate-100 text-slate-500"
                            )}
                          >
                            {p.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="pr-5 py-3.5 text-right">
                          <Link
                            href={`/admin/projects/${p._id}`}
                            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                          >
                            View
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Billing Tab ──────────────────────────────── */}
      {tab === "billing" && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Subscription summary */}
          <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
            <h2 className="font-semibold text-sm text-slate-900 mb-4">Subscription</h2>
            {consultant.profile.subscription ? (
              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Status</p>
                  <SubBadge status={consultant.profile.subscription.status} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Plan</p>
                  <p className="font-semibold text-slate-900">{consultant.profile.plan?.name ?? "—"}</p>
                </div>
                {consultant.profile.plan && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Monthly value</p>
                    <p className="font-semibold text-slate-900">{formatPence(consultant.profile.plan.monthlyPricePence)}</p>
                  </div>
                )}
                {consultant.profile.subscription.trialEndsAt && (
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider mb-1">Trial ends</p>
                    <p className="font-semibold text-slate-900">{formatDate(consultant.profile.subscription.trialEndsAt)}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No subscription — assign a plan in the Overview tab</p>
            )}
          </div>

          {/* Client invoices (support view) */}
          <div>
            <h2 className="font-semibold text-sm text-slate-900 mb-3">
              Client invoices
              <span className="ml-1.5 text-xs font-normal text-slate-400">(support view)</span>
            </h2>
            {loadingTab ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 rounded-xl bg-slate-200/40 animate-pulse" />
                ))}
              </div>
            ) : invoices.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center bg-white rounded-xl ring-1 ring-black/[0.06]">
                <p className="text-slate-400 text-sm">No client invoices found</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Invoice", "Client", "Amount", "Status", ""].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider first:pl-5 last:pr-5"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {invoices.map((inv) => {
                      const meta = INVOICE_STATUS_META[inv.status];
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50">
                          <td className="pl-5 pr-4 py-3 font-medium text-slate-900">{inv.title}</td>
                          <td className="px-4 py-3 text-slate-600">{inv.clientName ?? "—"}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 tabular-nums">
                            {formatPence(inv.amountPence)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={meta?.badge as import("@/components/ui/Badge").BadgeVariant ?? "neutral"}>
                              {meta?.label ?? inv.status}
                            </Badge>
                          </td>
                          <td className="pr-5 py-3 text-right">
                            <Link
                              href={`/admin/invoices/${inv.id}`}
                              className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-medium"
                            >
                              View
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Health & Retention Tab ───────────────────── */}
      {tab === "health" && (() => {
        const HEALTH_META: Record<ConsultantHealthStatus, { label: string; dot: string; pill: string }> = {
          healthy:    { label: "Healthy",    dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
          at_risk:    { label: "At risk",    dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700" },
          churn_risk: { label: "Churn risk", dot: "bg-red-500",     pill: "bg-red-50 text-red-700" },
          new:        { label: "New",        dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-600" },
        };

        const health = computeConsultantHealth({
          createdAt: new Date(consultant.createdAt),
          lastLoginAt: consultant.lastLoginAt ? new Date(consultant.lastLoginAt) : null,
          activeClientCount: currentActive,
          maxClients: maxActive,
          subscription: consultant.profile.subscription
            ? {
                status: consultant.profile.subscription.status,
                trialEnd: consultant.profile.subscription.trialEndsAt
                  ? new Date(consultant.profile.subscription.trialEndsAt)
                  : null,
                cardExpMonth: consultant.profile.subscription.cardExpMonth,
                cardExpYear: consultant.profile.subscription.cardExpYear,
              }
            : null,
          healthOverride: consultant.profile.healthOverride ?? null,
        });
        const hmeta = HEALTH_META[health.status];

        async function handleSendEmail(type: string) {
          setSendingEmail((s) => ({ ...s, [type]: true }));
          try {
            const res = await fetch(`/api/admin/consultants/${params.id}/email`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type }),
            });
            if (!res.ok) throw new Error();
            const d = await res.json();
            setAdminEmails((prev) => [d.data, ...prev]);
            success("Email sent", "The consultant has been notified");
          } catch {
            toastError("Failed to send email", "Please try again");
          } finally {
            setSendingEmail((s) => ({ ...s, [type]: false }));
          }
        }

        async function handleSaveOverride(override: "healthy" | null) {
          setSavingOverride(true);
          try {
            await fetch(`/api/admin/consultants/${params.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                healthOverride: override,
                healthOverrideNote: override ? healthOverrideNote : null,
              }),
            });
            await loadConsultant();
            success(override ? "Override saved" : "Override cleared", "");
          } catch {
            toastError("Failed to save", "Please try again");
          } finally {
            setSavingOverride(false);
          }
        }

        const emailLabels: Record<string, string> = {
          payment_reminder: "Send payment reminder",
          check_in: "Send check-in",
          upgrade_nudge: "Send upgrade nudge",
        };

        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Status + reasons */}
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm text-slate-900">Health Status</h2>
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", hmeta.pill)}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", hmeta.dot)} />
                  {hmeta.label}
                </span>
              </div>
              {health.reasons.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {health.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
              {/* Quick email actions */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                {["payment_reminder", "check_in", "upgrade_nudge"].map((type) => (
                  <button
                    key={type}
                    disabled={!!sendingEmail[type]}
                    onClick={() => handleSendEmail(type)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-40 transition-colors"
                  >
                    {sendingEmail[type] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    {emailLabels[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual override */}
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-sm text-slate-900">Manual Override</h2>
              </div>
              {consultant.profile.healthOverride ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">
                    Marked <span className="font-semibold text-emerald-700">Healthy</span> by admin
                    {consultant.profile.healthOverrideAt && (
                      <> on {formatDate(consultant.profile.healthOverrideAt)}</>
                    )}
                    {consultant.profile.healthOverrideNote && (
                      <> — <em className="text-slate-500">{consultant.profile.healthOverrideNote}</em></>
                    )}
                  </p>
                  <button
                    disabled={savingOverride}
                    onClick={() => handleSaveOverride(null)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 transition-colors"
                  >
                    {savingOverride ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                    Clear override
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400">
                    Use this if you&apos;ve spoken to the consultant offline and confirmed they&apos;re engaged.
                  </p>
                  <textarea
                    value={healthOverrideNote}
                    onChange={(e) => setHealthOverrideNote(e.target.value)}
                    placeholder="Add a note (optional) — e.g. Spoke with them on 28 March, onboarding a new client next week"
                    rows={2}
                    className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-slate-300 placeholder:text-slate-400"
                  />
                  <button
                    disabled={savingOverride}
                    onClick={() => handleSaveOverride("healthy")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 transition-colors"
                  >
                    {savingOverride ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    Mark as healthy
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Login history */}
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-sm text-slate-900">Login History</h2>
                  <span className="text-xs text-slate-400">(last 10)</span>
                </div>
                {consultant.loginHistory.length === 0 ? (
                  <p className="text-sm text-slate-400">No logins recorded yet</p>
                ) : (
                  <ol className="space-y-1.5">
                    {consultant.loginHistory.map((ts, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className={cn("text-slate-600", i === 0 && "font-medium text-slate-900")}>
                          {i === 0 ? "Most recent" : `#${i + 1}`}
                        </span>
                        <span className="text-slate-500 text-xs">{formatDate(ts)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Card details */}
              <div className="bg-white rounded-xl ring-1 ring-black/[0.06] p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CardIcon className="w-4 h-4 text-slate-500" />
                  <h2 className="font-semibold text-sm text-slate-900">Payment Card</h2>
                </div>
                {cardDetails === undefined ? (
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : cardDetails === null ? (
                  <p className="text-sm text-slate-400">No card on file</p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-500 capitalize">{cardDetails.brand}</span>
                      <span className="text-sm font-semibold text-slate-900">•••• {cardDetails.last4}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-500">Expires</span>
                      <span className={cn(
                        "font-medium",
                        isCardExpiringSoon(cardDetails.expMonth, cardDetails.expYear, 0)
                          ? "text-red-600"
                          : isCardExpiringSoon(cardDetails.expMonth, cardDetails.expYear, 30)
                          ? "text-amber-600"
                          : "text-slate-900"
                      )}>
                        {String(cardDetails.expMonth).padStart(2, "0")}/{cardDetails.expYear}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin email history */}
            <div className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <Mail className="w-4 h-4 text-slate-500" />
                <h2 className="font-semibold text-sm text-slate-900">Emails Sent</h2>
                <span className="text-xs text-slate-400">{adminEmails.length}</span>
              </div>
              {adminEmails.length === 0 ? (
                <div className="px-5 pb-5 text-sm text-slate-400">No emails sent to this consultant yet</div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {adminEmails.map((e) => {
                    const typeLabels: Record<string, string> = {
                      payment_reminder: "Payment reminder",
                      check_in: "Check-in",
                      upgrade_nudge: "Upgrade nudge",
                    };
                    return (
                      <div key={e.id} className="flex items-center justify-between px-5 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{typeLabels[e.emailType] ?? e.emailType}</p>
                          <p className="text-xs text-slate-400">{e.subject}</p>
                        </div>
                        <span className="text-xs text-slate-400">{formatDate(e.sentAt)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        );
      })()}
    </div>
  );
}
