/**
 * HireCard — editable card for a single planned hire.
 * Coloured top border by department, inline inputs for all fields.
 */
"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtGBP } from "@/lib/modeller/format";
import { calcHireMonthlyCost } from "@/lib/hiring/calc";
import { DEPARTMENTS, getDeptColor } from "@/lib/hiring/departments";
import { ModellerInput } from "@/components/modeller/ModellerInput";
import type { Hire } from "@/lib/hiring/calc";

const MONTH_OPTIONS = [
  { value: 1, label: "Jan" }, { value: 2, label: "Feb" }, { value: 3, label: "Mar" },
  { value: 4, label: "Apr" }, { value: 5, label: "May" }, { value: 6, label: "Jun" },
  { value: 7, label: "Jul" }, { value: 8, label: "Aug" }, { value: 9, label: "Sep" },
  { value: 10, label: "Oct" }, { value: 11, label: "Nov" }, { value: 12, label: "Dec" },
];

interface HireCardProps {
  hire: Hire;
  onChange: (field: keyof Hire, value: string | number) => void;
  onRemove: () => void;
  readOnly?: boolean;
}

export function HireCard({ hire, onChange, onRemove, readOnly }: HireCardProps) {
  const dept = getDeptColor(hire.department);
  const monthlyCost = calcHireMonthlyCost(parseFloat(String(hire.salary)) || 0);
  const annualTotal = monthlyCost * 12;

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 shadow-card overflow-hidden")}>
      <div className="p-5">
        {/* Top row: role name + monthly cost */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {readOnly ? (
              <p className="font-serif text-lg font-semibold text-slate-900 truncate">
                {hire.role || "Untitled role"}
              </p>
            ) : (
              <input
                type="text"
                value={hire.role}
                onChange={(e) => onChange("role", e.target.value)}
                placeholder="Role title"
                className="w-full font-serif text-lg font-semibold text-slate-900 bg-transparent border-0 outline-none placeholder:text-slate-300 focus:ring-0 p-0"
              />
            )}
            {/* Department selector */}
            <div className="mt-1">
              {readOnly ? (
                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", dept.light, dept.text)}>
                  {hire.department || "No department"}
                </span>
              ) : (
                <select
                  value={hire.department}
                  onChange={(e) => onChange("department", e.target.value)}
                  className={cn(
                    "text-xs font-semibold rounded-full border-0 cursor-pointer",
                    "px-2 py-0.5 outline-none focus:ring-2 focus:ring-navy/20",
                    dept.light, dept.text
                  )}
                >
                  <option value="">Select dept</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Monthly cost (read-only) */}
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-slate-500 mb-0.5">Monthly cost</p>
            <p className="text-lg font-bold text-slate-900 tabular-nums">
              {fmtGBP(monthlyCost)}
            </p>
          </div>
        </div>

        {/* Input grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Start month */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Start month</label>
            {readOnly ? (
              <p className="text-sm text-slate-700 h-9 flex items-center">
                {MONTH_OPTIONS.find((m) => m.value === hire.startMonth)?.label ?? "—"}
              </p>
            ) : (
              <select
                value={hire.startMonth}
                onChange={(e) => onChange("startMonth", parseInt(e.target.value))}
                className="w-full h-9 rounded-lg bg-white border border-slate-200 text-sm text-slate-700 px-3 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            )}
          </div>

          {/* Annual salary */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Annual salary</label>
            <ModellerInput
              value={hire.salary}
              onChange={(v) => onChange("salary", v)}
              prefix="£"
              readOnly={readOnly}
            />
          </div>

          {/* Hiring cost */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Hiring cost</label>
            <ModellerInput
              value={hire.hiringCost}
              onChange={(v) => onChange("hiringCost", v)}
              prefix="£"
              readOnly={readOnly}
            />
          </div>

          {/* Revenue contribution */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Revenue (£/mo)</label>
            <ModellerInput
              value={hire.revenueContribution}
              onChange={(v) => onChange("revenueContribution", v)}
              prefix="£"
              readOnly={readOnly}
            />
          </div>

          {/* Ramp period */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Ramp (months)</label>
            <ModellerInput
              value={hire.rampMonths}
              onChange={(v) => onChange("rampMonths", v)}
              readOnly={readOnly}
            />
          </div>

          {/* Annual total (read-only) */}
          <div>
            <label className="text-xs text-slate-500 font-medium mb-1 block">Annual total</label>
            <p className="h-9 flex items-center text-sm font-semibold text-slate-700 tabular-nums bg-gray-50 rounded-lg px-3">
              {fmtGBP(annualTotal)}
            </p>
          </div>
        </div>

        {/* Remove button */}
        {!readOnly && (
          <div className="flex justify-end mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={onRemove}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
