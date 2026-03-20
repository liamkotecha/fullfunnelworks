/**
 * CompareTable — side-by-side comparison of base + all scenarios.
 * Rows: Revenue, Gross Profit, People cost, Overheads, EBITDA.
 */
"use client";

import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import { calcPL } from "@/lib/modeller/calc";
import type { PLResult, ModellerData } from "@/lib/modeller/calc";

interface Scenario {
  id: string;
  name: string;
  type: string;
  data: ModellerData;
}

interface CompareTableProps {
  basePL: PLResult;
  scenarios: Scenario[];
}

type RowDef = {
  label: string;
  getValue: (pl: PLResult) => number;
  showMargin?: (pl: PLResult) => string;
};

const ROWS: RowDef[] = [
  { label: "Revenue", getValue: (pl) => pl.totalRevenue },
  {
    label: "Gross Profit",
    getValue: (pl) => pl.grossProfit,
    showMargin: (pl) => `${pl.grossMargin.toFixed(1)}%`,
  },
  { label: "People cost", getValue: (pl) => pl.totalPeopleMonthly },
  { label: "Overheads", getValue: (pl) => pl.totalOverheads },
  {
    label: "EBITDA",
    getValue: (pl) => pl.ebitda,
    showMargin: (pl) => `${pl.ebitdaMargin.toFixed(1)}%`,
  },
];

export function CompareTable({ basePL, scenarios }: CompareTableProps) {
  const scenarioPLs = scenarios.map((s) => ({ ...s, pl: calcPL(s.data) }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left px-5 py-3 font-semibold text-slate-900 text-sm">Metric</th>
            <th className="text-right px-5 py-3 font-semibold text-slate-900 text-sm min-w-[120px]">
              Base
            </th>
            {scenarioPLs.map((s) => (
              <th
                key={s.id}
                className="text-right px-5 py-3 font-semibold text-slate-900 text-sm min-w-[140px]"
              >
                <span>{s.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {ROWS.map((row) => {
            const baseVal = row.getValue(basePL);
            const isEBITDA = row.label === "EBITDA";
            return (
              <tr key={row.label} className={isEBITDA ? "bg-gray-50/50" : ""}>
                <td
                  className={cn(
                    "px-5 py-3 text-slate-700",
                    isEBITDA && "font-semibold text-slate-900"
                  )}
                >
                  {row.label}
                </td>
                <td className="text-right px-5 py-3 tabular-nums font-medium text-slate-900">
                  {fmtGBP(baseVal)}
                  {row.showMargin && (
                    <span className="block text-xs text-slate-400">
                      {row.showMargin(basePL)}
                    </span>
                  )}
                </td>
                {scenarioPLs.map((s) => {
                  const val = row.getValue(s.pl);
                  const delta = val - baseVal;
                  const isPositive = delta >= 0;
                  return (
                    <td key={s.id} className="text-right px-5 py-3">
                      <span className="tabular-nums font-medium text-slate-900">
                        {fmtGBP(val)}
                      </span>
                      {row.showMargin && (
                        <span className="block text-xs text-slate-400">
                          {row.showMargin(s.pl)}
                        </span>
                      )}
                      {delta !== 0 && (
                        <span
                          className={cn(
                            "block text-xs font-semibold tabular-nums mt-0.5",
                            isPositive ? "text-emerald-600" : "text-red-600"
                          )}
                        >
                          {isPositive ? "▲" : "▼"} {fmtGBP(Math.abs(delta))}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
