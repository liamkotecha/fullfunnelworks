"use client";

import { useCallback } from "react";
import { Trash2, Plus } from "lucide-react";

export interface ActionRow {
  id: string;
  action: string;
  owner: string;
  dueDate: string;
  status: string;
}

interface ActionTableProps {
  value: ActionRow[];
  onChange: (rows: ActionRow[]) => void;
  readOnly?: boolean;
}

const STATUS_OPTIONS = ["", "Not Started", "In Progress", "Complete", "Blocked"] as const;

const STATUS_STYLES: Record<string, string> = {
  "Not Started": "border-slate-300 text-slate-600",
  "In Progress": "border-blue-400 bg-blue-50 text-blue-700",
  Complete: "border-emerald-400 bg-emerald-50 text-emerald-700",
  Blocked: "border-red-400 bg-red-50 text-red-700",
};

let _counter = 0;
function uid() {
  return `a${Date.now()}-${++_counter}`;
}

export function ActionTable({ value, onChange, readOnly }: ActionTableProps) {
  const rows = value.length ? value : [];

  const addRow = useCallback(() => {
    onChange([...rows, { id: uid(), action: "", owner: "", dueDate: "", status: "" }]);
  }, [rows, onChange]);

  const removeRow = useCallback(
    (id: string) => {
      onChange(rows.filter((r) => r.id !== id));
    },
    [rows, onChange]
  );

  const updateRow = useCallback(
    (id: string, field: keyof ActionRow, val: string) => {
      onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    },
    [rows, onChange]
  );

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
              <th className="text-left px-3 py-2.5 font-semibold w-[35%]">Action</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[18%]">Owner</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[15%]">Due Date</th>
              <th className="text-left px-3 py-2.5 font-semibold w-[16%]">Status</th>
              {!readOnly && <th className="px-3 py-2.5 w-[40px]" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={readOnly ? 4 : 5} className="text-center py-6 text-slate-400 text-xs">
                  No actions yet. Click &quot;Add Action&quot; to get started.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                <td className="px-3 py-1.5">
                  <input
                    type="text"
                    value={row.action}
                    onChange={(e) => updateRow(row.id, "action", e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                    placeholder="Describe the action…"
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
                <td className="px-3 py-1.5">
                  <input
                    type="date"
                    value={row.dueDate}
                    onChange={(e) => updateRow(row.id, "dueDate", e.target.value)}
                    disabled={readOnly}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  />
                </td>
                <td className="px-3 py-1.5">
                  <select
                    value={row.status}
                    onChange={(e) => updateRow(row.id, "status", e.target.value)}
                    disabled={readOnly}
                    className={`w-full px-2 py-1.5 text-xs border rounded-md focus:outline-none disabled:bg-slate-50 ${
                      STATUS_STYLES[row.status] ?? "border-slate-200"
                    }`}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt || "—"}
                      </option>
                    ))}
                  </select>
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
          <Plus size={14} /> Add Action
        </button>
      )}
    </div>
  );
}
