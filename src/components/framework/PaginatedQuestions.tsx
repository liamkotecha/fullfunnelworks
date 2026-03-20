/**
 * PaginatedQuestions — one-at-a-time card with dot navigator.
 * Used for Leadership Questions (10 questions, one visible at a time).
 */
"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PaginatedQuestion {
  id: string;
  isAnswered: boolean;
}

interface PaginatedQuestionsProps {
  questions: PaginatedQuestion[];
  /** Currently visible question index (0-based) */
  activeIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Renders the question card content for the given index */
  children: (index: number) => React.ReactNode;
  className?: string;
}

export function PaginatedQuestions({
  questions,
  activeIndex: controlledIndex,
  onIndexChange,
  children,
  className,
}: PaginatedQuestionsProps) {
  const [internalIndex, setInternalIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const index = controlledIndex ?? internalIndex;
  const total = questions.length;

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= total) return;
      setDirection(nextIdx > index ? 1 : -1);
      setInternalIndex(nextIdx);
      onIndexChange?.(nextIdx);
    },
    [index, onIndexChange, total]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  // Jump to first unanswered
  const firstUnansweredIdx = useMemo(
    () => questions.findIndex((q) => !q.isAnswered),
    [questions]
  );

  const jumpToUnanswered = useCallback(() => {
    if (firstUnansweredIdx >= 0) goTo(firstUnansweredIdx);
  }, [firstUnansweredIdx, goTo]);

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-slate-600">
          Question {index + 1} of {total}
        </span>
        {firstUnansweredIdx >= 0 && firstUnansweredIdx !== index && (
          <button
            onClick={jumpToUnanswered}
            className="flex items-center gap-1 text-xs font-medium text-brand-blue hover:text-brand-blue/80 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Jump to unanswered
          </button>
        )}
      </div>

      {/* Dot navigator */}
      <div className="flex items-center justify-center gap-2 mb-6">
        {questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => goTo(i)}
            aria-label={`Go to question ${i + 1}`}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-200 border-2",
              i === index
                ? "border-brand-blue bg-brand-blue scale-125"
                : q.isAnswered
                  ? "border-brand-green bg-brand-green"
                  : "border-slate-300 bg-white hover:border-slate-400"
            )}
          />
        ))}
      </div>

      {/* Question card with slide animation */}
      <div className="relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={index}
            custom={direction}
            initial={{ x: direction * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -60, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children(index)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={index === 0}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            index === 0
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>
        <button
          onClick={goNext}
          disabled={index === total - 1}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            index === total - 1
              ? "text-slate-300 cursor-not-allowed"
              : "text-slate-600 hover:bg-slate-100"
          )}
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
