/**
 * ScenarioCard — compact card for the scenario list sidebar.
 * Shows name, type badge, EBITDA delta vs base.
 */
"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import { calcPL } from "@/lib/modeller/calc";
import type { ModellerData, PLResult } from "@/lib/modeller/calc";

type ScenarioType = "hire" | "price" | "revenue" | "client";

const TYPE_LABELS: Record<ScenarioType, string> = {
  hire: "New hire",
  price: "Price change",
  revenue: "Revenue",
  client: "Lose client",
};

const TYPE_COLORS: Record<ScenarioType, string> = {
  hire: "bg-amber-50 text-amber-700 border-amber-200",
  price: "bg-blue-50 text-blue-700 border-blue-200",
  revenue: "bg-brand-green/10 text-emerald-700 border-brand-green/30",
  client: "bg-red-50 text-red-700 border-red-200",
};

interface ScenarioCardProps {
  id: string;
  name: string;
  type: ScenarioType;
  data: ModellerData;
  basePL: PLResult;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ScenarioCard({
  id,
  name,
  type,
  data,
  basePL,
  isActive,
  onSelect,
  onDelete,
}: ScenarioCardProps) {
  const scenarioPL = calcPL(data);
  const delta = scenarioPL.ebitda - basePL.ebitda;
  const isPositive = delta >= 0;

  return (
    <button
      onClick={() => onSelect(id)}
      className={cn(
        "w-full text-left rounded-lg border p-3 transition-all duration-150",
        isActive
          ? "bg-navy text-white border-navy shadow-card"
          : "bg-white border-gray-200 hover:border-navy/30 hover:shadow-card"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-semibold truncate",
              isActive ? "text-white" : "text-slate-900"
            )}
          >
            {name}
          </p>
          <span
            className={cn(
              "inline-flex items-center mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
              isActive ? "bg-white/15 text-white/80 border-white/20" : TYPE_COLORS[type]
            )}
          >
            {TYPE_LABELS[type]}
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
          className={cn(
            "p-1 rounded transition-colors flex-shrink-0",
            isActive
              ? "hover:bg-white/10 text-white/60 hover:text-white"
              : "hover:bg-red-50 text-slate-400 hover:text-red-500"
          )}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* EBITDA delta */}
      <div className="mt-2 flex items-center gap-1">
        <span
          className={cn(
            "text-xs font-semibold tabular-nums",
            isActive
              ? isPositive ? "text-brand-green" : "text-brand-pink"
              : isPositive ? "text-emerald-600" : "text-red-600"
          )}
        >
          {isPositive ? "▲" : "▼"} {fmtGBP(Math.abs(delta))}
        </span>
        <span
          className={cn(
            "text-[10px]",
            isActive ? "text-white/50" : "text-slate-400"
          )}
        >
          EBITDA
        </span>
      </div>
    </button>
  );
}
