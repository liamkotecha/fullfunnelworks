"use client";

import { useCallback } from "react";

export interface GovernanceRow {
  id: string;
  review: string;
  nextDate: string;
  chair: string;
  attendees: string;
}

interface GovernanceCalendarProps {
  reviews: { id: string; label: string }[];
  value: GovernanceRow[];
  onChange: (rows: GovernanceRow[]) => void;
  readOnly?: boolean;
}

export function GovernanceCalendar({ reviews, value, onChange, readOnly }: GovernanceCalendarProps) {
  const rows: GovernanceRow[] = reviews.map((r) => {
    const existing = value.find((v) => v.id === r.id);
    return existing ?? { id: r.id, review: r.label, nextDate: "", chair: "", attendees: "" };
  });

  const updateRow = useCallback(
    (id: string, field: keyof GovernanceRow, val: string) => {
      onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
    },
    [rows, onChange]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
            <th className="text-left px-3 py-2.5 font-semibold w-[30%]">Review</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[20%]">Next Date</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[22%]">Chair</th>
            <th className="text-left px-3 py-2.5 font-semibold w-[28%]">Key Attendees</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-slate-100 hover:bg-slate-50/50">
              <td className="px-3 py-2 text-slate-700 font-medium text-xs">{row.review}</td>
              <td className="px-3 py-1.5">
                <input
                  type="date"
                  value={row.nextDate}
                  onChange={(e) => updateRow(row.id, "nextDate", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.chair}
                  onChange={(e) => updateRow(row.id, "chair", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="Chair name"
                />
              </td>
              <td className="px-3 py-1.5">
                <input
                  type="text"
                  value={row.attendees}
                  onChange={(e) => updateRow(row.id, "attendees", e.target.value)}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-md focus:border-slate-400 focus:outline-none disabled:bg-slate-50"
                  placeholder="Attendees"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
