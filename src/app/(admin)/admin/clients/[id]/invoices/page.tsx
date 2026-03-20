/**
 * Admin: Client Invoices — /admin/clients/[id]/invoices
 * Lists all invoices for this client with raise / send / void / mark-paid actions.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Send, Ban, CheckCircle2, Receipt } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type {
  InvoiceDTO,
  InvoiceStatus,
  PaymentModel,
  ProjectDTO,
  ModuleId,
} from "@/types";
import {
  INVOICE_STATUS_META,
  PAYMENT_MODEL_META,
  MODULE_META,
} from "@/types";

// ── Helpers ──────────────────────────────────────────────────

const STATUS_BADGE: Record<InvoiceStatus, BadgeVariant> = {
  paid: "success",
  sent: "warning",
  overdue: "error",
  draft: "neutral",
  void: "neutral",
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ── Component ────────────────────────────────────────────────

export default function AdminInvoicesPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Fetch ────────────────────────────────────────────────

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await fetch(`/api/invoices?clientId=${clientId}`);
      if (!res.ok) return;
      const data = await res.json();
      setInvoices(data.invoices ?? []);
    } catch { /* silent */ }
  }, [clientId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [, projRes] = await Promise.all([
        fetchInvoices(),
        fetch(`/api/projects?clientId=${clientId}`).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);
      if (!cancelled) {
        setProjects(projRes.data ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [clientId, fetchInvoices]);

  // Collect active modules from all projects for this client
  const activeModules = useMemo(() => {
    const set = new Set<ModuleId>();
    projects.forEach((p) => p.activeModules?.forEach((m) => set.add(m)));
    return Array.from(set);
  }, [projects]);

  // ── Actions ──────────────────────────────────────────────

  async function handleAction(invoiceId: string, action: "send" | "void" | "markPaid") {
    setActionLoading(invoiceId + action);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) await fetchInvoices();
    } catch { /* silent */ }
    setActionLoading(null);
  }

  // ── Render ───────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-900">Invoices</h2>
        <Button
          size="sm"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setShowModal(true)}
        >
          Raise invoice
        </Button>
      </div>

      {/* Loading */}
      {loading && <SkeletonTable rows={4} />}

      {/* Empty */}
      {!loading && invoices.length === 0 && (
        <div className="rounded-lg ring-1 ring-slate-200 bg-white p-8 text-center">
          <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No invoices yet for this client.</p>
        </div>
      )}

      {/* Table */}
      {!loading && invoices.length > 0 && (
        <div className="rounded-lg ring-1 ring-slate-200 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Payment model</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b last:border-0 border-slate-50 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-slate-900 max-w-[200px] truncate">
                    {inv.title}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {inv.moduleId && MODULE_META[inv.moduleId as ModuleId]
                      ? MODULE_META[inv.moduleId as ModuleId].label
                      : "General"}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-3 font-semibold text-slate-900",
                      inv.status === "void" && "line-through text-slate-400"
                    )}
                  >
                    {inv.amountFormatted}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {PAYMENT_MODEL_META[inv.paymentModel].label}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_BADGE[inv.status]} dot>
                      {INVOICE_STATUS_META[inv.status].label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {fmtDate(inv.dueDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.status === "draft" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Send className="w-3.5 h-3.5" />}
                          isLoading={actionLoading === inv.id + "send"}
                          onClick={() => handleAction(inv.id, "send")}
                        >
                          Send
                        </Button>
                      )}
                      {(inv.status === "sent" || inv.status === "overdue") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                          isLoading={actionLoading === inv.id + "markPaid"}
                          onClick={() => handleAction(inv.id, "markPaid")}
                        >
                          Mark paid
                        </Button>
                      )}
                      {(inv.status === "draft" || inv.status === "sent") && (
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<Ban className="w-3.5 h-3.5" />}
                          isLoading={actionLoading === inv.id + "void"}
                          onClick={() => handleAction(inv.id, "void")}
                        >
                          Void
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Raise invoice modal */}
      <RaiseInvoiceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        clientId={clientId}
        projectId={projects[0]?.id ?? projects[0]?._id ?? ""}
        activeModules={activeModules}
        onCreated={() => {
          setShowModal(false);
          fetchInvoices();
        }}
      />
    </div>
  );
}

// ── Raise Invoice Modal ──────────────────────────────────────

interface RaiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  projectId: string;
  activeModules: ModuleId[];
  onCreated: () => void;
}

function RaiseInvoiceModal({
  isOpen,
  onClose,
  clientId,
  projectId,
  activeModules,
  onCreated,
}: RaiseModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [moduleId, setModuleId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paymentModel, setPaymentModel] = useState<PaymentModel>("upfront");
  const [gracePeriodDays, setGracePeriodDays] = useState(14);
  const [dueDays, setDueDays] = useState(14);
  const [sendImmediately, setSendImmediately] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Reset form when opened
  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      setModuleId("");
      setAmount("");
      setPaymentModel("upfront");
      setGracePeriodDays(14);
      setDueDays(14);
      setSendImmediately(true);
      setError("");
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const amountPence = Math.round(parseFloat(amount) * 100);
    if (!title.trim()) return setError("Title is required");
    if (isNaN(amountPence) || amountPence <= 0) return setError("Enter a valid amount");

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        clientId,
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        moduleId: moduleId || undefined,
        amountPence,
        paymentModel,
        dueDays,
        sendImmediately,
      };
      if (paymentModel === "milestone") {
        body.gracePeriodDays = gracePeriodDays;
      }

      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create invoice");
      }

      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const moduleOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [
      { value: "", label: "General / Retainer" },
    ];
    activeModules.forEach((m) => {
      if (MODULE_META[m]) opts.push({ value: m, label: MODULE_META[m].label });
    });
    return opts;
  }, [activeModules]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Raise invoice" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
            placeholder="e.g. Assessment module — Phase 1"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Description <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40 resize-none"
            placeholder="Brief description of this invoice…"
          />
        </div>

        {/* Module */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Module
          </label>
          <select
            value={moduleId}
            onChange={(e) => setModuleId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
          >
            {moduleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount (£)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              £
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
              placeholder="1,250.00"
            />
          </div>
        </div>

        {/* Payment model */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Payment model
          </label>
          <div className="flex gap-3">
            {(Object.entries(PAYMENT_MODEL_META) as [PaymentModel, { label: string; description: string }][]).map(
              ([key, meta]) => (
                <label
                  key={key}
                  className={cn(
                    "flex-1 rounded-lg border p-3 cursor-pointer transition-all text-center",
                    paymentModel === key
                      ? "border-navy bg-navy/5 ring-1 ring-navy/20"
                      : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <input
                    type="radio"
                    name="paymentModel"
                    value={key}
                    checked={paymentModel === key}
                    onChange={() => setPaymentModel(key)}
                    className="sr-only"
                  />
                  <span className="block text-sm font-semibold text-slate-900">
                    {meta.label}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    {meta.description}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Grace period (milestone only) */}
        <AnimatePresence>
          {paymentModel === "milestone" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Grace period (days)
              </label>
              <input
                type="number"
                min={1}
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
              />
              <p className="text-xs text-slate-400 mt-1">
                Module access will be locked after this many days if unpaid.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Due in days */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Due in (days)
          </label>
          <input
            type="number"
            min={1}
            value={dueDays}
            onChange={(e) => setDueDays(Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/40"
          />
        </div>

        {/* Send immediately */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={sendImmediately}
            onChange={(e) => setSendImmediately(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-navy focus:ring-navy/20"
          />
          <span className="text-sm text-slate-700">
            Send immediately to client
          </span>
        </label>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 font-medium">{error}</p>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={submitting}>
            Raise invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
}
