/**
 * HeadcountView — Gantt-style timeline. One row per hire, 12 month columns.
 * Cell states: pre-start (empty), start month (filled pill), ramping (dashed), active (solid).
 */
"use client";

import { cn } from "@/lib/utils";
import { getDeptColor } from "@/lib/hiring/departments";
import type { Hire } from "@/lib/hiring/calc";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface HeadcountViewProps {
  hires: Hire[];
}

export function HeadcountView({ hires }: HeadcountViewProps) {
  const num = (v: unknown) => parseFloat(String(v)) || 0;

  // Cumulative headcount per month
  const cumulativeHeadcount = MONTH_LABELS.map((_, mi) => {
    const month = mi + 1;
    return hires.filter((h) => num(h.startMonth) <= month).length;
  });

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left px-4 py-3 font-semibold text-slate-900 text-xs min-w-[180px] sticky left-0 bg-white z-10">
              Role
            </th>
            {MONTH_LABELS.map((m) => (
              <th key={m} className="text-center px-2 py-3 text-xs font-medium text-slate-500 min-w-[60px]">
                {m}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {hires.map((hire) => {
            const dept = getDeptColor(hire.department);
            const start = num(hire.startMonth);
            const ramp = num(hire.rampMonths);

            return (
              <tr key={hire.id}>
                <td className="px-4 py-2.5 sticky left-0 bg-white z-10">
                  <p className="font-serif text-sm font-medium text-slate-900 truncate">
                    {hire.role || "Untitled"}
                  </p>
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", dept.light, dept.text)}>
                    {hire.department || "—"}
                  </span>
                </td>
                {MONTH_LABELS.map((_, mi) => {
                  const month = mi + 1;
                  if (month < start) {
                    // Pre-start: empty
                    return <td key={mi} className="px-1 py-2.5"><div className="h-6" /></td>;
                  }
                  if (month === start) {
                    // Start month: filled pill
                    return (
                      <td key={mi} className="px-1 py-2.5">
                        <div className={cn("h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white", dept.bg)}>
                          START
                        </div>
                      </td>
                    );
                  }
                  const monthsActive = month - start;
                  if (ramp > 1 && monthsActive < ramp) {
                    // Ramping: dashed border
                    return (
                      <td key={mi} className="px-1 py-2.5">
                        <div className={cn("h-6 rounded-full border-2 border-dashed", dept.border)} />
                      </td>
                    );
                  }
                  // Active: solid border
                  return (
                    <td key={mi} className="px-1 py-2.5">
                      <div className={cn("h-6 rounded-full border-2", dept.border)} />
                    </td>
                  );
                })}
              </tr>
            );
          })}

          {/* Footer: cumulative headcount */}
          <tr className="bg-gray-50/50 border-t border-gray-200">
            <td className="px-4 py-2.5 text-xs font-semibold text-slate-700 sticky left-0 bg-gray-50/50 z-10">
              New headcount
            </td>
            {cumulativeHeadcount.map((count, mi) => (
              <td key={mi} className="text-center px-2 py-2.5">
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  {count > 0 ? `+${count}` : "—"}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
