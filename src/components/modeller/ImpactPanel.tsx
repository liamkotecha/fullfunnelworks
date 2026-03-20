/**
 * ImpactPanel — right panel in scenario editor.
 * Shows delta vs base for: Revenue, Gross Profit, People, Overheads, EBITDA.
 * Break-even message when EBITDA delta is negative.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { PLResult } from "@/lib/modeller/calc";

interface ImpactPanelProps {
  basePL: PLResult;
  scenarioPL: PLResult;
  className?: string;
}

function DeltaRow({ label, base, scenario }: { label: string; base: number; scenario: number }) {
  const delta = scenario - base;
  const isPositive = delta >= 0;
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-slate-600">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-slate-900 tabular-nums">
          {fmtGBP(scenario)}
        </span>
        {delta !== 0 && (
          <span
            className={cn(
              "text-xs font-semibold tabular-nums",
              isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {isPositive ? "▲" : "▼"} {fmtGBP(Math.abs(delta))}
          </span>
        )}
      </div>
    </div>
  );
}

export function ImpactPanel({ basePL, scenarioPL, className }: ImpactPanelProps) {
  const ebitdaDelta = scenarioPL.ebitda - basePL.ebitda;
  const showBreakEven = ebitdaDelta < 0;

  // Break-even revenue needed to offset the negative EBITDA impact
  const breakEvenNeeded =
    scenarioPL.grossMargin > 0
      ? Math.abs(ebitdaDelta) / (scenarioPL.grossMargin / 100)
      : 0;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-card p-5", className)}>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">Impact vs Base</h3>

      <div className="divide-y divide-gray-100">
        <DeltaRow label="Revenue" base={basePL.totalRevenue} scenario={scenarioPL.totalRevenue} />
        <DeltaRow label="Gross Profit" base={basePL.grossProfit} scenario={scenarioPL.grossProfit} />
        <DeltaRow label="People cost" base={basePL.totalPeopleMonthly} scenario={scenarioPL.totalPeopleMonthly} />
        <DeltaRow label="Overheads" base={basePL.totalOverheads} scenario={scenarioPL.totalOverheads} />
      </div>

      {/* EBITDA highlight */}
      <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900">EBITDA</span>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              scenarioPL.ebitda >= 0 ? "text-emerald-600" : "text-red-600"
            )}
          >
            {fmtGBP(scenarioPL.ebitda)}
          </span>
          {ebitdaDelta !== 0 && (
            <span
              className={cn(
                "text-xs font-semibold tabular-nums",
                ebitdaDelta >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {ebitdaDelta >= 0 ? "▲" : "▼"} {fmtGBP(Math.abs(ebitdaDelta))}
            </span>
          )}
        </div>
      </div>

      {/* Break-even note */}
      {showBreakEven && breakEvenNeeded > 0 && (
        <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
          <p className="text-xs text-slate-500 leading-relaxed">
            To break even on this change:{" "}
            <span className="font-semibold text-slate-700">
              {fmtGBP(breakEvenNeeded)}
            </span>{" "}
            additional monthly revenue needed.
          </p>
        </div>
      )}
    </div>
  );
}
