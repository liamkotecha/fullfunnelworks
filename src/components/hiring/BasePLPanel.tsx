/**
 * BasePLPanel — sticky right panel showing base P&L + source toggle.
 * Month 12 projection summary + first profitable month card.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import { ModellerInput } from "@/components/modeller/ModellerInput";
import type { HiringBase, MonthResult } from "@/lib/hiring/calc";
import Link from "next/link";

interface BasePLPanelProps {
  base: HiringBase;
  setBase: (base: HiringBase) => void;
  useModeller: boolean;
  toggleSource: () => void;
  months: MonthResult[];
  modellerLoaded: boolean;
  readOnly?: boolean;
  className?: string;
}

export function BasePLPanel({
  base,
  setBase,
  useModeller,
  toggleSource,
  months,
  modellerLoaded,
  readOnly,
  className,
}: BasePLPanelProps) {
  const m12 = months[11];
  const firstProfitable = months.find((m) => m.ebitda > 0);

  const updateField = (field: keyof HiringBase, value: string) => {
    setBase({ ...base, [field]: parseFloat(value) || 0 });
  };

  const noModellerData = useModeller && !modellerLoaded;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-card p-5", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-900">Base P&L</h3>
        {!readOnly && (
          <button
            onClick={toggleSource}
            className="text-xs font-medium text-slate-500 hover:text-navy transition-colors"
          >
            {useModeller ? "Manual override →" : "← From Modeller"}
          </button>
        )}
      </div>

      {/* No modeller data warning */}
      {noModellerData && (
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-700 leading-relaxed">
            No Financial Modeller data found. Switch to manual override or{" "}
            <Link href="/portal/modeller" className="underline font-medium">
              complete your base model
            </Link>{" "}
            first.
          </p>
        </div>
      )}

      {/* Source label */}
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
        {useModeller ? "From Financial Modeller" : "Manual override"}
      </p>

      {/* Base fields */}
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1 block">Monthly revenue</label>
          <ModellerInput
            value={base.monthlyRevenue}
            onChange={(v) => updateField("monthlyRevenue", v)}
            prefix="£"
            readOnly={readOnly || useModeller}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1 block">Gross margin %</label>
          <ModellerInput
            value={base.grossMarginPct}
            onChange={(v) => updateField("grossMarginPct", v)}
            suffix="%"
            readOnly={readOnly}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1 block">People cost (monthly)</label>
          <ModellerInput
            value={base.existingPeopleMonthly}
            onChange={(v) => updateField("existingPeopleMonthly", v)}
            prefix="£"
            readOnly={readOnly || useModeller}
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1 block">Monthly overheads</label>
          <ModellerInput
            value={base.monthlyOverheads}
            onChange={(v) => updateField("monthlyOverheads", v)}
            prefix="£"
            readOnly={readOnly || useModeller}
          />
        </div>
      </div>

      {/* Month 12 projection */}
      {m12 && (
        <div className="mt-5 pt-4 border-t border-dashed border-gray-200">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
            Month 12 projection
          </p>
          <div className="space-y-1.5">
            <SummaryRow label="Revenue" value={m12.totalRevenue} />
            <SummaryRow label="Gross Profit" value={m12.grossProfit} />
            <SummaryRow label="All People" value={m12.totalPeople} />
            <SummaryRow label="All Overheads" value={m12.totalOverheads} />
            <SummaryRow
              label="EBITDA"
              value={m12.ebitda}
              bold
              color={m12.ebitda >= 0 ? "green" : "red"}
            />
          </div>
        </div>
      )}

      {/* First profitable month */}
      {firstProfitable ? (
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
          <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mb-1">
            First profitable month
          </p>
          <p className="text-lg font-bold text-emerald-700">{firstProfitable.label}</p>
          <p className="text-xs text-emerald-600 tabular-nums">
            EBITDA {fmtGBP(firstProfitable.ebitda)}
          </p>
        </div>
      ) : months.length > 0 ? (
        <p className="mt-4 text-xs text-slate-400 italic">
          Plan does not reach profitability within 12 months
        </p>
      ) : null}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: number;
  bold?: boolean;
  color?: "green" | "red";
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn(bold ? "font-semibold text-slate-900" : "text-slate-600")}>{label}</span>
      <span
        className={cn(
          "tabular-nums font-medium",
          bold && "font-bold",
          color === "green" && "text-emerald-600",
          color === "red" && "text-red-600",
          !color && "text-slate-900"
        )}
      >
        {fmtGBP(value)}
      </span>
    </div>
  );
}
