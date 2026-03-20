/**
 * PeopleSection — editable people/payroll table.
 * Columns: Role, Annual Salary (£), Headcount, Pension %, Annual Total (inc NI).
 */
"use client";

import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { PeopleLine } from "@/lib/modeller/calc";
import { ModellerInput } from "./ModellerInput";

interface PeopleSectionProps {
  lines: PeopleLine[];
  onChange: (lines: PeopleLine[]) => void;
  baseLines?: PeopleLine[];
  readOnly?: boolean;
}

function uid() {
  return `ppl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PeopleSection({ lines, onChange, baseLines, readOnly }: PeopleSectionProps) {
  const baseIds = new Set(baseLines?.map((b) => b.id) ?? []);

  const update = useCallback(
    (idx: number, field: keyof PeopleLine, raw: string) => {
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
    (idx: number) => onChange(lines.filter((_, i) => i !== idx)),
    [lines, onChange]
  );

  const add = useCallback(() => {
    onChange([...lines, { id: uid(), name: "", salary: 0, headcount: 1, pensionPct: 3 }]);
  }, [lines, onChange]);

  const getRowBorder = (line: PeopleLine) => {
    if (!baseLines) return "";
    if (!baseIds.has(line.id)) return "border-l-4 border-l-brand-green";
    const base = baseLines.find((b) => b.id === line.id);
    if (!base) return "";
    const changed =
      base.name !== line.name ||
      base.salary !== line.salary ||
      base.headcount !== line.headcount ||
      base.pensionPct !== line.pensionPct;
    return changed ? "border-l-4 border-l-amber-400" : "";
  };

  // Monthly total for all people
  const totalMonthly = lines.reduce((sum, p) => {
    const s = parseFloat(String(p.salary)) || 0;
    const ni = s * 0.138;
    const pen = s * ((parseFloat(String(p.pensionPct)) || 3) / 100);
    return sum + (s + ni + pen) * (parseFloat(String(p.headcount)) || 1);
  }, 0) / 12;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card">
      <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900">People</h3>
        <span className="text-xs text-slate-400">
          Monthly: {fmtGBP(totalMonthly)} (inc. 13.8% employer NI)
        </span>
      </div>

      {/* Header */}
      <div className="grid grid-cols-[1fr_130px_90px_90px_130px_36px] gap-2 px-5 py-2 text-xs font-medium text-slate-500 border-b border-gray-100">
        <span>Role</span>
        <span>Salary (£/yr)</span>
        <span>Headcount</span>
        <span>Pension %</span>
        <span className="text-right">Annual total</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-gray-50">
        {lines.map((line, i) => {
          const s = parseFloat(String(line.salary)) || 0;
          const ni = s * 0.138;
          const pen = s * ((parseFloat(String(line.pensionPct)) || 3) / 100);
          const total = (s + ni + pen) * (parseFloat(String(line.headcount)) || 1);
          return (
            <div
              key={line.id}
              className={cn(
                "grid grid-cols-[1fr_130px_90px_90px_130px_36px] gap-2 px-5 py-2 items-center",
                getRowBorder(line)
              )}
            >
              <ModellerInput
                type="text"
                value={line.name}
                onChange={(v) => update(i, "name", v)}
                placeholder="Role"
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.salary}
                onChange={(v) => update(i, "salary", v)}
                prefix="£"
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.headcount}
                onChange={(v) => update(i, "headcount", v)}
                readOnly={readOnly}
              />
              <ModellerInput
                value={line.pensionPct}
                onChange={(v) => update(i, "pensionPct", v)}
                suffix="%"
                readOnly={readOnly}
              />
              <span className="text-sm font-medium text-slate-700 tabular-nums text-right">
                {fmtGBP(total)}
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
          Add role
        </button>
      )}
    </div>
  );
}
