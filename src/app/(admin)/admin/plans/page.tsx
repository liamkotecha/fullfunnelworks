"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  Check,
  Pencil,
  Trash2,
  Loader2,
  LayoutGrid,
  Users,
  BadgeCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PlanDTO, MODULE_META, ModuleId } from "@/types";
import { formatPence } from "@/lib/format";
import { useToast } from "@/components/notifications/ToastContext";
import { ConfirmModal } from "@/components/ui/Modal";

const ALL_MODULES = Object.entries(MODULE_META) as [ModuleId, { label: string }][];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── helpers ──────────────────────────────────────────────── */
function penceToInput(pence: number) {
  return (pence / 100).toFixed(2);
}
function inputToPence(str: string) {
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : Math.round(n * 100);
}

/* ── Plan Form ───────────────────────────────────────────── */
interface PlanFormState {
  name: string;
  description: string;
  monthlyPrice: string;
  annualPrice: string;
  maxActiveClients: number;
  maxProjectsPerClient: number;
  allowedModules: Set<ModuleId>;
  trialDays: number;
  isActive: boolean;
}

function defaultForm(plan?: PlanDTO | null): PlanFormState {
  return {
    name: plan?.name ?? "",
    description: plan?.description ?? "",
    monthlyPrice: plan ? penceToInput(plan.monthlyPricePence) : "",
    annualPrice: plan ? penceToInput(plan.annualPricePence) : "",
    maxActiveClients: plan?.maxActiveClients ?? 5,
    maxProjectsPerClient: plan?.maxProjectsPerClient ?? 1,
    allowedModules: new Set((plan?.allowedModules ?? []) as ModuleId[]),
    trialDays: plan?.trialDays ?? 0,
    isActive: plan?.isActive ?? true,
  };
}

interface PlanFormProps {
  initial?: PlanDTO | null;
  onClose: () => void;
  onSaved: (plan: PlanDTO) => void;
}

function PlanForm({ initial, onClose, onSaved }: PlanFormProps) {
  const { error: toastError, success } = useToast();
  const [form, setForm] = useState<PlanFormState>(defaultForm(initial));
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial;

  const toggleModule = (id: ModuleId) => {
    setForm((prev) => {
      const next = new Set(prev.allowedModules);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, allowedModules: next };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastError("Name required", "Please enter a plan name");
      return;
    }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        monthlyPricePence: inputToPence(form.monthlyPrice),
        annualPricePence: inputToPence(form.annualPrice),
        maxActiveClients: form.maxActiveClients,
        maxProjectsPerClient: form.maxProjectsPerClient,
        allowedModules: Array.from(form.allowedModules),
        trialDays: form.trialDays,
        isActive: form.isActive,
      };

      const url = isEdit ? `/api/admin/plans/${initial!.id}` : "/api/admin/plans";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Server error");
      }
      const { data } = await res.json();
      onSaved(data);
      success(isEdit ? "Plan updated" : "Plan created", form.name);
      onClose();
    } catch (e) {
      toastError("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <h2 className="font-bold text-base text-slate-900">
            {isEdit ? "Edit plan" : "Create plan"}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Plan name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Starter, Pro, Enterprise"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Description <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={2}
              placeholder="Brief description for internal reference"
              className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"
            />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Monthly price (£)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.monthlyPrice}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full text-sm pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Annual price (£)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">£</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={form.annualPrice}
                  onChange={(e) => setForm((p) => ({ ...p, annualPrice: e.target.value }))}
                  placeholder="0.00"
                  className="w-full text-sm pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue"
                />
              </div>
            </div>
          </div>

          {/* Limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max active clients
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={form.maxActiveClients}
                  onChange={(e) => setForm((p) => ({ ...p, maxActiveClients: Number(e.target.value) }))}
                  className="flex-1 accent-[#6CC2FF]"
                />
                <span className="text-base font-bold text-slate-900 w-6 text-right tabular-nums">
                  {form.maxActiveClients}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Max projects / client
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={form.maxProjectsPerClient}
                  onChange={(e) => setForm((p) => ({ ...p, maxProjectsPerClient: Number(e.target.value) }))}
                  className="flex-1 accent-[#6CC2FF]"
                />
                <span className="text-base font-bold text-slate-900 w-6 text-right tabular-nums">
                  {form.maxProjectsPerClient}
                </span>
              </div>
            </div>
          </div>

          {/* Trial */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Free trial (days) — <span className="font-normal text-slate-400">0 = no trial</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={90}
                step={7}
                value={form.trialDays}
                onChange={(e) => setForm((p) => ({ ...p, trialDays: Number(e.target.value) }))}
                className="flex-1 accent-[#6CC2FF]"
              />
              <span className="text-base font-bold text-slate-900 w-8 text-right tabular-nums">
                {form.trialDays === 0 ? "Off" : `${form.trialDays}d`}
              </span>
            </div>
          </div>

          {/* Modules */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Allowed modules ({form.allowedModules.size}/{ALL_MODULES.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm((p) => ({ ...p, allowedModules: new Set(ALL_MODULES.map(([id]) => id)) }))}
                  className="text-xs text-[#141414] hover:text-[#141414]/70 underline underline-offset-2"
                >
                  All
                </button>
                <span className="text-slate-300 text-xs">·</span>
                <button
                  onClick={() => setForm((p) => ({ ...p, allowedModules: new Set() }))}
                  className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
                >
                  None
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_MODULES.map(([id, meta]) => {
                const active = form.allowedModules.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleModule(id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left",
                      active
                        ? "border-brand-blue/40 bg-brand-blue/10 text-[#141414]"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {active ? (
                      <Check className="w-3 h-3 flex-shrink-0 text-brand-blue" />
                    ) : (
                      <span className="w-3 h-3 flex-shrink-0" />
                    )}
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={form.isActive}
              onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                form.isActive ? "bg-brand-blue" : "bg-slate-200"
              )}
            >
              <span
                className={cn(
                  "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
                  form.isActive ? "translate-x-4.5" : "translate-x-0.5"
                )}
              />
            </button>
            <span className="text-sm text-slate-700">
              {form.isActive ? "Plan is active (visible to assignment)" : "Plan is inactive (hidden)"}
            </span>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isEdit ? "Save changes" : "Create plan"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Plan Card ───────────────────────────────────────────── */
function PlanCard({
  plan,
  onEdit,
  onDelete,
}: {
  plan: PlanDTO;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl ring-1 p-5 flex flex-col gap-4 transition-all",
        plan.isActive ? "ring-black/[0.06]" : "ring-slate-200 opacity-60"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900">{plan.name}</h3>
            {!plan.isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-400">
                Inactive
              </span>
            )}
            {plan.trialDays > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-200">
                {plan.trialDays}d trial
              </span>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Monthly</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">
            {formatPence(plan.monthlyPricePence)}
          </p>
        </div>
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Annual</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums">
            {formatPence(plan.annualPricePence)}
          </p>
        </div>
      </div>

      {/* Limits */}
      <div className="flex gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-slate-400" />
          <span>
            Up to <span className="font-semibold text-slate-900">{plan.maxActiveClients}</span> clients
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
          <span>
            <span className="font-semibold text-slate-900">{plan.maxProjectsPerClient}</span>{" "}
            project{plan.maxProjectsPerClient !== 1 ? "s" : ""}/client
          </span>
        </div>
      </div>

      {/* Modules */}
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Modules ({plan.allowedModules.length})
        </p>
        <div className="flex flex-wrap gap-1">
          {plan.allowedModules.map((m) => (
            <span
              key={m}
              className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-blue/10 text-[#141414] border border-brand-blue/20"
            >
              {MODULE_META[m]?.label ?? m}
            </span>
          ))}
          {plan.allowedModules.length === 0 && (
            <span className="text-xs text-slate-400">No modules assigned</span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-400">
        <BadgeCheck className="w-3.5 h-3.5" />
        <span>
          <span className="font-semibold text-slate-600">{plan.consultantCount}</span> active consultant
          {plan.consultantCount !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────── */
export default function PlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: toastError, success } = useToast();
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<PlanDTO | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as { role?: string })?.role !== "admin") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  const load = useCallback(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        setPlans(d.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toastError("Couldn't load plans", "Please refresh");
        setLoading(false);
      });
  }, [toastError]);

  useEffect(() => { load(); }, [load]);

  const handleSaved = useCallback((saved: PlanDTO) => {
    setPlans((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [...prev, saved];
    });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeleteId(null);
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      setPlans((prev) => prev.filter((p) => p.id !== id));
      success("Plan deleted");
    } catch (e) {
      toastError("Delete failed", (e as Error).message);
    }
  }, [toastError, success]);

  return (
    <>
      <AnimatePresence>
        {(creating || editing) && (
          <PlanForm
            initial={editing}
            onClose={() => { setCreating(false); setEditing(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) handleDelete(deleteId); }}
        title="Delete this plan?"
        message="This cannot be undone. Make sure no consultants are actively on this plan first."
        confirmLabel="Delete"
        variant="danger"
      />

      <motion.div variants={stagger} initial="hidden" animate="show" className="px-8 pt-8 pb-10">
        <motion.div variants={fadeUp} className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-bold text-2xl text-slate-900">Plans</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Configure pricing, module access and client limits per plan
            </p>
          </div>
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New plan
          </button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-slate-200/40 animate-pulse" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <LayoutGrid className="w-5 h-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No plans yet</p>
            <p className="text-sm text-slate-400 mb-4">
              Create your first plan to start assigning consultants
            </p>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create plan
            </button>
          </motion.div>
        ) : (
          <motion.div
            variants={fadeUp}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onEdit={() => setEditing(plan)}
                onDelete={() => setDeleteId(plan.id)}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
