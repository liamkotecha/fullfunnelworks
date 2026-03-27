"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { TrendingUp, Users, Clock, AlertCircle, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubscriptionDTO } from "@/types";
import { useToast } from "@/components/notifications/ToastContext";

type Tab = "subscriptions" | "invoices";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── status badge ────────────────────────────────────────────── */
const SUB_STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Active",    cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  trialing: { label: "Trialing",  cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  past_due: { label: "Past due",  cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  canceled: { label: "Canceled",  cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  paused:   { label: "Paused",    cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function SubBadge({ status }: { status: string }) {
  const meta = SUB_STATUS_META[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 ring-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1", meta.cls)}>
      {meta.label}
    </span>
  );
}

function formatPence(pence: number) {
  return `£${(pence / 100).toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ── KPI card ─────────────────────────────────────────────────── */
function KpiCard({ label, value, sub, icon: Icon, colour }: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; colour: string;
}) {
  return (
    <div className="rounded-xl bg-white ring-1 ring-black/[0.06] p-5 flex items-start gap-4">
      <div className={cn("mt-0.5 flex h-10 w-10 items-center justify-center rounded-lg shrink-0", colour)}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Invoice types (simplified) ──────────────────────────────── */
interface InvoiceRow {
  _id: string;
  invoiceNumber?: string;
  amount?: number;
  status?: string;
  clientId?: string;
  clientName?: string;
  dueDate?: string;
  createdAt?: string;
  stripeInvoiceId?: string;
}

export default function BillingPage() {
  const router = useRouter();
  const { error: toastError } = useToast();

  const [tab, setTab] = useState<Tab>("subscriptions");

  // Subscriptions tab state
  const [subs, setSubs] = useState<SubscriptionDTO[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  // Invoices tab state
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [invoicesLoaded, setInvoicesLoaded] = useState(false);

  // Filters
  const [subSearch, setSubSearch] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState<string>("all");
  const [invSearch, setInvSearch] = useState("");
  const [invStatusFilter, setInvStatusFilter] = useState<string>("all");

  // Load subscriptions on mount
  useEffect(() => {
    fetch("/api/admin/subscriptions")
      .then((r) => r.json())
      .then((d) => {
        setSubs(Array.isArray(d) ? d : d.data ?? d.subscriptions ?? []);
        setSubsLoading(false);
      })
      .catch(() => {
        toastError("Failed to load subscriptions");
        setSubsLoading(false);
      });
  }, []);

  // Load invoices lazily when tab is switched
  const loadInvoices = useCallback(() => {
    if (invoicesLoaded) return;
    setInvoicesLoading(true);
    fetch("/api/invoices?limit=200")
      .then((r) => r.json())
      .then((d) => {
        setInvoices(Array.isArray(d) ? d : d.invoices ?? d.data ?? []);
        setInvoicesLoaded(true);
        setInvoicesLoading(false);
      })
      .catch(() => {
        toastError("Failed to load invoices");
        setInvoicesLoading(false);
      });
  }, [invoicesLoaded]);

  const handleTabChange = (t: Tab) => {
    setTab(t);
    if (t === "invoices") loadInvoices();
    setSubSearch("");
    setInvSearch("");
    setSubStatusFilter("all");
    setInvStatusFilter("all");
  };

  // KPIs
  const totalMrr = useMemo(
    () => subs.filter((s) => s.status === "active").reduce((a, s) => a + (s.mrrPence ?? s.monthlyPricePence ?? 0), 0),
    [subs]
  );
  const activeCount   = useMemo(() => subs.filter((s) => s.status === "active").length, [subs]);
  const trialingCount = useMemo(() => subs.filter((s) => s.status === "trialing").length, [subs]);
  const pastDueCount  = useMemo(() => subs.filter((s) => s.status === "past_due").length, [subs]);

  // Filtered subscriptions
  const filteredSubs = useMemo(() => {
    const q = subSearch.toLowerCase();
    return subs.filter((s) => {
      const matchStatus = subStatusFilter === "all" || s.status === subStatusFilter;
      const matchSearch = !q || s.consultantName?.toLowerCase().includes(q) || s.consultantEmail?.toLowerCase().includes(q) || s.planName?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [subs, subSearch, subStatusFilter]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const q = invSearch.toLowerCase();
    return invoices.filter((inv) => {
      const matchStatus = invStatusFilter === "all" || inv.status === invStatusFilter;
      const matchSearch = !q || inv.clientName?.toLowerCase().includes(q) || inv.invoiceNumber?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, invSearch, invStatusFilter]);

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Billing</h1>
          <p className="text-sm text-slate-500 mt-0.5">Consultant subscriptions and client invoices</p>
        </div>
      </motion.div>

      {/* KPI row — subscriptions only */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Monthly MRR" value={formatPence(totalMrr)} icon={TrendingUp} colour="bg-emerald-50 text-emerald-600" />
        <KpiCard label="Active" value={String(activeCount)} sub="subscriptions" icon={Users} colour="bg-sky-50 text-sky-600" />
        <KpiCard label="Trialing" value={String(trialingCount)} sub="consultants" icon={Clock} colour="bg-amber-50 text-amber-600" />
        <KpiCard label="Past due" value={String(pastDueCount)} sub="need attention" icon={AlertCircle} colour="bg-rose-50 text-rose-600" />
      </motion.div>

      {/* Tab bar */}
      <motion.div variants={fadeUp} className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(["subscriptions", "invoices"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => handleTabChange(t)}
            className={cn(
              "px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize",
              tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            {t === "subscriptions" ? "Subscriptions" : "Client Invoices"}
          </button>
        ))}
      </motion.div>

      {/* ── Subscriptions tab ─────────────────────────────────── */}
      {tab === "subscriptions" && (
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search consultant or plan…"
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex gap-1">
              {["all", "active", "trialing", "past_due", "canceled", "paused"].map((s) => (
                <button
                  key={s}
                  onClick={() => setSubStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    subStatusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {s === "all" ? "All" : s === "past_due" ? "Past due" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {subsLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filteredSubs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400">No subscriptions found.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white ring-1 ring-black/[0.06] overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/70">
                    <th className="pl-5 pr-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Consultant</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Plan</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">MRR</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Period end</th>
                    <th className="pr-5 pl-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSubs.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => router.push(`/admin/consultants/${s.consultantId}`)}
                      className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <td className="pl-5 pr-4 py-3.5">
                        <p className="font-medium text-sm text-slate-900">{s.consultantName}</p>
                        <p className="text-xs text-slate-400">{s.consultantEmail}</p>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">
                        {s.planName || <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        <SubBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-slate-700">
                        {s.status === "active"
                          ? formatPence(s.mrrPence ?? s.monthlyPricePence ?? 0)
                          : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">
                        {formatDate(s.currentPeriodEnd)}
                      </td>
                      <td className="pr-5 pl-4 py-3.5 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {/* ── Client Invoices tab ───────────────────────────────── */}
      {tab === "invoices" && (
        <motion.div variants={fadeUp} className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="text"
              placeholder="Search client or invoice…"
              value={invSearch}
              onChange={(e) => setInvSearch(e.target.value)}
              className="w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
            />
            <div className="flex gap-1">
              {["all", "draft", "sent", "paid", "overdue"].map((s) => (
                <button
                  key={s}
                  onClick={() => setInvStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                    invStatusFilter === s ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  )}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {invoicesLoading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 text-sm">Loading…</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
              <p className="text-sm text-slate-400">No invoices found.</p>
            </div>
          ) : (
            <div className="rounded-xl bg-white ring-1 ring-black/[0.06] overflow-hidden">
              <table className="min-w-full divide-y divide-slate-100">
                <thead>
                  <tr className="bg-slate-50/70">
                    <th className="pl-5 pr-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Client</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Due</th>
                    <th className="pr-5 pl-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInvoices.map((inv) => (
                    <tr key={inv._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="pl-5 pr-4 py-3.5 text-sm font-mono text-slate-600">
                        {inv.invoiceNumber ?? inv._id.slice(-6).toUpperCase()}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-700">{inv.clientName ?? "—"}</td>
                      <td className="px-4 py-3.5 text-sm tabular-nums text-slate-700">
                        {inv.amount != null ? formatPence(inv.amount) : "—"}
                      </td>
                      <td className="px-4 py-3.5">
                        {inv.status && (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                            {inv.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-sm text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="pr-5 pl-4 py-3.5 text-right">
                        {inv.stripeInvoiceId && (
                          <a
                            href={`https://dashboard.stripe.com/invoices/${inv.stripeInvoiceId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700"
                          >
                            Stripe <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
