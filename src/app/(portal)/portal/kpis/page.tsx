/**
 * KPIs — Kanban board view (Company & Department)
 * Status columns: To Do / In Progress / Done
 * Category pills: Company (blue) / Department (purple)
 */
"use client";

import { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, MessageSquare, Pencil } from "lucide-react";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader } from "@/components/framework";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type KpiStatus = "todo" | "inprogress" | "done";
type KpiComment = { id: string; author: string; text: string; createdAt: string };
type KpiCategory = "company" | "department";

type KpiItem = {
  id: string;
  prefix: string;       // "company-kpi" | "dept-kpi"
  category: KpiCategory;
  index: number;        // 1-5
  title: string;
  outcome: string;
  status: KpiStatus;
  comments: KpiComment[];
};

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const COLUMNS: { id: KpiStatus; label: string }[] = [
  { id: "todo",       label: "To Do"       },
  { id: "inprogress", label: "In Progress" },
  { id: "done",       label: "Done"        },
];

const CAT_PILL: Record<KpiCategory, string> = {
  company:    "bg-brand-blue/10 text-[#141414] ring-1 ring-brand-blue/20",
  department: "bg-[#141414]/5 text-[#141414] ring-1 ring-[#141414]/10",
};
const CAT_LABEL: Record<KpiCategory, string> = { company: "Company KPI", department: "Department KPI" };

const STATUS_OPTIONS: { value: KpiStatus; label: string }[] = [
  { value: "todo",       label: "To Do"       },
  { value: "inprogress", label: "In Progress" },
  { value: "done",       label: "Done"        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Build KPI list from responses map
// ─────────────────────────────────────────────────────────────────────────────
function buildKpis(responses: Record<string, unknown>): KpiItem[] {
  const items: KpiItem[] = [];
  const add = (category: KpiCategory, prefix: string, index: number) => {
    const title   = String(responses[`${prefix}${index}-name`]     ?? "");
    const outcome = String(responses[`${prefix}${index}-outcome`]  ?? "");
    const rawSt   = responses[`${prefix}${index}-status`]          as KpiStatus | undefined;
    const status: KpiStatus = rawSt ?? "todo";
    let comments: KpiComment[] = [];
    try {
      const raw = responses[`${prefix}${index}-comments`];
      if (raw) comments = JSON.parse(String(raw));
    } catch { /* start empty */ }
    items.push({ id: `${prefix}${index}`, prefix, category, index, title, outcome, status, comments });
  };
  [1, 2, 3, 4, 5].forEach((i) => add("company",    "company-kpi", i));
  [1, 2, 3, 4, 5].forEach((i) => add("department", "dept-kpi",    i));
  return items;
}

function formatRelativeDate(iso: string): string {
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card component
// ─────────────────────────────────────────────────────────────────────────────
function KpiCard({ kpi, onClick }: { kpi: KpiItem; onClick: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("kpiId", kpi.id);
        e.dataTransfer.effectAllowed = "move";
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18 }}
        onClick={onClick}
        className="bg-white rounded ring-1 ring-black/[0.07] p-4"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#1C1C1E] leading-snug flex-1">{kpi.title}</p>
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0", CAT_PILL[kpi.category])}>
            {CAT_LABEL[kpi.category]}
          </span>
        </div>
        {kpi.outcome && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">{kpi.outcome}</p>
        )}
        {kpi.comments.length > 0 && (
          <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">
            <MessageSquare className="w-3 h-3" />
            <span>{kpi.comments.length} comment{kpi.comments.length !== 1 ? "s" : ""}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kanban column
// ─────────────────────────────────────────────────────────────────────────────
function KanbanColumn({
  column, cards, onCardClick, onAdd, onDropCard,
}: {
  column: typeof COLUMNS[number];
  cards: KpiItem[];
  onCardClick: (kpi: KpiItem) => void;
  onAdd: (status: KpiStatus) => void;
  onDropCard: (kpiId: string, newStatus: KpiStatus) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  return (
    <div
      className={cn("flex flex-col min-w-0 rounded p-2 -m-2 transition-colors", dragOver ? "bg-slate-100" : "")}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const kpiId = e.dataTransfer.getData("kpiId");
        if (kpiId) onDropCard(kpiId, column.id);
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-[#1C1C1E]">{column.label}</h3>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded bg-[#1C1C1E] text-xs font-semibold text-white">
          {cards.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5 flex-1">
        <AnimatePresence initial={false}>
          {cards.map((kpi) => (
            <KpiCard key={kpi.id} kpi={kpi} onClick={() => onCardClick(kpi)} />
          ))}
        </AnimatePresence>
      </div>
      <button
        onClick={() => onAdd(column.id)}
        className="mt-3 w-full border border-dashed border-slate-300 rounded-lg py-2.5 flex items-center justify-center gap-1.5 text-xs font-medium text-slate-400 hover:bg-[#1C1C1E] hover:text-white hover:border-[#1C1C1E] transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        Add new KPI
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CRUD Modal (portal – comments read-only)
// ─────────────────────────────────────────────────────────────────────────────
function KpiModal({
  kpi, defaultStatus, onClose, onSave, onDelete,
}: {
  kpi: KpiItem;
  defaultStatus: KpiStatus;
  onClose: () => void;
  onSave: (kpi: KpiItem, updates: Partial<KpiItem>) => Promise<void>;
  onDelete: (kpi: KpiItem) => Promise<void>;
}) {
  const isCreate = !kpi.title;
  const [form, setForm] = useState({
    category: kpi.category,
    title:    kpi.title,
    outcome:  kpi.outcome,
    status:   (kpi.title ? kpi.status : defaultStatus) as KpiStatus,
  });
  const [saving,   setSaving]   = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(kpi, { ...form, title: form.title.trim(), outcome: form.outcome.trim() });
    setSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(kpi);
    setDeleting(false);
    onClose();
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={isCreate ? "Add KPI" : "Edit KPI"}
      size="lg"
      footer={
        <div className="flex items-center justify-between pt-1">
          <div>
            {!isCreate && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? "Removing…" : "Remove KPI"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" isLoading={saving} disabled={!form.title.trim()} onClick={handleSave}>
              {isCreate ? "Add KPI" : "Save changes"}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Category */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Category</label>
          <div className="flex gap-2">
            {(["company", "department"] as KpiCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setForm((f) => ({ ...f, category: cat }))}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  form.category === cat
                    ? cat === "company" ? "bg-brand-blue text-[#141414]" : "bg-[#141414] text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {CAT_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">KPI Title</label>
          <input
            autoFocus
            type="text"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Monthly Revenue Growth"
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-[#1C1C1E] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]/30 transition-all"
          />
        </div>

        {/* Outcome */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Required Outcome / Measurement</label>
          <textarea
            value={form.outcome}
            onChange={(e) => setForm((f) => ({ ...f, outcome: e.target.value }))}
            placeholder="e.g. Increase by 15% QoQ — tracked via GA4"
            rows={3}
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-[#1C1C1E] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#141414]/20 focus:border-[#141414]/30 transition-all resize-none"
          />
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</label>
          <div className="flex gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-semibold transition-all",
                  form.status === opt.value ? "bg-[#141414] text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
type CategoryFilter = "all" | KpiCategory;

export default function KpisPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse } = useResponses(clientId);

  const loading = clientLoading || responsesLoading;
  const kpis = useMemo(() => buildKpis(responses), [responses]);
  const filledCount = useMemo(() => kpis.filter((k) => k.title).length, [kpis]);

  const [catFilter, setCatFilter]     = useState<CategoryFilter>("all");
  const [modalKpi, setModalKpi]       = useState<KpiItem | null>(null);
  const [modalStatus, setModalStatus] = useState<KpiStatus>("todo");

  const openEdit = useCallback((kpi: KpiItem) => {
    setModalKpi(kpi);
    setModalStatus(kpi.status);
  }, []);

  const openCreate = useCallback((status: KpiStatus) => {
    const preferCat: KpiCategory = catFilter === "department" ? "department" : "company";
    const otherCat:  KpiCategory = preferCat === "company" ? "department" : "company";
    const slot = kpis.find((k) => k.category === preferCat && !k.title)
              ?? kpis.find((k) => k.category === otherCat  && !k.title)
              ?? null;
    if (!slot) return;
    setModalKpi({ ...slot, status, category: preferCat });
    setModalStatus(status);
  }, [kpis, catFilter]);

  const handleSave = useCallback(async (kpi: KpiItem, updates: Partial<KpiItem>) => {
    if (!clientId) return;
    const patch = async (fieldId: string, value: string) => {
      setLocalResponse(fieldId, value);
      await fetch(`/api/responses/${clientId}/kpis/kpis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId, value }),
      });
    };
    if (updates.title    !== undefined) await patch(`${kpi.prefix}${kpi.index}-name`,     updates.title);
    if (updates.outcome  !== undefined) await patch(`${kpi.prefix}${kpi.index}-outcome`,  updates.outcome);
    if (updates.status   !== undefined) await patch(`${kpi.prefix}${kpi.index}-status`,   updates.status);
    if (updates.comments !== undefined) await patch(`${kpi.prefix}${kpi.index}-comments`, JSON.stringify(updates.comments));
  }, [clientId, setLocalResponse]);

  const handleDelete = useCallback(async (kpi: KpiItem) => {
    if (!clientId) return;
    for (const field of ["name", "outcome", "status", "comments"]) {
      const fieldId = `${kpi.prefix}${kpi.index}-${field}`;
      setLocalResponse(fieldId, "");
      await fetch(`/api/responses/${clientId}/kpis/kpis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId, value: "" }),
      });
    }
  }, [clientId, setLocalResponse]);

  const handleDrop = useCallback(async (kpiId: string, newStatus: KpiStatus) => {
    const kpi = kpis.find((k) => k.id === kpiId);
    if (!kpi || kpi.status === newStatus) return;
    await handleSave(kpi, { status: newStatus });
  }, [kpis, handleSave]);

  const filteredKpis = useMemo(
    () => kpis.filter((k) => k.title && (catFilter === "all" || k.category === catFilter)),
    [kpis, catFilter]
  );

  const columnCards = useMemo<Record<KpiStatus, KpiItem[]>>(
    () => COLUMNS.reduce((acc, col) => {
      acc[col.id] = filteredKpis.filter((k) => k.status === col.id);
      return acc;
    }, {} as Record<KpiStatus, KpiItem[]>),
    [filteredKpis]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded" />
        <div className="grid grid-cols-3 gap-4 mt-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2.5">
              <Skeleton className="h-5 w-28 rounded" />
              <Skeleton className="h-28 w-full rounded" />
              <Skeleton className="h-20 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!clientId) {
    return <div className="text-center py-16"><p className="text-slate-500 text-sm">No client profile found.</p></div>;
  }

  return (
    <div>
      <SectionProgressHeader
        title="Key Performance Indicators"
        answeredCount={filledCount}
        totalCount={10}
        lastSavedAt={null}
      />

      {/* Category filter */}
      <div className="flex items-center gap-2 mt-5 mb-5">
        {(["all", "company", "department"] as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            className={cn(
              "px-3 py-1 rounded text-xs font-semibold transition-all",
              catFilter === cat
                ? "bg-[#141414] text-white"
                : "bg-white ring-1 ring-black/[0.08] text-slate-500 hover:text-slate-700"
            )}
          >
            {cat === "all" ? "All" : CAT_LABEL[cat as KpiCategory]}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {filledCount === 0 && (
        <div className="mb-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <p className="text-sm font-semibold text-slate-600 mb-1">No KPIs added yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click <strong>Add new KPI</strong> in any column below to define your company and department metrics.
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={columnCards[col.id] ?? []}
            onCardClick={openEdit}
            onAdd={openCreate}
            onDropCard={handleDrop}
          />
        ))}
      </div>

      <AnimatePresence>
        {modalKpi && (
          <KpiModal
            key={modalKpi.id + modalStatus}
            kpi={modalKpi}
            defaultStatus={modalStatus}
            onClose={() => setModalKpi(null)}
            onSave={handleSave}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
