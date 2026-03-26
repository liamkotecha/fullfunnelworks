/**
 * Customer Outcome Mapper — Feature → Problem → Outcome → Impact
 */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { Plus, Trash2, GripVertical, Lightbulb } from "lucide-react";
import { Reorder, useDragControls, motion } from "framer-motion";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader, WhatsNext } from "@/components/framework";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
type OutcomeRow = {
  id: string;
  feature: string;
  problem: string;
  outcome: string;
  impact: string;
};

const COLUMNS: {
  key: keyof Omit<OutcomeRow, "id">;
  label: string;
  placeholder: string;
  pill: string;
}[] = [
  { key: "feature", label: "Feature", placeholder: "e.g. Real-time reporting dashboard",      pill: "text-blue-700 bg-blue-50 ring-1 ring-blue-100"         },
  { key: "problem", label: "Problem", placeholder: "e.g. Managers can't see pipeline status", pill: "text-amber-700 bg-amber-50 ring-1 ring-amber-100"       },
  { key: "outcome", label: "Outcome", placeholder: "e.g. Daily visibility into deal health",  pill: "text-emerald-700 bg-emerald-50 ring-1 ring-emerald-100" },
  { key: "impact",  label: "Impact",  placeholder: "e.g. 15% reduction in stalled deals",     pill: "text-purple-700 bg-purple-50 ring-1 ring-purple-100"   },
];

function newRow(): OutcomeRow {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    feature: "", problem: "", outcome: "", impact: "",
  };
}

const FIELD_ID = "outcome-rows";
const LEGACY = {
  feature: "outcome-feature",
  problem: "outcome-problem",
  outcome: "outcome-outcome",
  impact:  "outcome-impact",
} as const;

// ---------------------------------------------------------------------------
// Auto-resizing cell textarea
// ---------------------------------------------------------------------------
function AutoCell({
  value, placeholder, onChange,
}: { value: string; placeholder: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400 leading-relaxed py-0 min-h-[24px] focus:ring-0"
    />
  );
}

// ---------------------------------------------------------------------------
// Draggable table row
// ---------------------------------------------------------------------------
function DraggableRow({
  row,
  idx,
  onUpdate,
  onDelete,
}: {
  row: OutcomeRow;
  idx: number;
  onUpdate: (id: string, key: keyof Omit<OutcomeRow, "id">, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="tr"
      value={row}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.025,
        opacity: 0.92,
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
        backgroundColor: "#ffffff",
        zIndex: 50,
        rotate: 0.4,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group bg-white border-b border-gray-100 last:border-0"
      style={{ position: "relative" }}
    >
      {/* Grip + row number — drag only starts here */}
      <td className="px-3 py-2 align-middle w-9">
        <div className="flex flex-col items-center gap-0.5">
          <motion.div
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing touch-none"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </motion.div>
          <span className="text-[10px] font-semibold text-gray-300 select-none">{idx + 1}</span>
        </div>
      </td>

      {COLUMNS.map((col) => (
        <td key={col.key} className="px-5 py-2 align-middle min-w-[200px]">
          <AutoCell
            value={row[col.key]}
            placeholder={col.placeholder}
            onChange={(v) => onUpdate(row.id, col.key, v)}
          />
        </td>
      ))}

      <td className="px-3 py-2 align-middle w-10">
        <button
          onClick={() => onDelete(row.id)}
          title="Remove row"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </Reorder.Item>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function OutcomesPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse } = useResponses(clientId);

  const loading = clientLoading || responsesLoading;

  const [rows, setRows] = useState<OutcomeRow[]>([]);
  const [initialised, setInitialised] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Init rows from saved JSON or migrate legacy fields
  useEffect(() => {
    if (loading || initialised) return;
    const raw = responses[FIELD_ID];
    if (raw && typeof raw === "string" && raw.trim().startsWith("[")) {
      try {
        const parsed: OutcomeRow[] = JSON.parse(raw);
        if (parsed.length > 0) { setRows(parsed); setInitialised(true); return; }
      } catch { /* fall through */ }
    }
    const legacy: OutcomeRow = {
      id: "legacy-1",
      feature: String(responses[LEGACY.feature] ?? ""),
      problem: String(responses[LEGACY.problem] ?? ""),
      outcome: String(responses[LEGACY.outcome] ?? ""),
      impact:  String(responses[LEGACY.impact]  ?? ""),
    };
    setRows([legacy, newRow()]);
    setInitialised(true);
  }, [loading, responses, initialised]);

  // Debounced save
  const save = useCallback(
    (nextRows: OutcomeRow[]) => {
      if (!clientId) return;
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        const value = JSON.stringify(nextRows);
        setLocalResponse(FIELD_ID, value);
        await fetch(`/api/responses/${clientId}/product/outcomes`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId: FIELD_ID, value }),
        });
      }, 700);
    },
    [clientId, setLocalResponse],
  );

  const reorder = useCallback(
    (newRows: OutcomeRow[]) => {
      setRows(newRows);
      save(newRows);
    },
    [save],
  );

  const updateRow = useCallback(
    (id: string, key: keyof Omit<OutcomeRow, "id">, value: string) => {
      setRows((prev) => {
        const next = prev.map((r) => (r.id === id ? { ...r, [key]: value } : r));
        save(next);
        return next;
      });
    },
    [save],
  );

  const addRow = useCallback(() => {
    setRows((prev) => { const next = [...prev, newRow()]; save(next); return next; });
  }, [save]);

  const deleteRow = useCallback(
    (id: string) => {
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== id);
        const final = next.length === 0 ? [newRow()] : next;
        save(final);
        return final;
      });
    },
    [save],
  );

  const filledCount = useMemo(
    () => rows.filter((r) => r.feature.trim() || r.problem.trim() || r.outcome.trim() || r.impact.trim()).length,
    [rows],
  );

  const allFilled = useMemo(
    () => rows.length > 0 && rows.every((r) => r.feature.trim() && r.problem.trim() && r.outcome.trim() && r.impact.trim()),
    [rows],
  );

  const isEmpty = useMemo(
    () => rows.every((r) => !r.feature.trim() && !r.problem.trim() && !r.outcome.trim() && !r.impact.trim()),
    [rows],
  );

  if (loading || !initialised) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">No client profile found.</p>
      </div>
    );
  }

  return (
    <div>
      <SectionProgressHeader
        title="Customer Outcome Mapper"
        answeredCount={filledCount}
        totalCount={Math.max(rows.length, 1)}
        lastSavedAt={null}
      />

      {/* Intro */}
      <div className="mt-5 mb-4">
        <p className="text-sm text-gray-500">
          Map each feature to the customer problem it solves, the outcome it produces, and its measurable business impact.
        </p>
      </div>

      {isEmpty && (
        <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <Lightbulb className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No outcomes mapped yet</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Start filling in the first row — link a feature to the problem it solves, the outcome it delivers, and the business impact it creates.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="w-9 px-3 py-3" />
                {COLUMNS.map((col) => (
                  <th key={col.key} scope="col" className="px-5 py-3 font-semibold">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest", col.pill)}>
                      {col.label}
                    </span>
                  </th>
                ))}
                <th scope="col" className="w-10 px-3 py-3" />
              </tr>
            </thead>

            {/* Reorder.Group renders as <tbody> */}
            <Reorder.Group
              as="tbody"
              axis="y"
              values={rows}
              onReorder={reorder}
            >
              {rows.map((row, idx) => (
                <DraggableRow
                  key={row.id}
                  row={row}
                  idx={idx}
                  onUpdate={updateRow}
                  onDelete={deleteRow}
                />
              ))}
            </Reorder.Group>
          </table>
        </div>

        {/* Add row footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3">
          <button
            onClick={addRow}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            <span className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-gray-600 flex items-center justify-center transition-colors flex-shrink-0">
              <Plus className="w-3 h-3" />
            </span>
            Add outcome row
          </button>
        </div>
      </div>

      {allFilled && rows.length > 0 && (
        <div className="mt-6">
          <WhatsNext
            completedTitle="Customer Outcome Mapper"
            nextTitle="Process Checklist"
            nextHref="/portal/process/checklist"
            nextDescription="Standardise and scale your operations"
          />
        </div>
      )}
    </div>
  );
}
