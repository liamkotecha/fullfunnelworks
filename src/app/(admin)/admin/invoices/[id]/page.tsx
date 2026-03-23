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
  Receipt,
  Clock,
  CreditCard,
  FileText,
  Building2,
  Calendar,
  Loader2,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import type { InvoiceDTO, InvoiceStatus } from "@/types";
import { INVOICE_STATUS_META, PAYMENT_MODEL_META } from "@/types";
import { useToast } from "@/components/notifications/ToastContext";

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
      confirm: "This will create a Stripe invoice and email it to the client. Continue?",
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
      confirm: "This will void the invoice and cancel the Stripe payment. Continue?",
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
      confirm: "This will void the overdue invoice. Continue?",
    },
  ],
};

/* ── Detail row helper ─────────────────────────────────────── */

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {label}
        </p>
        <div className="mt-0.5 text-sm text-slate-900">{children}</div>
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
      <div className="max-w-3xl mx-auto space-y-6">
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
      <div className="max-w-3xl mx-auto space-y-6">
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ── Back + breadcrumb ──────────────────────────────── */}
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
                router.push(`/admin/clients/${invoice.clientId}/invoices`)
              }
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              {invoice.clientName}
            </button>
          </>
        )}
      </div>

      {/* ── Header card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="rounded-lg bg-white ring-1 ring-black/[0.06] overflow-hidden"
      >
        {/* Title bar */}
        <div className="px-6 py-5 border-b border-slate-100">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 truncate">
                {invoice.title}
              </h1>
              {invoice.description && (
                <p className="mt-1 text-sm text-slate-500 line-clamp-2">
                  {invoice.description}
                </p>
              )}
            </div>
            <Badge
              variant={statusMeta.badge as BadgeVariant}
              dot
            >
              {statusMeta.label}
            </Badge>
          </div>
        </div>

        {/* Amount highlight */}
        <div className="px-6 py-6 bg-slate-50/50 border-b border-slate-100">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            Amount
          </p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums mt-1">
            {invoice.amountFormatted}
          </p>
        </div>

        {/* Details grid */}
        <div className="px-6 py-2 divide-y divide-slate-100">
          {invoice.clientName && (
            <DetailRow icon={Building2} label="Client">
              <button
                onClick={() =>
                  router.push(`/admin/clients/${invoice.clientId}`)
                }
                className="text-slate-900 hover:text-blue-600 transition-colors underline-offset-2 hover:underline"
              >
                {invoice.clientName}
              </button>
            </DetailRow>
          )}

          <DetailRow icon={CreditCard} label="Payment Model">
            <span className="font-medium">{paymentMeta.label}</span>
            <span className="text-slate-500 ml-1.5">
              — {paymentMeta.description}
            </span>
          </DetailRow>

          {invoice.moduleId && (
            <DetailRow icon={FileText} label="Module">
              {invoice.moduleId}
            </DetailRow>
          )}

          {invoice.gracePeriodDays != null && (
            <DetailRow icon={Clock} label="Grace Period">
              {invoice.gracePeriodDays} days
              {invoice.gracePeriodEndsAt && (
                <span className="text-slate-500 ml-1.5">
                  (ends {formatDate(invoice.gracePeriodEndsAt)})
                </span>
              )}
            </DetailRow>
          )}

          <DetailRow icon={Calendar} label="Created">
            {formatDate(invoice.createdAt)}
          </DetailRow>

          {invoice.dueDate && (
            <DetailRow icon={Calendar} label="Due Date">
              <span
                className={cn(
                  invoice.status === "overdue" && "text-red-600 font-medium"
                )}
              >
                {formatDate(invoice.dueDate)}
              </span>
            </DetailRow>
          )}

          {invoice.sentAt && (
            <DetailRow icon={Send} label="Sent">
              {formatDate(invoice.sentAt)}
            </DetailRow>
          )}

          {invoice.paidAt && (
            <DetailRow icon={CheckCircle2} label="Paid">
              {formatDate(invoice.paidAt)}
            </DetailRow>
          )}

          {invoice.stripePaymentUrl && (
            <DetailRow icon={ExternalLink} label="Stripe Payment Link">
              <a
                href={invoice.stripePaymentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors break-all"
              >
                Open in Stripe
              </a>
            </DetailRow>
          )}
        </div>

        {/* ── Actions ──────────────────────────────────────── */}
        {actions.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/30 flex flex-wrap items-center gap-3">
            {actions.map((def) => {
              const Icon = def.icon;
              const isLoading = actionLoading === def.action;
              return (
                <button
                  key={def.action}
                  onClick={() => handleAction(def)}
                  disabled={actionLoading !== null}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
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
        )}

        {/* Terminal status message */}
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

      {/* ── Meta footer ────────────────────────────────────── */}
      <p className="text-xs text-slate-400 text-center tabular-nums">
        Invoice ID: {invoice.id} · Last updated {formatDate(invoice.updatedAt)}
      </p>
    </div>
  );
}
