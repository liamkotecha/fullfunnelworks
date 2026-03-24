"use client";

import { useCallback } from "react";

interface MeasureRow {
  id: string;
  label: string;
  current: string;
  target: string;
  rag: string;
  owner: string;
}

interface MeasureTableProps {
  measures: { id: string; label: string }[];
  value: MeasureRow[];
  onChange: (rows: MeasureRow[]) => void;
  readOnly?: boolean;
}

const RAG_OPTIONS = ["", "Green", "Amber", "Red"] as const;

const RAG_STYLES: Record<string, string> = {
  Green: "border-emerald-400 bg-emerald-50 text-emerald-700",
  Amber: "border-amber-400 bg-amber-50 text-amber-700",
  Red: "border-red-400 bg-red-50 text-red-700",
};

export function MeasureTable({ measures, value, onChange, readOnly }: MeasureTableProps) {
  const rows: MeasureRow[] = measures.map((m) => {
    const existing = value.find((r) => r.id === m.id);
    return existing ?? { id: m.id, label: m.label, current: "", target: "", rag: "", owner: "" };
  });

  const updateRow = useCallback(
    (id: string, field: keyof MeasureRow, val: string) => {
      const next = rows.map((r) =>
        r.id === id ? { ...r, [field]: val } : r
      );
      onChange(next);
    },
    [rows, onChange]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2.5 font-semibold w-[30%]">Measure</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[18%]">Current</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[18%]">Target</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[14%]">RAG</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[20%]">Owner</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-2 text-slate-700 font-medium text-xs">{row.label}</td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.current}
                  onChange={(e) => updateRow(row.id, "current", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="—"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.target}
                  onChange={(e) => updateRow(row.id, "target", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="—"
                />
              </td>
              <td className="px-3 py-1.5">
                <select
                  value={row.rag}
                  onChange={(e) => updateRow(row.id, "rag", e.target.value)}
                  disabled={readOnly}
                  className={`w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none disabled:bg-slate-50 ${
                    RAG_STYLES[row.rag] ?? "border-slate-200"
                  }`}
                >
                  {RAG_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt || "—"}
                    </option>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
