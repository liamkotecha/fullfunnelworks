/**
 * LeadScoreBadge — displays a lead score with colour coding.
 * Score 0–40: grey · Score 41–70: amber · Score 71–100: green
 *
 * Variants:
 * - "compact": just the number, e.g. "78"
 * - "full": number + progress bar visual
 */
import { cn } from "@/lib/utils";

function getScoreColour(score: number) {
  if (score >= 71) return { bg: "bg-emerald-100", text: "text-emerald-700", bar: "bg-emerald-500" };
  if (score >= 41) return { bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" };
  return { bg: "bg-gray-100", text: "text-gray-600", bar: "bg-gray-400" };
}

export function LeadScoreBadge({
  score,
  variant = "compact",
}: {
  score: number;
  variant?: "compact" | "full";
}) {
  const colours = getScoreColour(score);

  if (variant === "full") {
    return (
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold",
            colours.bg,
            colours.text
          )}
        >
          {score}
        </span>
        <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-300", colours.bar)}
            style={{ width: `${Math.min(score, 100)}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-bold",
        colours.bg,
        colours.text
      )}
    >
      {score}
    </span>
  );
}
