/**
 * /portal/invoices — Client invoice history.
 * Shows outstanding invoices first, then sorted by date descending.
 * "Pay now" buttons link to Stripe payment URL.
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Receipt, ExternalLink, FileText } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { InvoiceDTO, InvoiceStatus, INVOICE_STATUS_META } from "@/types";

// ── Status → Badge variant mapping ──────────────────────────────────────────

const STATUS_BADGE: Record<InvoiceStatus, BadgeVariant> = {
  paid:    "success",
  sent:    "warning",
  overdue: "error",
  draft:   "neutral",
  void:    "neutral",
};

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  paid:    "Paid",
  sent:    "Sent",
  overdue: "Overdue",
  draft:   "Draft",
  void:    "Void",
};

// Outstanding statuses that should sort first
const OUTSTANDING: Set<InvoiceStatus> = new Set(["sent", "overdue"]);

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Component ───────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/invoices/my");
        if (!res.ok) throw new Error("Failed to fetch invoices");
        const data = await res.json();
        if (!cancelled) setInvoices(data.invoices ?? []);
      } catch {
        // silently fail — empty list shown
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sort: outstanding first, then by createdAt desc
  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const aOutstanding = OUTSTANDING.has(a.status) ? 0 : 1;
      const bOutstanding = OUTSTANDING.has(b.status) ? 0 : 1;
      if (aOutstanding !== bOutstanding) return aOutstanding - bOutstanding;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [invoices]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your billing history and outstanding payments
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={2} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && sorted.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-8 sm:p-12 text-center"
        >
          <div className="mx-auto w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center mb-6">
            <FileText className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            No invoices yet
          </h2>
          <p className="mt-2 text-sm text-slate-500 max-w-sm mx-auto">
            Your consultant will raise invoices as your engagement progresses.
          </p>
        </motion.div>
      )}

      {/* Invoice list */}
      {!loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((inv, idx) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.04 }}
              className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-4 sm:p-5"
            >
              {/* Top row: badge + title + amount */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Badge variant={STATUS_BADGE[inv.status]} dot>
                    {STATUS_LABEL[inv.status]}
                  </Badge>
                  <span
                    className={cn(
                      "text-sm font-semibold text-slate-900 truncate",
                      inv.status === "void" && "line-through text-slate-400"
                    )}
                  >
                    {inv.title}
                  </span>
                </div>
                <span
                  className={cn(
                    "text-sm font-bold text-slate-900 whitespace-nowrap",
                    inv.status === "void" && "line-through text-slate-400"
                  )}
                >
                  {inv.amountFormatted}
                </span>
              </div>

              {/* Bottom row: dates + pay button */}
              <div className="mt-2 flex items-center justify-between gap-3">
                <span className="text-xs text-slate-500">
                  Raised {formatDate(inv.createdAt)}
                  {inv.dueDate && <> · Due {formatDate(inv.dueDate)}</>}
                </span>

                {(inv.status === "sent" || inv.status === "overdue") &&
                  inv.stripePaymentUrl && (
                    <a
                      href={inv.stripePaymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="sm"
                        className="bg-brand-blue hover:bg-brand-blue/90 text-white"
                        rightIcon={<ExternalLink className="w-3.5 h-3.5" />}
                      >
                        Pay now
                      </Button>
                    </a>
                  )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
