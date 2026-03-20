/**
 * Admin: KPI Manager — /admin/clients/[id]/kpis
 * Admin can create, edit, delete KPIs and add comments.
 * All changes stored via PATCH /api/responses/{clientId}/kpis/kpis
 * and reflected live on the client portal KPIs page.
 */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, MessageSquare, Send, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
type KpiStatus   = "todo" | "inprogress" | "done";
type KpiCategory = "company" | "department";
type KpiComment  = { id: string; author: string; text: string; createdAt: string };

type KpiItem = {
  id: string;           // "company-kpi1" | "dept-kpi3" etc.
  prefix: string;       // "company-kpi" | "dept-kpi"
  category: KpiCategory;
  index: number;
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
  company:    "bg-blue-50 text-blue-700 ring-1 ring-blue-100",
  department: "bg-purple-50 text-purple-700 ring-1 ring-purple-100",
};
const CAT_LABEL: Record<KpiCategory, string> = { company: "Company KPI", department: "Department KPI" };

const STATUS_OPTIONS: { value: KpiStatus; label: string }[] = [
  { value: "todo",       label: "To Do"       },
  { value: "inprogress", label: "In Progress" },
  { value: "done",       label: "Done"        },
];

// ─────────────────────────────────────────────────────────────────────────────
// Build KPI list from flat responses map
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
function KpiCard({ kpi, onClick, onAddComment }: {
  kpi: KpiItem;
  onClick: () => void;
  onAddComment: (kpi: KpiItem, text: string) => Promise<void>;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [posting, setPosting] = useState(false);
  const [liveComments, setLiveComments] = useState<KpiComment[]>(kpi.comments);

  useEffect(() => { setLiveComments(kpi.comments); }, [kpi.comments]);

  const handlePost = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    const newC: KpiComment = {
      id: Date.now().toString(),
      author: "Admin",
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
    };
    setLiveComments((p) => [...p, newC]);
    setCommentText("");
    await onAddComment(kpi, commentText.trim());
    setPosting(false);
  };

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("kpiId", kpi.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
      }}
      onDragEnd={() => setIsDragging(false)}
      className="cursor-grab active:cursor-grabbing group"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 8, scale: 0.97 }}
        animate={{
          opacity: isDragging ? 0.55 : 1,
          y: 0,
          scale: isDragging ? 1.03 : 1,
          rotate: isDragging ? 1.5 : 0,
        }}
        exit={{ opacity: 0, scale: 0.95, y: -4 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        className={cn(
          "bg-white rounded-lg ring-1 ring-black/[0.07] p-4 shadow-sm transition-shadow",
          isDragging && "shadow-xl",
        )}
      >
        <div className="flex items-start gap-2">
          <p
            className="text-sm font-semibold text-[#1C1C1E] leading-snug flex-1 cursor-pointer"
            onClick={onClick}
          >
            {kpi.title}
          </p>
          <button
            onClick={onClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700 flex-shrink-0 mt-0.5"
            aria-label="Edit KPI"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0", CAT_PILL[kpi.category])}>
            {CAT_LABEL[kpi.category]}
          </span>
        </div>
        {kpi.outcome && (
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2" onClick={onClick}>{kpi.outcome}</p>
        )}

        {/* Comment toggle */}
        <button
          onClick={(e) => { e.stopPropagation(); setShowComments((s) => !s); }}
          className={cn(
            "mt-3 flex items-center gap-1 text-xs transition-colors",
            liveComments.length > 0 ? "text-slate-400 hover:text-slate-600" : "text-slate-300 hover:text-slate-500",
          )}
        >
          <MessageSquare className="w-3 h-3" />
          <span>{liveComments.length > 0 ? `${liveComments.length} comment${liveComments.length !== 1 ? "s" : ""}` : "Add comment"}</span>
        </button>

        {/* Inline comments + posting */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-slate-100">
                {liveComments.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                    {liveComments.map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#141414] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[8px] font-bold text-white">{c.author[0]}</span>
                        </div>
                        <div className="flex-1 bg-slate-50 rounded p-2">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-semibold text-[#1C1C1E]">{c.author}</span>
                            <span className="text-[10px] text-slate-400">{formatRelativeDate(c.createdAt)}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 items-start">
                  <div className="w-5 h-5 rounded-full bg-[#141414] flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-[8px] font-bold text-white">A</span>
                  </div>
                  <div className="flex-1 relative">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost();
                      }}
                      placeholder="Write a comment…"
                      rows={2}
                      className="w-full border border-gray-200 rounded px-2.5 py-1.5 pr-8 text-xs text-[#1C1C1E] placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-navy/20 resize-none"
                    />
                    <button
                      onClick={handlePost}
                      disabled={!commentText.trim() || posting}
                      className="absolute right-1.5 bottom-1.5 p-1 text-slate-400 hover:text-navy disabled:opacity-30 transition-colors"
                    >
                      {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 ml-7">⌘+Enter to post</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Kanban column
// ─────────────────────────────────────────────────────────────────────────────
function KanbanColumn({
  column, cards, onCardClick, onAdd, onDropCard, onAddComment,
}: {
  column: typeof COLUMNS[number];
  cards: KpiItem[];
  onCardClick: (kpi: KpiItem) => void;
  onAdd: (status: KpiStatus) => void;
  onDropCard: (kpiId: string, newStatus: KpiStatus) => void;
  onAddComment: (kpi: KpiItem, text: string) => Promise<void>;
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
            <KpiCard key={kpi.id} kpi={kpi} onClick={() => onCardClick(kpi)} onAddComment={onAddComment} />
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
// Admin CRUD Modal — includes comment posting
// ─────────────────────────────────────────────────────────────────────────────
function AdminKpiModal({
  kpi,
  defaultStatus,
  onClose,
  onSave,
  onDelete,
  onAddComment,
}: {
  kpi: KpiItem;
  defaultStatus: KpiStatus;
  onClose: () => void;
  onSave: (kpi: KpiItem, updates: Partial<KpiItem>) => Promise<void>;
  onDelete: (kpi: KpiItem) => Promise<void>;
  onAddComment: (kpi: KpiItem, text: string) => Promise<void>;
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
                    ? cat === "company" ? "bg-blue-600 text-white" : "bg-purple-600 text-white"
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
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-[#1C1C1E] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 transition-all"
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
            className="w-full border border-gray-200 rounded px-3 py-2 text-sm text-[#1C1C1E] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 transition-all resize-none"
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

export default function AdminKpisPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const router = useRouter();

  const [clientName, setClientName] = useState("");
  const [responses,  setResponses]  = useState<Record<string, unknown>>({});
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
      fetch(`/api/responses/${clientId}`).then((r) => r.json()),
    ]).then(([clientRes, responseRes]) => {
      setClientName(clientRes.data?.businessName ?? "Client");
      setResponses(responseRes.responses ?? {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId]);

  const kpis        = useMemo(() => buildKpis(responses), [responses]);
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

  // Core patch helper
  const patchField = useCallback(async (prefix: string, index: number, field: string, value: string) => {
    const fieldId = `${prefix}${index}-${field}`;
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    await fetch(`/api/responses/${clientId}/kpis/kpis`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId, value }),
    });
  }, [clientId]);

  const handleSave = useCallback(async (kpi: KpiItem, updates: Partial<KpiItem>) => {
    if (updates.title    !== undefined) await patchField(kpi.prefix, kpi.index, "name",     updates.title);
    if (updates.outcome  !== undefined) await patchField(kpi.prefix, kpi.index, "outcome",  updates.outcome);
    if (updates.status   !== undefined) await patchField(kpi.prefix, kpi.index, "status",   updates.status);
    if (updates.comments !== undefined) await patchField(kpi.prefix, kpi.index, "comments", JSON.stringify(updates.comments));
  }, [patchField]);

  const handleDelete = useCallback(async (kpi: KpiItem) => {
    for (const field of ["name", "outcome", "status", "comments"]) {
      await patchField(kpi.prefix, kpi.index, field, "");
    }
  }, [patchField]);

  const handleAddComment = useCallback(async (kpi: KpiItem, text: string) => {
    const existing: KpiComment[] = [];
    try {
      const raw = responses[`${kpi.prefix}${kpi.index}-comments`];
      if (raw) existing.push(...JSON.parse(String(raw)));
    } catch { /* empty */ }
    const newComment: KpiComment = {
      id: Date.now().toString(),
      author: "Admin",
      text,
      createdAt: new Date().toISOString(),
    };
    await patchField(kpi.prefix, kpi.index, "comments", JSON.stringify([...existing, newComment]));
  }, [responses, patchField]);

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

  // ── Loading skeleton
  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-40 rounded" />
        <Skeleton className="h-16 w-full rounded" />
        <div className="grid grid-cols-3 gap-4 mt-4">
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

  return (
    <div className="p-0">
      {/* Dark header */}
      <div className="sticky top-16 z-20 rounded bg-[#141414] px-5 py-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mb-0.5">
              {clientName}
            </p>
            <h1 className="text-base font-semibold text-white">Key Performance Indicators</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-bold text-white">{filledCount}<span className="text-white/40 font-normal text-xs"> / 10</span></p>
              <p className="text-[11px] text-white/40">KPIs added</p>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-white/60 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(filledCount / 10) * 100}%` }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          />
        </div>
      </div>

      {/* Category filter */}
      <div className="flex items-center gap-2 mb-5">
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
        <span className="ml-auto text-xs text-slate-400">{10 - filledCount} slot{10 - filledCount !== 1 ? "s" : ""} remaining</span>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-4">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            cards={columnCards[col.id] ?? []}
            onCardClick={openEdit}
            onAdd={openCreate}
            onDropCard={handleDrop}
            onAddComment={handleAddComment}
          />
        ))}
      </div>

      <AnimatePresence>
        {modalKpi && (
          <AdminKpiModal
            key={modalKpi.id + modalStatus}
            kpi={modalKpi}
            defaultStatus={modalStatus}
            onClose={() => setModalKpi(null)}
            onSave={handleSave}
            onDelete={handleDelete}
            onAddComment={handleAddComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
