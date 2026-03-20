/**
 * Number formatting helpers for the Financial Modeller.
 */

export const fmtGBP = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency", currency: "GBP", maximumFractionDigits: 0,
  }).format(n)

export const fmtPct = (n: number) =>
  `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`
