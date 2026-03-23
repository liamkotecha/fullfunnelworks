"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Send,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import type { InvoiceDTO, InvoiceStatus } from "@/types";
import { INVOICE_STATUS_META, PAYMENT_MODEL_META, MODULE_META } from "@/types";
import type { ModuleId } from "@/types";
import { useToast } from "@/components/notifications/ToastContext";

/* ── Seller details (until Settings model supports company info) ── */

const SELLER = {
  name: "Full Funnel Works",
  addressLine1: "",
  city: "",
  postcode: "",
  country: "United Kingdom",
};

/* ── Action config per status ──────────────────────────────── */

interface ActionDef {
  action: "send" | "void" | "markPaid";
  label: string;
  icon: React.ElementType;
  className: string;
  confirm: string;
}

const ACTIONS_BY_STATUS: Partial<Record<InvoiceStatus, ActionDef[]>> = {
  draft: [
    {
      action: "send",
      label: "Send Invoice",
      icon: Send,
      className: "bg-[#141414] text-white hover:bg-[#141414]/90",
      confirm:
        "This will create a Stripe invoice and email it to the client. Continue?",
    },
    {
      action: "void",
      label: "Void",
      icon: XCircle,
      className: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
      confirm: "This will permanently void this invoice. Continue?",
    },
  ],
  sent: [
    {
      action: "markPaid",
      label: "Mark as Paid",
      icon: CheckCircle2,
      className: "bg-emerald-600 text-white hover:bg-emerald-700",
      confirm: "Mark this invoice as paid?",
    },
    {
      action: "void",
      label: "Void",
      icon: XCircle,
      className: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
      confirm:
        "This will void the invoice and cancel the Stripe payment. Continue?",
    },
  ],
  overdue: [
    {
      action: "markPaid",
      label: "Mark as Paid",
      icon: CheckCircle2,
      className: "bg-emerald-600 text-white hover:bg-emerald-700",
      confirm: "Mark this overdue invoice as paid?",
    },
    {
      action: "void",
      label: "Void",
      icon: XCircle,
      className: "bg-white text-red-600 ring-1 ring-red-200 hover:bg-red-50",
      confirm:
        "This will void the overdue invoice. Continue?",
    },
  ],
};

/* ── Helper: format address lines ──────────────────────────── */

function addressLines(addr: {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  postcode?: string;
  country?: string;
}): string[] {
  return [
    addr.addressLine1,
    addr.addressLine2,
    [addr.city, addr.postcode].filter(Boolean).join(" "),
    addr.country,
  ].filter(Boolean) as string[];
}

/* ── Helper: generate invoice number from id + date ────────── */

function invoiceNumber(id: string, createdAt: string): string {
  const d = new Date(createdAt);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const short = id.slice(-6).toUpperCase();
  return `INV-${yy}${mm}-${short}`;
}

/* ── Timeline step ─────────────────────────────────────────── */

function TimelineStep({
  label,
  date,
  done,
  last,
}: {
  label: string;
  date?: string | null;
  done: boolean;
  last?: boolean;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div
          className={cn(
            "w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0",
            done ? "bg-emerald-500" : "bg-slate-200"
          )}
        />
        {!last && (
          <div
            className={cn(
              "w-px flex-1 min-h-[24px]",
              done ? "bg-emerald-200" : "bg-slate-100"
            )}
          />
        )}
      </div>
      <div className="pb-4">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs text-slate-400 tabular-nums">
          {date ? formatDate(date) : "—"}
        </p>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [invoice, setInvoice] = useState<InvoiceDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to load invoice (${res.status})`);
      }
      const json = await res.json();
      setInvoice(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = async (def: ActionDef) => {
    if (!confirm(def.confirm)) return;

    setActionLoading(def.action);
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: def.action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Action failed (${res.status})`);
      }
      const json = await res.json();
      setInvoice(json.data);
      success(
        def.action === "send"
          ? "Invoice sent"
          : def.action === "markPaid"
            ? "Marked as paid"
            : "Invoice voided",
        def.action === "send"
          ? "The invoice has been sent to the client via Stripe."
          : def.action === "markPaid"
            ? "The invoice has been marked as paid."
            : "The invoice has been voided."
      );
    } catch (err) {
      showError(
        "Action failed",
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setActionLoading(null);
    }
  };

  /* ── Loading state ───────────────────────────────────────── */
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="rounded-lg bg-white ring-1 ring-black/[0.06] p-12 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </div>
    );
  }

  /* ── Error state ─────────────────────────────────────────── */
  if (error || !invoice) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="rounded-lg bg-white ring-1 ring-black/[0.06] p-12 text-center">
          <div className="mx-auto w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <XCircle className="w-7 h-7 text-red-400" />
          </div>
          <p className="font-medium text-slate-900">
            {error || "Invoice not found"}
          </p>
          <button
            onClick={() => router.push("/admin/invoices")}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-[#141414]/90 transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const actions = ACTIONS_BY_STATUS[invoice.status] ?? [];
  const statusMeta = INVOICE_STATUS_META[invoice.status];
  const paymentMeta = PAYMENT_MODEL_META[invoice.paymentModel];
  const invNumber = invoiceNumber(invoice.id, invoice.createdAt);
  const moduleName = invoice.moduleId
    ? MODULE_META[invoice.moduleId as ModuleId]?.label ?? invoice.moduleId
    : null;

  const clientAddr = invoice.client
    ? addressLines(invoice.client)
    : [];
  const sellerAddr = addressLines(SELLER);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── Breadcrumb + actions bar ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/invoices")}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Invoices
          </button>
          {invoice.clientName && (
            <>
              <span className="text-slate-300">/</span>
              <button
                onClick={() =>
                  router.push(`/admin/clients/${invoice.clientId}`)
                }
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                {invoice.clientName}
              </button>
            </>
          )}
          <span className="text-slate-300">/</span>
          <span className="text-sm font-medium text-slate-900">
            {invNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {invoice.stripePaymentUrl && (
            <a
              href={invoice.stripePaymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 bg-white ring-1 ring-black/[0.06] hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Stripe
            </a>
          )}

          {actions.map((def) => {
            const Icon = def.icon;
            const isLoading = actionLoading === def.action;
            return (
              <button
                key={def.action}
                onClick={() => handleAction(def)}
                disabled={actionLoading !== null}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                  def.className
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                {def.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Two-column layout ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT: Main invoice card ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="lg:col-span-2 rounded-lg bg-white ring-1 ring-black/[0.06] overflow-hidden"
        >
          {/* Invoice header */}
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-lg font-bold text-slate-900">
                  {invNumber}
                </h1>
                <p className="mt-0.5 text-sm text-slate-500">
                  Issued {formatDate(invoice.createdAt)}
                </p>
              </div>
              <Badge variant={statusMeta.badge as BadgeVariant} dot>
                {statusMeta.label}
              </Badge>
            </div>
          </div>

          {/* From / To addresses */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-slate-100">
            {/* From */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                From
              </p>
              <p className="text-sm font-semibold text-slate-900">
                {SELLER.name}
              </p>
              {sellerAddr.map((line, i) => (
                <p key={i} className="text-sm text-slate-500">
                  {line}
                </p>
              ))}
            </div>

            {/* To */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Invoice To
              </p>
              {invoice.client ? (
                <>
                  <button
                    onClick={() =>
                      router.push(`/admin/clients/${invoice.clientId}`)
                    }
                    className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    {invoice.client.businessName ||
                      invoice.client.contactName ||
                      "—"}
                  </button>
                  {invoice.client.contactName &&
                    invoice.client.businessName && (
                      <p className="text-sm text-slate-500">
                        {invoice.client.contactName}
                      </p>
                    )}
                  {clientAddr.map((line, i) => (
                    <p key={i} className="text-sm text-slate-500">
                      {line}
                    </p>
                  ))}
                  {(invoice.client.invoicingEmail ||
                    invoice.client.contactEmail) && (
                    <p className="text-sm text-slate-500 mt-1">
                      {invoice.client.invoicingEmail ||
                        invoice.client.contactEmail}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400 italic">
                  Client details unavailable
                </p>
              )}
            </div>
          </div>

          {/* Line items table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Qty
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">
                      {invoice.title}
                    </p>
                    {invoice.description && (
                      <p className="mt-0.5 text-slate-500 text-xs">
                        {invoice.description}
                      </p>
                    )}
                    {moduleName && (
                      <p className="mt-0.5 text-slate-400 text-xs">
                        Module: {moduleName}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700 tabular-nums">
                    1
                  </td>
                  <td className="px-6 py-4 text-right text-slate-700 tabular-nums">
                    {invoice.amountFormatted}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 tabular-nums">
                    {invoice.amountFormatted}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Order summary */}
          <div className="px-6 py-5 border-t border-slate-100">
            <div className="ml-auto max-w-xs space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-700 tabular-nums">
                  {invoice.amountFormatted}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">VAT</span>
                <span className="text-slate-500 tabular-nums">N/A</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-semibold">
                <span className="text-slate-900">Total</span>
                <span className="text-slate-900 tabular-nums">
                  {invoice.amountFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Terminal status banner */}
          {(invoice.status === "paid" || invoice.status === "void") && (
            <div
              className={cn(
                "px-6 py-3 border-t text-sm",
                invoice.status === "paid"
                  ? "border-emerald-100 bg-emerald-50/50 text-emerald-700"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              {invoice.status === "paid" ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  This invoice was paid on{" "}
                  {invoice.paidAt ? formatDate(invoice.paidAt) : "—"}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  This invoice has been voided
                </span>
              )}
            </div>
          )}
        </motion.div>

        {/* ── RIGHT: Sidebar ───────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.08 }}
          className="space-y-6"
        >
          {/* Amount card */}
          <div className="rounded-lg bg-white ring-1 ring-black/[0.06] p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Amount Due
            </p>
            <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
              {invoice.amountFormatted}
            </p>
            <div className="mt-3">
              <Badge variant={statusMeta.badge as BadgeVariant} dot>
                {statusMeta.label}
              </Badge>
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-lg bg-white ring-1 ring-black/[0.06] divide-y divide-slate-100">
            <div className="px-5 py-3.5">
              <p className="text-xs text-slate-400">Payment Model</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                {paymentMeta.label}
              </p>
              <p className="text-xs text-slate-500">{paymentMeta.description}</p>
            </div>

            <div className="px-5 py-3.5">
              <p className="text-xs text-slate-400">Currency</p>
              <p className="text-sm font-medium text-slate-900 mt-0.5">
                GBP (£)
              </p>
            </div>

            {invoice.dueDate && (
              <div className="px-5 py-3.5">
                <p className="text-xs text-slate-400">Due Date</p>
                <p
                  className={cn(
                    "text-sm font-medium mt-0.5",
                    invoice.status === "overdue"
                      ? "text-red-600"
                      : "text-slate-900"
                  )}
                >
                  {formatDate(invoice.dueDate)}
                </p>
              </div>
            )}

            {invoice.gracePeriodDays != null && (
              <div className="px-5 py-3.5">
                <p className="text-xs text-slate-400">Grace Period</p>
                <p className="text-sm font-medium text-slate-900 mt-0.5">
                  {invoice.gracePeriodDays} days
                  {invoice.gracePeriodEndsAt && (
                    <span className="text-slate-500 font-normal">
                      {" "}
                      (ends {formatDate(invoice.gracePeriodEndsAt)})
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Timeline card */}
          <div className="rounded-lg bg-white ring-1 ring-black/[0.06] p-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Timeline
            </p>
            <div>
              <TimelineStep
                label="Invoice Created"
                date={invoice.createdAt}
                done
              />
              <TimelineStep
                label="Sent to Client"
                date={invoice.sentAt}
                done={!!invoice.sentAt}
              />
              <TimelineStep
                label="Payment Received"
                date={invoice.paidAt}
                done={!!invoice.paidAt}
                last
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Footer meta ────────────────────────────────────── */}
      <p className="text-xs text-slate-400 text-center tabular-nums">
        {invNumber} · Last updated {formatDate(invoice.updatedAt)}
      </p>
    </div>
  );
}
