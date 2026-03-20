/**
 * BreakEvenView — one card per hire showing break-even analysis.
 * Mini bar chart: cost vs gross contribution across 12 months, ramped.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import { calcHireMonthlyCost, calcBreakEven } from "@/lib/hiring/calc";
import { getDeptColor } from "@/lib/hiring/departments";
import type { Hire, HiringBase } from "@/lib/hiring/calc";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface BreakEvenViewProps {
  hires: Hire[];
  base: HiringBase;
}

export function BreakEvenView({ hires, base }: BreakEvenViewProps) {
  if (hires.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {hires.map((hire) => (
        <BreakEvenCard key={hire.id} hire={hire} grossMarginPct={base.grossMarginPct} />
      ))}
    </div>
  );
}

function BreakEvenCard({ hire, grossMarginPct }: { hire: Hire; grossMarginPct: number }) {
  const num = (v: unknown) => parseFloat(String(v)) || 0;
  const dept = getDeptColor(hire.department);
  const monthlyCost = calcHireMonthlyCost(num(hire.salary));
  const revContrib = num(hire.revenueContribution);
  const grossContrib = revContrib * (grossMarginPct / 100);
  const netMonthly = grossContrib - monthlyCost;
  const breakEvenMonth = calcBreakEven(hire, grossMarginPct);
  const isCostCentre = revContrib === 0;
  const startMonth = num(hire.startMonth);

  // Mini bar chart data: 12 months from hire's start
  const barData = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    if (month < startMonth) return { cost: 0, rev: 0 };
    const monthsActive = month - startMonth + 1;
    const rampFactor = Math.min(monthsActive / Math.max(num(hire.rampMonths), 1), 1);
    return {
      cost: monthlyCost,
      rev: grossContrib * rampFactor,
    };
  });
  const maxBar = Math.max(...barData.map((d) => Math.max(d.cost, d.rev)), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden">
      <div className={cn("h-1", dept.bg)} />
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <p className="font-serif text-sm font-semibold text-slate-900 truncate">
              {hire.role || "Untitled"}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", dept.light, dept.text)}>
                {hire.department || "—"}
              </span>
              <span className="text-[10px] text-slate-400">
                Joins {MONTH_LABELS[startMonth - 1] ?? "—"}
              </span>
            </div>
          </div>

          {/* Break-even badge */}
          <div className="flex-shrink-0 text-right">
            {isCostCentre ? (
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                Cost centre
              </span>
            ) : breakEvenMonth !== null ? (
              <div>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Break-even</p>
                <p className={cn(
                  "text-lg font-bold tabular-nums",
                  breakEvenMonth <= 12 ? "text-emerald-600" : "text-amber-600"
                )}>
                  M{breakEvenMonth}
                </p>
              </div>
            ) : (
              <span className="text-xs font-medium text-red-500">
                No break-even in 24mo
              </span>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatTile label="Monthly cost" value={fmtGBP(monthlyCost)} />
          <StatTile label="Revenue contrib." value={fmtGBP(revContrib)} />
          <StatTile label="Gross contrib." value={fmtGBP(grossContrib)} />
          <StatTile
            label="Net monthly"
            value={fmtGBP(netMonthly)}
            color={netMonthly >= 0 ? "text-emerald-600" : "text-red-600"}
          />
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-0.5 h-[48px]">
          {barData.map((d, i) => {
            const costH = (d.cost / maxBar) * 40;
            const revH = (d.rev / maxBar) * 40;
            return (
              <div key={i} className="flex-1 flex items-end gap-px justify-center">
                <div
                  className="w-[40%] rounded-t bg-brand-pink/50"
                  style={{ height: costH }}
                />
                <div
                  className="w-[40%] rounded-t bg-brand-green/50"
                  style={{ height: revH }}
                />
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1">
            <span className="w-2 h-1.5 rounded-sm bg-brand-pink/50" />
            <span className="text-[9px] text-slate-400">Cost</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-1.5 rounded-sm bg-brand-green/50" />
            <span className="text-[9px] text-slate-400">Gross contribution</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-2.5 py-1.5">
      <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-xs font-semibold tabular-nums", color ?? "text-slate-700")}>{value}</p>
    </div>
  );
}
