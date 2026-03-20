/**
 * calculateDivergence — measures how much team members disagreed on a question.
 * Returns a score from 0 (total consensus) to 1 (maximum disagreement).
 *
 * Rules:
 * - Slider/number questions: normalise range to 0–1, calculate variance
 * - Checkbox questions: percentage who checked vs not
 * - Text/textarea questions: if all answers are non-empty but different → 0.5 (moderate divergence)
 *   We cannot compare free text meaningfully without AI, so use presence/absence only
 * - 0 or 1 respondent: divergence = 0 (cannot calculate)
 */
export function calculateDivergence(
  values: unknown[],
  fieldType: "textarea" | "text" | "checkbox" | "slider" | "select"
): number {
  // Filter out null/undefined
  const defined = values.filter((v) => v !== null && v !== undefined);

  if (defined.length <= 1) return 0;

  switch (fieldType) {
    case "slider": {
      // Numeric values — variance-based
      const nums = defined
        .map((v) => (typeof v === "number" ? v : parseFloat(String(v))))
        .filter((n) => !isNaN(n));

      if (nums.length <= 1) return 0;

      // Normalise: find min/max range
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      if (max === min) return 0; // all identical

      // Normalise to 0–1
      const normalised = nums.map((n) => (n - min) / (max - min));
      const mean = normalised.reduce((a, b) => a + b, 0) / normalised.length;
      const variance =
        normalised.reduce((sum, n) => sum + (n - mean) ** 2, 0) / normalised.length;

      // Variance of uniform on [0,1] is 1/12 ≈ 0.083; max variance for 2 values is 0.25
      // Scale so max possible variance maps to 1
      return Math.min(1, variance * 4);
    }

    case "checkbox": {
      // Boolean — percentage disagreement
      const bools = defined.map((v) => v === true || v === "true" || v === 1);
      const checkedCount = bools.filter(Boolean).length;
      const ratio = checkedCount / bools.length;
      // 0 or 1 → full agreement. 0.5 → maximum divergence
      return 2 * Math.abs(ratio - 0.5) < 1 ? 1 - 2 * Math.abs(ratio - 0.5) : 0;
    }

    case "select": {
      // Categorical — proportion of most common answer
      const strings = defined.map(String);
      const counts: Record<string, number> = {};
      for (const s of strings) {
        counts[s] = (counts[s] ?? 0) + 1;
      }
      const maxCount = Math.max(...Object.values(counts));
      const agreement = maxCount / strings.length;
      // 1.0 agreement → 0 divergence; lower agreement → higher divergence
      return 1 - agreement;
    }

    case "text":
    case "textarea": {
      // Free text — presence/absence heuristic
      const nonEmpty = defined
        .map((v) => String(v).trim())
        .filter((s) => s.length > 0);

      if (nonEmpty.length === 0) return 0;
      if (nonEmpty.length === 1) return 0;

      // Check if all answers are identical
      const unique = new Set(nonEmpty);
      if (unique.size === 1) return 0;

      // All non-empty but different → moderate divergence
      return 0.5;
    }

    default:
      return 0;
  }
}
