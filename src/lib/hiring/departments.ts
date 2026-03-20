/**
 * Department list and colour map for the Hiring Plan Modeller.
 * Colours derived from existing Tailwind palette tokens.
 */

export const DEPARTMENTS = [
  "Sales",
  "Marketing",
  "Engineering",
  "Operations",
  "Finance",
  "Customer Success",
  "Product",
  "HR",
  "Leadership",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/**
 * Each department maps to a Tailwind colour class prefix.
 * Usage: `bg-${colour}`, `border-${colour}`, `text-${colour}` etc.
 */
export const DEPT_COLOR: Record<string, { bg: string; border: string; text: string; light: string }> = {
  Sales:             { bg: "bg-brand-blue",         border: "border-brand-blue",         text: "text-brand-blue",         light: "bg-brand-blue/15" },
  Marketing:         { bg: "bg-brand-pink",         border: "border-brand-pink",         text: "text-brand-pink",         light: "bg-brand-pink/15" },
  Engineering:       { bg: "bg-navy-400",           border: "border-navy-400",           text: "text-navy-400",           light: "bg-navy-400/15" },
  Operations:        { bg: "bg-amber-400",          border: "border-amber-400",          text: "text-amber-600",          light: "bg-amber-50" },
  Finance:           { bg: "bg-brand-green",        border: "border-brand-green",        text: "text-emerald-600",        light: "bg-brand-green/15" },
  "Customer Success":{ bg: "bg-purple-400",         border: "border-purple-400",         text: "text-purple-600",         light: "bg-purple-50" },
  Product:           { bg: "bg-gold",               border: "border-gold",               text: "text-gold-dark",          light: "bg-gold/15" },
  HR:                { bg: "bg-rose-400",           border: "border-rose-400",           text: "text-rose-600",           light: "bg-rose-50" },
  Leadership:        { bg: "bg-slate-500",          border: "border-slate-500",          text: "text-slate-600",          light: "bg-slate-100" },
};

export function getDeptColor(dept: string) {
  return DEPT_COLOR[dept] ?? DEPT_COLOR["Sales"];
}
