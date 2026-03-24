"use client";

import { useCallback } from "react";

export interface InterventionRow {
  id: string;
  area: string;
  amberTrigger: string;
  redTrigger: string;
  plannedIntervention: string;
  owner: string;
}

interface InterventionRulesProps {
  areas: { id: string; label: string }[];
  value: InterventionRow[];
  onChange: (rows: InterventionRow[]) => void;
  readOnly?: boolean;
}

export function InterventionRules({ areas, value, onChange, readOnly }: InterventionRulesProps) {
  const rows: InterventionRow[] = areas.map((a) => {
    const existing = value.find((v) => v.id === a.id);
    return existing ?? { id: a.id, area: a.label, amberTrigger: "", redTrigger: "", plannedIntervention: "", owner: "" };
  });

  const updateRow = useCallback(
    (id: string, field: keyof InterventionRow, val: string) => {
      onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    },
    [rows, onChange]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2.5 font-semibold w-[18%]">KPI Area</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[20%]">Amber Trigger</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[20%]">Red Trigger</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[25%]">Planned Intervention</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[17%]">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-2 text-slate-700 font-medium text-xs">{row.area}</td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.amberTrigger}
                  onChange={(e) => updateRow(row.id, "amberTrigger", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-amber-300 bg-amber-50/30 rounded-md focus:border-amber-500 focus:outline-none disabled:bg-slate-50"
                  placeholder="Threshold…"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.redTrigger}
                  onChange={(e) => updateRow(row.id, "redTrigger", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-red-300 bg-red-50/30 rounded-md focus:border-red-500 focus:outline-none disabled:bg-slate-50"
                  placeholder="Threshold…"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.plannedIntervention}
                  onChange={(e) => updateRow(row.id, "plannedIntervention", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="Intervention plan…"
                />
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
