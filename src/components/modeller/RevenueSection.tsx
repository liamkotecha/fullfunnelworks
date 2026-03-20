/**
 * RevenueSection — editable revenue lines table.
 * Columns: Name, Price (£), Units/month, COGS %, Monthly Total.
 * Changed/new row indicators via coloured left border.
 */
"use client";

import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { RevenueLine } from "@/lib/modeller/calc";
import { ModellerInput } from "./ModellerInput";

interface RevenueSectionProps {
  lines: RevenueLine[];
  onChange: (lines: RevenueLine[]) => void;
  baseLines?: RevenueLine[];
  readOnly?: boolean;
}

function uid() {
  return `rev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RevenueSection({ lines, onChange, baseLines, readOnly }: RevenueSectionProps) {
  const baseIds = new Set(baseLines?.map((b) => b.id) ?? []);

  const update = useCallback(
    (idx: number, field: keyof RevenueLine, raw: string) => {
      const next = [...lines];
      if (field === "name") {
        next[idx] = { ...next[idx], name: raw };
      } else {
        next[idx] = { ...next[idx], [field]: parseFloat(raw) || 0 };
      }
      onChange(next);
    },
    [lines, onChange]
  );

  const remove = useCallback(
    (idx: number) => {
      onChange(lines.filter((_, i) => i !== idx));
    },
    [lines, onChange]
  );

  const add = useCallback(() => {
    onChange([...lines, { id: uid(), name: "", price: 0, volume: 0, cogsPct: 0 }]);
  }, [lines, onChange]);

  const getRowBorder = (line: RevenueLine) => {
    if (!baseLines) return "";
    if (!baseIds.has(line.id)) return "border-l-4 border-l-brand-green";
    const base = baseLines.find((b) => b.id === line.id);
    if (!base) return "";
    const changed =
      base.name !== line.name ||
      base.price !== line.price ||
      base.volume !== line.volume ||
      base.cogsPct !== line.cogsPct;
    return changed ? "border-l-4 border-l-amber-400" : "";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card">
      <div className="px-5 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-slate-900">Revenue</h3>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_120px_100px_90px_120px_36px] gap-2 px-5 py-2 text-xs font-medium text-slate-500 border-b border-gray-100">
        <span>Name</span>
        <span>Price (£)</span>
        <span>Units/mo</span>
        <span>COGS %</span>
        <span className="text-right">Monthly</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {lines.map((line, i) => {
          const monthly = (parseFloat(String(line.price)) || 0) * (parseFloat(String(line.volume)) || 0);
          return (
            <div
              key={line.id}
              className={cn(
                "grid grid-cols-[1fr_120px_100px_90px_120px_36px] gap-2 px-5 py-2 items-center",
                getRowBorder(line)
              )}
            >
              <ModellerInput
                type="text"
                value={line.name}
                onChange={(v) => update(i, "name", v)}
                placeholder="Revenue line"
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.price}
                onChange={(v) => update(i, "price", v)}
                prefix="£"
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.volume}
                onChange={(v) => update(i, "volume", v)}
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.cogsPct}
                onChange={(v) => update(i, "cogsPct", v)}
                suffix="%"
                readOnly={readOnly}
              />
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
          Add revenue line
        </button>
      )}
    </div>
  );
}
