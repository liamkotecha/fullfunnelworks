/**
 * OverheadsSection — editable overheads table.
 * Columns: Name, Amount (£), Period toggle, Monthly equivalent.
 */
"use client";

import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { OverheadLine } from "@/lib/modeller/calc";
import { ModellerInput } from "./ModellerInput";

interface OverheadsSectionProps {
  lines: OverheadLine[];
  onChange: (lines: OverheadLine[]) => void;
  baseLines?: OverheadLine[];
  readOnly?: boolean;
}

function uid() {
  return `oh-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function OverheadsSection({ lines, onChange, baseLines, readOnly }: OverheadsSectionProps) {
  const baseIds = new Set(baseLines?.map((b) => b.id) ?? []);

  const update = useCallback(
    (idx: number, field: keyof OverheadLine, raw: string) => {
      const next = [...lines];
      if (field === "name") {
        next[idx] = { ...next[idx], name: raw };
      } else if (field === "period") {
        next[idx] = { ...next[idx], period: raw as "monthly" | "annual" };
      } else {
        next[idx] = { ...next[idx], [field]: parseFloat(raw) || 0 };
      }
      onChange(next);
    },
    [lines, onChange]
  );

  const remove = useCallback(
    (idx: number) => onChange(lines.filter((_, i) => i !== idx)),
    [lines, onChange]
  );

  const add = useCallback(() => {
    onChange([...lines, { id: uid(), name: "", amount: 0, period: "monthly" }]);
  }, [lines, onChange]);

  const getRowBorder = (line: OverheadLine) => {
    if (!baseLines) return "";
    if (!baseIds.has(line.id)) return "border-l-4 border-l-brand-green";
    const base = baseLines.find((b) => b.id === line.id);
    if (!base) return "";
    const changed =
      base.name !== line.name ||
      base.amount !== line.amount ||
      base.period !== line.period;
    return changed ? "border-l-4 border-l-amber-400" : "";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-900">Overheads</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_130px_120px_120px_36px] gap-2 px-5 py-2 text-xs font-medium text-slate-500 border-b border-gray-100">
        <span>Expense</span>
        <span>Amount (£)</span>
        <span>Period</span>
        <span className="text-right">Monthly eq.</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {lines.map((line, i) => {
          const monthly =
            (parseFloat(String(line.amount)) || 0) *
            (line.period === "annual" ? 1 / 12 : 1);
          return (
            <div
              key={line.id}
              className={cn(
                "grid grid-cols-[1fr_130px_120px_120px_36px] gap-2 px-5 py-2 items-center",
                getRowBorder(line)
              )}
            >
              <ModellerInput
                type="text"
                value={line.name}
                onChange={(v) => update(i, "name", v)}
                placeholder="Overhead"
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.amount}
                onChange={(v) => update(i, "amount", v)}
                prefix="£"
                readOnly={readOnly}
              />
              {readOnly ? (
                <span className="text-sm text-slate-600 capitalize">{line.period}</span>
              ) : (
                <select
                  value={line.period}
                  onChange={(e) => update(i, "period", e.target.value)}
                  className="h-9 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 px-2 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              )}
              <span className="text-sm font-medium text-slate-700 tabular-nums text-right">
                {fmtGBP(monthly)}
              </span>
              {!readOnly && (
                <button
                  onClick={() => remove(i)}
                  className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add button */}
      {!readOnly && (
        <button
          onClick={add}
          className="flex items-center gap-1.5 w-full px-5 py-3 text-sm text-slate-500 hover:text-navy hover:bg-gray-50 transition-colors border-t border-dashed border-gray-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Add overhead
        </button>
      )}
    </div>
  );
}
