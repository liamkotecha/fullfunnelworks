/**
 * KPIStrip — five stat cards across the top of the modeller.
 * Shows: Monthly Revenue, Gross Profit (%), People Cost, Overheads, EBITDA.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { PLResult } from "@/lib/modeller/calc";

export function KPIStrip({ pl }: { pl: PLResult }) {
  const cards = [
    {
      label: "Monthly Revenue",
      value: fmtGBP(pl.totalRevenue),
      sub: null,
    },
    {
      label: "Gross Profit",
      value: fmtGBP(pl.grossProfit),
      sub: `${pl.grossMargin.toFixed(1)}%`,
    },
    {
      label: "People Cost",
      value: fmtGBP(pl.totalPeopleMonthly),
      sub: "/mo",
    },
    {
      label: "Overheads",
      value: fmtGBP(pl.totalOverheads),
      sub: "/mo",
    },
    {
      label: "EBITDA",
      value: fmtGBP(pl.ebitda),
      sub: `${pl.ebitdaMargin.toFixed(1)}%`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="bg-white rounded-lg border border-gray-200 p-4 shadow-card"
        >
          <p className="text-xs text-slate-500 font-medium mb-1">{c.label}</p>
          <div className="flex items-baseline gap-1.5">
            <p
              className={cn(
                "text-lg font-bold tabular-nums",
                c.label === "EBITDA" && pl.ebitda >= 0 && "text-emerald-600",
                c.label === "EBITDA" && pl.ebitda < 0 && "text-red-600"
              )}
            >
              {c.value}
            </p>
            {c.sub && <span className="text-xs text-slate-400">{c.sub}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
