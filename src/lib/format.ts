/**
 * Format pence (GBP) to a human-readable currency string.
 * e.g. 125000 → "£1,250"
 */
export function formatPence(pence: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(pence / 100);
}
