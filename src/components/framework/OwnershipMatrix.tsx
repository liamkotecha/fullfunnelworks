"use client";

import { useCallback } from "react";

export interface OwnershipRow {
  id: string;
  role: string;
  namedOwner: string;
  confirmed: boolean;
}

interface OwnershipMatrixProps {
  roles: { id: string; label: string }[];
  value: OwnershipRow[];
  onChange: (rows: OwnershipRow[]) => void;
  readOnly?: boolean;
}

export function OwnershipMatrix({ roles, value, onChange, readOnly }: OwnershipMatrixProps) {
  const rows: OwnershipRow[] = roles.map((r) => {
    const existing = value.find((v) => v.id === r.id);
    return existing ?? { id: r.id, role: r.label, namedOwner: "", confirmed: false };
  });

  const updateRow = useCallback(
    (id: string, field: keyof OwnershipRow, val: string | boolean) => {
      const next = rows.map((r) => (r.id === id ? { ...r, [field]: val } : r));
      onChange(next);
    },
    [rows, onChange]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2.5 font-semibold w-[40%]">Role</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[40%]">Named Owner</th>
            <th className="text-center px-3 py-2.5 font-semibold w-[20%]">Confirmed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-2 text-slate-700 font-medium text-xs">{row.role}</td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.namedOwner}
                  onChange={(e) => updateRow(row.id, "namedOwner", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="Name"
                />
              </td>
              <td className="px-3 py-1.5 text-center">
                <input
                  type="checkbox"
                  checked={row.confirmed}
                  onChange={(e) => updateRow(row.id, "confirmed", e.target.checked)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
