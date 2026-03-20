/**
 * StepperNav — horizontal step navigation for GTM Market Intelligence.
 * Shows numbered circles with completion state + previous/next buttons.
 */
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepInfo {
  id: string;
  label: string;
  answeredCount: number;
  totalCount: number;
}

interface StepperNavProps {
  steps: StepInfo[];
  activeStepIndex?: number;
  onStepChange?: (index: number) => void;
  /** Render the content for the currently active step */
  children: (index: number) => React.ReactNode;
  className?: string;
}

export function StepperNav({
  steps,
  activeStepIndex,
  onStepChange,
  children,
  className,
}: StepperNavProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const index = activeStepIndex ?? internalIndex;
  const total = steps.length;
  const current = steps[index];

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= total) return;
      setDirection(nextIdx > index ? 1 : -1);
      setInternalIndex(nextIdx);
      onStepChange?.(nextIdx);
    },
    [index, onStepChange, total]
  );

  return (
    <div className={className}>
      {/* Stepper circles — full on desktop, compact on mobile */}
      <div className="flex items-center justify-center gap-0 mb-6">
        {steps.map((step, i) => {
          const percent = step.totalCount ? Math.round((step.answeredCount / step.totalCount) * 100) : 0;
          const status = percent >= 100 ? "complete" : percent > 0 ? "partial" : "empty";
          const isCurrent = i === index;

          return (
            <div key={step.id} className="flex items-center">
              {/* Circle */}
              <button
                onClick={() => goTo(i)}
                aria-label={`Go to ${step.label}`}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2",
                  isCurrent && "ring-2 ring-offset-2",
                  status === "complete"
                    ? "border-brand-green bg-brand-green text-[#141414] ring-brand-green/30"
                    : status === "partial"
                      ? "border-amber-400 bg-amber-50 text-amber-700 ring-amber-200"
                      : isCurrent
                        ? "border-brand-blue bg-brand-blue/10 text-brand-blue ring-brand-blue/20"
                        : "border-slate-300 bg-white text-slate-500 ring-transparent"
                )}
              >
                {status === "complete" ? <Check className="w-4 h-4" /> : i + 1}
              </button>

              {/* Connector line */}
              {i < total - 1 && (
                <div className="w-6 sm:w-10 h-0.5 bg-slate-200 hidden sm:block">
                  <div
                    className={cn(
                      "h-full transition-all duration-300",
                      status === "complete" ? "bg-brand-green w-full" : "bg-transparent w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current step info */}
      <div className="text-center mb-4">
        <h3 className="type-question">{current?.label}</h3>
        <p className="type-sub mt-0.5">
          Section {index + 1} of {total}
          {current && ` · ${current.answeredCount} of ${current.totalCount} questions answered`}
        </p>
      </div>

      {/* Content with slide animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction * 40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -40, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children(index)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            index === 0
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous section
        </button>
        <button
          onClick={() => goTo(index + 1)}
          disabled={index === total - 1}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            index === total - 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-brand-blue hover:bg-brand-blue/5"
          )}
        >
          Next section
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
