import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "gold";

const variants: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  error:   "bg-red-50 text-red-700 border-red-200",
  info:    "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-700 border-gray-200",
  gold:    "bg-amber-50 text-amber-800 border-amber-300",
};

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
  dot?: boolean;
}

const DOT_COLORS: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error:   "bg-red-500",
  info:    "bg-blue-500",
  neutral: "bg-gray-400",
  gold:    "bg-amber-500",
};

export function Badge({ variant = "neutral", className, children, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", DOT_COLORS[variant])} />}
      {children}
    </span>
  );
}
