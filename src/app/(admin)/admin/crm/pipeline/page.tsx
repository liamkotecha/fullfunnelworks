/**
 * Pipeline Kanban — drag-and-drop board for managing prospect stages.
 */
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Download, RefreshCw, ChevronDown, X, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { ProspectCard } from "@/components/crm/ProspectCard";
import { QuickAddProspectModal } from "@/components/crm/QuickAddProspectModal";
import type { ProspectDTO, ProspectStage } from "@/types";
import { PROSPECT_STAGE_META } from "@/types";

/* ── Column config ────────────────────────────────────────── */
const ACTIVE_STAGES: ProspectStage[] = ["mql", "sql", "discovery", "proposal", "negotiating"];
const CLOSED_STAGES: ProspectStage[] = ["won", "lost"];

const STAGE_COLORS: Record<ProspectStage, string> = {
  mql: "bg-blue-500",
  sql: "bg-indigo-500",
  discovery: "bg-purple-500",
  proposal: "bg-amber-500",
  negotiating: "bg-orange-500",
  won: "bg-emerald-500",
  lost: "bg-slate-400",
};

/* ── Sortable card wrapper ────────────────────────────────── */
function SortableCard({ prospect }: { prospect: ProspectDTO }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: prospect.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ProspectCard prospect={prospect} isDragging={isDragging} />
    </div>
  );
}

/* ── Column component ─────────────────────────────────────── */
function KanbanColumn({
  stage,
  prospects,
  onAddClick,
}: {
  stage: ProspectStage;
  prospects: ProspectDTO[];
  onAddClick?: () => void;
}) {
  const meta = PROSPECT_STAGE_META[stage];
  const pipelineValue = prospects.reduce((s, p) => s + (p.dealValue ?? 0), 0);

  const { setNodeRef } = useSortable({
    id: `column-${stage}`,
    data: { type: "column", stage },
    disabled: true,
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col w-[280px] min-w-[280px] flex-shrink-0"
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn("w-2.5 h-2.5 rounded-full", STAGE_COLORS[stage])} />
          <span className="text-sm font-semibold text-slate-900">{meta.label}</span>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5 font-medium">
            {prospects.length}
          </span>
        </div>
        {stage === "mql" && onAddClick && (
          <button
            onClick={onAddClick}
            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pipeline value for this column */}
      {pipelineValue > 0 && (
        <p className="text-[10px] font-medium text-slate-400 mb-2 px-1">
          {formatPence(pipelineValue)}
        </p>
      )}

      {/* Cards */}
      <SortableContext
        items={prospects.map((p) => p.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-[120px] p-1 rounded-lg bg-slate-50/50">
          {prospects.length === 0 && (
            <div className="flex items-center justify-center h-24 text-xs text-slate-400">
              No prospects
            </div>
          )}
          {prospects.map((prospect) => (
            <SortableCard key={prospect.id} prospect={prospect} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}

/* ── Main Page ────────────────────────────────────────────── */
export default function PipelinePage() {
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const hasFetched = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch("/api/prospects");
      const json = await res.json();
      setProspects(json.data ?? []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchProspects();
  }, [fetchProspects]);

  /* ── Filtering ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!search.trim()) return prospects;
    const q = search.toLowerCase();
    return prospects.filter(
      (p) =>
        p.businessName.toLowerCase().includes(q) ||
        p.contactName.toLowerCase().includes(q) ||
        p.contactEmail.toLowerCase().includes(q)
    );
  }, [prospects, search]);

  /* ── Group by stage ─────────────────────────────────── */
  const columns = useMemo(() => {
    const stages = showClosed ? [...ACTIVE_STAGES, ...CLOSED_STAGES] : ACTIVE_STAGES;
    const map: Record<string, ProspectDTO[]> = {};
    for (const s of stages) map[s] = [];
    for (const p of filtered) {
      if (map[p.stage]) map[p.stage].push(p);
    }
    return { stages, map };
  }, [filtered, showClosed]);

  /* ── Pipeline summary ──────────────────────────────── */
  const activePipeline = useMemo(() => {
    return ACTIVE_STAGES.reduce(
      (sum, s) => sum + (columns.map[s] ?? []).reduce((a, p) => a + (p.dealValue ?? 0), 0),
      0
    );
  }, [columns]);

  const totalActive = useMemo(
    () => ACTIVE_STAGES.reduce((sum, s) => sum + (columns.map[s] ?? []).length, 0),
    [columns]
  );

  /* ── Drag handlers ──────────────────────────────────── */
  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const prospectId = String(active.id);
    // Find what stage the card was dropped onto
    let targetStage: ProspectStage | null = null;

    // Check if dropped on a column
    if (String(over.id).startsWith("column-")) {
      targetStage = String(over.id).replace("column-", "") as ProspectStage;
    } else {
      // Dropped on another card — find that card's stage
      const overProspect = prospects.find((p) => p.id === String(over.id));
      if (overProspect) targetStage = overProspect.stage;
    }

    if (!targetStage) return;

    const prospect = prospects.find((p) => p.id === prospectId);
    if (!prospect || prospect.stage === targetStage) return;

    // Don't allow drag to "lost" without reason
    if (targetStage === "lost") return;

    // Optimistic update
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId ? { ...p, stage: targetStage!, daysInStage: 0 } : p
      )
    );

    // PATCH to API
    try {
      const res = await fetch(`/api/prospects/${prospectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage: targetStage }),
      });
      if (res.ok) {
        const json = await res.json();
        setProspects((prev) =>
          prev.map((p) => (p.id === prospectId ? json.data : p))
        );
      } else {
        // Revert on failure
        setProspects((prev) =>
          prev.map((p) =>
            p.id === prospectId ? { ...p, stage: prospect.stage, daysInStage: prospect.daysInStage } : p
          )
        );
      }
    } catch {
      // Revert
      setProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId ? { ...p, stage: prospect.stage, daysInStage: prospect.daysInStage } : p
        )
      );
    }
  }

  const activeProspect = activeId ? prospects.find((p) => p.id === activeId) : null;

  /* ── Loading ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-64 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[280px] min-w-[280px]">
              <div className="h-6 w-20 bg-slate-200/60 rounded animate-pulse mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 3 - i }).map((_, j) => (
                  <div key={j} className="h-28 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── Header bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-bold text-2xl text-slate-900">Pipeline</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {totalActive} active prospect{totalActive !== 1 ? "s" : ""}
            {activePipeline > 0 && <> &middot; {formatPence(activePipeline)} pipeline value</>}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search prospects…"
              className="pl-8 pr-3 py-2 text-sm font-sans rounded-lg bg-white ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20 w-48 placeholder:text-slate-400"
            />
          </div>

          {/* Show won/lost */}
          <button
            onClick={() => setShowClosed((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              showClosed
                ? "bg-slate-900 text-white"
                : "bg-white ring-1 ring-black/[0.08] text-slate-600 hover:bg-slate-50"
            )}
          >
            {showClosed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            Won/Lost
          </button>

          {/* Refresh */}
          <button
            onClick={() => { setLoading(true); fetchProspects(); }}
            className="p-2 rounded-lg bg-white ring-1 ring-black/[0.08] text-slate-500 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Add prospect */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgb(108, 194, 255)", color: "#141414" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add prospect
          </motion.button>
        </div>
      </div>

      {/* ── Kanban board ─────────────────────────────────── */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.stages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              prospects={columns.map[stage] ?? []}
              onAddClick={stage === "mql" ? () => setShowAddModal(true) : undefined}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <div className="w-[268px]">
              <ProspectCard prospect={activeProspect} isDragging />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* ── Quick add modal ──────────────────────────────── */}
      <QuickAddProspectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={(p) => setProspects((prev) => [p, ...prev])}
      />
    </div>
  );
}
