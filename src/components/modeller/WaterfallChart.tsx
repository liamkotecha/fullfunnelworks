/**
 * WaterfallChart — visual bar chart of P&L flow.
 * Bars: Revenue, COGS, Gross Profit, People, Overheads, EBITDA.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { PLResult } from "@/lib/modeller/calc";

interface Bar {
  label: string;
  value: number;
  color: string;
}

export function WaterfallChart({ pl, className }: { pl: PLResult; className?: string }) {
  const bars: Bar[] = [
    { label: "Revenue",      value: pl.totalRevenue,        color: "bg-brand-blue" },
    { label: "COGS",         value: pl.totalCOGS,           color: "bg-brand-pink" },
    { label: "Gross Profit", value: pl.grossProfit,         color: "bg-brand-blue/60" },
    { label: "People",       value: pl.totalPeopleMonthly,  color: "bg-amber-400" },
    { label: "Overheads",    value: pl.totalOverheads,       color: "bg-brand-pink/60" },
    {
      label: "EBITDA",
      value: pl.ebitda,
      color: pl.ebitda >= 0 ? "bg-brand-green" : "bg-brand-pink",
    },
  ];

  const maxVal = Math.max(...bars.map((b) => Math.abs(b.value)), 1);
  const maxHeight = 120;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-card p-5", className)}>
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Waterfall</h3>
      <div className="flex items-end justify-between gap-2" style={{ height: maxHeight + 40 }}>
        {bars.map((b) => {
          const h = Math.max((Math.abs(b.value) / maxVal) * maxHeight, 4);
          return (
            <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-slate-700 tabular-nums whitespace-nowrap">
                {fmtGBP(Math.abs(b.value))}
              </span>
              <div
                className={cn("w-full rounded-t-md transition-all duration-300", b.color)}
                style={{ height: h }}
              />
              <span className="text-[10px] text-slate-500 whitespace-nowrap">{b.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
