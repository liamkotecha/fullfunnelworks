"use client";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "gold" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary:   "bg-brand-blue text-[#141414] hover:bg-brand-blue/90 focus-visible:ring-brand-blue/40",
  secondary: "bg-white border border-slate-200 text-[#141414] hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-300/40",
  gold:      "bg-gold text-[#141414] hover:bg-gold-dark focus-visible:ring-gold/40",
  danger:    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40",
  ghost:     "bg-transparent text-[#141414] hover:bg-slate-100 focus-visible:ring-slate-300/40",
};

const sizes = {
  sm:  "px-3 py-1.5 text-xs gap-1.5",
  md:  "px-4 py-2.5 text-sm gap-2",
  lg:  "px-5 py-3 text-base gap-2.5",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);
Button.displayName = "Button";
