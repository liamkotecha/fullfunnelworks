/**
 * PLSummary — right-sidebar P&L summary with waterfall breakdown.
 * Revenue → COGS → Gross Profit → People → Overheads → OpEx → EBITDA.
 */
"use client";

import { useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import type { PLResult } from "@/lib/modeller/calc";

const ABBREVIATIONS = [
  { abbr: "P&L",    full: "Profit & Loss" },
  { abbr: "COGS",   full: "Cost of Goods Sold" },
  { abbr: "EBITDA", full: "Earnings Before Interest, Tax, Depreciation & Amortisation" },
  { abbr: "OpEx",   full: "Operating Expenditure" },
  { abbr: "NI",     full: "National Insurance (13.8% employer contribution)" },
  { abbr: "/mo",    full: "Per month" },
  { abbr: "eq.",    full: "Equivalent (monthly equivalent of an annual figure)" },
];

interface PLSummaryProps {
  pl: PLResult;
  className?: string;
}

function Row({
  label,
  value,
  bold,
  color,
  separator,
}: {
  label: string;
  value: number;
  bold?: boolean;
  color?: "green" | "red" | "muted";
  separator?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-1.5 text-sm",
        separator && "border-t border-gray-200 pt-2.5 mt-1.5"
      )}
    >
      <span className={cn(bold ? "font-semibold text-slate-900" : "text-slate-600")}>
        {label}
      </span>
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

export function PLSummary({ pl, className }: PLSummaryProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-card p-5", className)}>
      <h3 className="text-sm font-semibold text-slate-900 mb-3">P&L Summary</h3>

      <Row label="Revenue" value={pl.totalRevenue} />
      <Row label="Cost of goods" value={-pl.totalCOGS} color="muted" />
      <Row label="Gross Profit" value={pl.grossProfit} bold separator />

      <div className="mt-2" />
      <Row label="People cost" value={-pl.totalPeopleMonthly} />
      <Row label="Overheads" value={-pl.totalOverheads} />
      <Row label="Total OpEx" value={-pl.totalOpex} bold separator />

      <div className="mt-2" />
      <Row
        label="EBITDA"
        value={pl.ebitda}
        bold
        color={pl.ebitda >= 0 ? "green" : "red"}
        separator
      />

      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Break-even revenue</span>
          <span className="font-semibold text-slate-700 tabular-nums">
            {fmtGBP(pl.breakEven)}/mo
          </span>
        </div>
      </div>

      {/* Abbreviations legend */}
      <AbbreviationsLegend />
    </div>
  );
}

function AbbreviationsLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 transition-colors"
      >
        {open ? <X className="w-3.5 h-3.5" /> : <Info className="w-3.5 h-3.5" />}
        <span>{open ? "Hide abbreviations" : "Abbreviations"}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-1">
          {ABBREVIATIONS.map((a) => (
            <div key={a.abbr} className="text-xs text-slate-600">
              <span className="font-semibold text-slate-900">{a.abbr}</span>{" "}
              — {a.full}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
