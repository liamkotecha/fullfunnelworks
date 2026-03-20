/**
 * HiringKPIStrip — five stat cards for hiring plan overview.
 * Planned hires, Total hiring costs, Annual new people cost, M12 EBITDA, EBITDA change.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { Hire, MonthResult } from "@/lib/hiring/calc";
import { calcHireMonthlyCost } from "@/lib/hiring/calc";

interface HiringKPIStripProps {
  hires: Hire[];
  months: MonthResult[];
}

export function HiringKPIStrip({ hires, months }: HiringKPIStripProps) {
  const num = (v: unknown) => parseFloat(String(v)) || 0;

  const totalHiringCosts = hires.reduce((s, h) => s + num(h.hiringCost), 0);
  const annualPeopleCost = hires.reduce(
    (s, h) => s + calcHireMonthlyCost(num(h.salary)) * 12,
    0
  );
  const m1 = months[0];
  const m12 = months[11];
  const ebitdaChange = m12 && m1 ? m12.ebitda - m1.ebitda : 0;

  const cards = [
    { label: "Planned Hires", value: String(hires.length), sub: null },
    { label: "Hiring Costs", value: fmtGBP(totalHiringCosts), sub: "one-off" },
    { label: "Annual People Cost", value: fmtGBP(annualPeopleCost), sub: "new hires" },
    {
      label: "Month 12 EBITDA",
      value: m12 ? fmtGBP(m12.ebitda) : "—",
      sub: m12 ? `${m12.ebitdaMargin.toFixed(1)}%` : null,
      color: m12 && m12.ebitda >= 0 ? "green" as const : "red" as const,
    },
    {
      label: "EBITDA Change",
      value: fmtGBP(ebitdaChange),
      sub: "M1 → M12",
      color: ebitdaChange >= 0 ? "green" as const : "red" as const,
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
                c.color === "green" && "text-emerald-600",
                c.color === "red" && "text-red-600",
                !c.color && "text-slate-900"
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
