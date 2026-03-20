/**
 * PLWaterfallView — 12-month bar chart showing revenue + EBITDA side by side.
 * Amber dot for months with new hires. Animated bars. Hover tooltips.
 */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { Hire, MonthResult } from "@/lib/hiring/calc";

interface PLWaterfallViewProps {
  months: MonthResult[];
  hires: Hire[];
}

export function PLWaterfallView({ months, hires }: PLWaterfallViewProps) {
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);

  const maxVal = Math.max(
    ...months.map((m) => Math.max(Math.abs(m.totalRevenue), Math.abs(m.ebitda))),
    1
  );

  const hireStartMonths = new Set(hires.map((h) => parseFloat(String(h.startMonth)) || 0));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card p-5">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">P&L Waterfall — 12 months</h3>

      {/* Chart area */}
      <div className="flex items-end gap-2 h-[200px] relative">
        {months.map((m, i) => {
          const revH = (Math.abs(m.totalRevenue) / maxVal) * 160;
          const ebitdaH = (Math.abs(m.ebitda) / maxVal) * 160;
          const isHovered = hoveredMonth === m.month;
          const hasNewHire = hireStartMonths.has(m.month);

          return (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-1 relative"
              onMouseEnter={() => setHoveredMonth(m.month)}
              onMouseLeave={() => setHoveredMonth(null)}
            >
              {/* New hire dot */}
              {hasNewHire && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 block" />
                </div>
              )}

              {/* Bars */}
              <div className="flex items-end gap-0.5 flex-1 w-full justify-center">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: revH }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.04 }}
                  className="w-[40%] rounded-t bg-brand-blue/80"
                />
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: ebitdaH }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, delay: i * 0.04 + 0.05 }}
                  className={cn(
                    "w-[40%] rounded-t",
                    m.ebitda >= 0 ? "bg-brand-green/80" : "bg-brand-pink/80"
                  )}
                />
              </div>

              {/* Month label */}
              <span className="text-[10px] text-slate-400 font-medium mt-1">{m.label}</span>

              {/* Tooltip */}
              {isHovered && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#141414] text-white rounded-lg p-3 text-xs whitespace-nowrap z-30 shadow-lg">
                  <p className="font-semibold mb-1.5">{m.label}</p>
                  <div className="space-y-0.5">
                    <TooltipRow label="Revenue" value={fmtGBP(m.totalRevenue)} />
                    <TooltipRow label="People cost" value={fmtGBP(m.totalPeople)} />
                    <TooltipRow label="Overheads" value={fmtGBP(m.totalOverheads)} />
                    <TooltipRow label="Hiring costs" value={fmtGBP(m.hiringCosts)} />
                    <TooltipRow label="Headcount" value={`+${m.headcount}`} />
                    <div className="border-t border-white/20 my-1.5" />
                    <TooltipRow
                      label="EBITDA"
                      value={fmtGBP(m.ebitda)}
                      color={m.ebitda >= 0 ? "text-brand-green" : "text-brand-pink"}
                    />
                  </div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-[#141414]" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
        <LegendItem color="bg-brand-blue/80" label="Revenue" />
        <LegendItem color="bg-brand-green/80" label="EBITDA (positive)" />
        <LegendItem color="bg-brand-pink/80" label="EBITDA (negative)" />
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-xs text-slate-500">New hire</span>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("w-3 h-2 rounded-sm", color)} />
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function TooltipRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/60">{label}</span>
      <span className={cn("font-medium tabular-nums", color ?? "text-white")}>{value}</span>
    </div>
  );
}
