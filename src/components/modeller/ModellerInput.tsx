/**
 * ModellerInput — shared input component for the financial modeller.
 * Matches portal input styling exactly.
 */
"use client";

import { cn } from "@/lib/utils";

interface ModellerInputProps {
  value: string | number;
  onChange: (v: string) => void;
  prefix?: string;
  suffix?: string;
  type?: "number" | "text";
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export function ModellerInput({
  value,
  onChange,
  prefix,
  suffix,
  type = "number",
  placeholder,
  readOnly,
  className,
}: ModellerInputProps) {
  return (
    <div className="relative flex items-center">
      {prefix && (
        <span className="absolute left-2.5 text-xs text-slate-400 pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={cn(
          "w-full h-9 rounded-lg bg-white font-sans text-sm text-slate-900",
          "border border-gray-200 transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          readOnly && "bg-gray-50 cursor-default",
          prefix ? "pl-6 pr-3" : suffix ? "pl-3 pr-7" : "px-3",
          className
        )}
      />
      {suffix && (
        <span className="absolute right-2.5 text-xs text-slate-400 pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  );
}
