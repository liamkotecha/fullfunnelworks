"use client";

import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";

export interface RiskRow {
  id: string;
  risk: string;
  likelihood: string;
  impact: string;
  owner: string;
  mitigation: string;
}

interface RiskRegisterProps {
  value: RiskRow[];
  onChange: (rows: RiskRow[]) => void;
  readOnly?: boolean;
}

const LEVEL_OPTIONS = ["", "Low", "Medium", "High"] as const;

const LEVEL_STYLES: Record<string, string> = {
  Low: "border-emerald-400 bg-emerald-50 text-emerald-700",
  Medium: "border-amber-400 bg-amber-50 text-amber-700",
  High: "border-red-400 bg-red-50 text-red-700",
};

let _counter = 0;
function uid() {
  return `r${Date.now()}-${++_counter}`;
}

export function RiskRegister({ value, onChange, readOnly }: RiskRegisterProps) {
  const rows = value.length ? value : [];

  const addRow = useCallback(() => {
    onChange([...rows, { id: uid(), risk: "", likelihood: "", impact: "", owner: "", mitigation: "" }]);
  }, [rows, onChange]);

  const removeRow = useCallback(
    (id: string) => onChange(rows.filter((r) => r.id !== id)),
    [rows, onChange]
  );

  const updateRow = useCallback(
    (id: string, field: keyof RiskRow, val: string) =>
      onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r))),
    [rows, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className="text-left px-3 py-2.5 font-semibold w-[25%]">Risk</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[13%]">Likelihood</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[13%]">Impact</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[15%]">Owner</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[25%]">Mitigation</th>
              {!readOnly && <th className="px-3 py-2.5 w-[40px]" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 5 : 6} className="text-center py-6 text-slate-400 text-xs">
                  No risks logged. Click &quot;Add Risk&quot; to begin.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.risk}
                    onChange={(e) => updateRow(row.id, "risk", e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    placeholder="Describe the risk…"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.likelihood}
                    onChange={(e) => updateRow(row.id, "likelihood", e.target.value)}
                    disabled={readOnly}
                    className={`w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none disabled:bg-slate-50 ${
                      LEVEL_STYLES[row.likelihood] ?? "border-slate-200"
                    }`}
                  >
                    {LEVEL_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o || "—"}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.impact}
                    onChange={(e) => updateRow(row.id, "impact", e.target.value)}
                    disabled={readOnly}
                    className={`w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none disabled:bg-slate-50 ${
                      LEVEL_STYLES[row.impact] ?? "border-slate-200"
                    }`}
                  >
                    {LEVEL_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o || "—"}</option>
                    ))}
                  </select>
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.owner}
                    onChange={(e) => updateRow(row.id, "owner", e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    placeholder="Owner"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.mitigation}
                    onChange={(e) => updateRow(row.id, "mitigation", e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    placeholder="Mitigation plan…"
                  />
                </td>
                {!readOnly && (
                  <td className="px-2 py-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!readOnly && (
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
        >
          <Plus size={14} /> Add Risk
        </button>
      )}
    </div>
  );
}
