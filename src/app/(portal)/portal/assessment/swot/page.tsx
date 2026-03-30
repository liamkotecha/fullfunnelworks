/**
 * SWOT Analysis — one question at a time with dot navigator.
 * 4 quadrants × 5 questions = 20 total. Tab indicator shows current quadrant.
 * Textarea + weight select per question. Only textarea counts toward progress.
 */
"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import {
  SectionProgressHeader,
  AutosaveField,
  FieldCard,
  SectionGuidance,
  WhatsNext,
  TtsButton,
  TeamAssessmentBanner,
} from "@/components/framework";
import { ASSESSMENT_SECTION } from "@/lib/concept-map";
import { useQuestions } from "@/hooks/useQuestions";
import { isFieldAnswered } from "@/lib/framework-nav";
import { Skeleton } from "@/components/ui/Skeleton";

const WEIGHT_OPTIONS = [
  { value: "", label: "Select weight…" },
  { value: "1", label: "1 — Low importance" },
  { value: "2", label: "2" },
  { value: "3", label: "3 — Medium" },
  { value: "4", label: "4" },
  { value: "5", label: "5 — High importance" },
];

const QUADRANTS = [
  { key: "strengths" as const, label: "Strengths" },
  { key: "weaknesses" as const, label: "Weaknesses" },
  { key: "opportunities" as const, label: "Opportunities" },
  { key: "threats" as const, label: "Threats" },
];

export default function SwotPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const {
    responses,
    loading: responsesLoading,
    setLocalResponse,
    setLocalProgress,
  } = useResponses(clientId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [quadrantBanner, setQuadrantBanner] = useState<string | null>(null);
  const [sectionComplete, setSectionComplete] = useState(false);
  const [hasAutoInit, setHasAutoInit] = useState(false);

  const swot = ASSESSMENT_SECTION.swot;

  const { grouped, loading: questionsLoading } = useQuestions("assessment", "swot");

  // Build allQuestions from DB, preserving quadrant order
  const allQuestions = useMemo(() => {
    return QUADRANTS.flatMap(({ key }) =>
      (grouped[key] ?? []).map((q) => ({
        id: q.fieldId,
        question: q.question,
        weightId: q.weightFieldId ?? "",
        quadrant: key,
      }))
    );
  }, [grouped]);

  // Quadrant boundary info for dynamic navigation
  const quadrantBounds = useMemo(() => {
    let offset = 0;
    return QUADRANTS.map(({ key }) => {
      const count = (grouped[key] ?? []).length;
      const start = offset;
      offset += count;
      return { key, start, count };
    });
  }, [grouped]);

  const totalCount = allQuestions.length;

  // Which quadrant is the current question in?
  const currentQuadrantIndex = useMemo(() => {
    let running = 0;
    for (let qi = 0; qi < quadrantBounds.length; qi++) {
      running += quadrantBounds[qi].count;
      if (currentIndex < running) return qi;
    }
    return quadrantBounds.length - 1;
  }, [currentIndex, quadrantBounds]);

  const currentQuadrant = QUADRANTS[currentQuadrantIndex];
  const currentBound = quadrantBounds[currentQuadrantIndex];
  const questionInQuadrant = currentIndex - (currentBound?.start ?? 0);

  const answeredStatus = useMemo(() => {
    return allQuestions.map((q) => isFieldAnswered(q.id, responses[q.id]));
  }, [allQuestions, responses]);

  const totalAnswered = answeredStatus.filter(Boolean).length;

  // Auto-jump to first unanswered question on load
  useEffect(() => {
    if (!responsesLoading && !questionsLoading && !hasAutoInit && totalCount > 0) {
      const firstUnanswered = answeredStatus.findIndex((a) => !a);
      if (firstUnanswered === -1) {
        setSectionComplete(true);
      } else {
        setCurrentIndex(firstUnanswered);
      }
      setHasAutoInit(true);
    }
  }, [responsesLoading, questionsLoading, hasAutoInit, answeredStatus, totalCount]);

  const quadrantCounts = useMemo(() => {
    return quadrantBounds.map(({ start, count }) => {
      return answeredStatus.slice(start, start + count).filter(Boolean).length;
    });
  }, [answeredStatus, quadrantBounds]);

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= totalCount) return;
      setDirection(nextIdx > currentIndex ? 1 : -1);
      setCurrentIndex(nextIdx);
    },
    [currentIndex, totalCount]
  );

  const handleNext = useCallback(() => {
    const qSize = currentBound?.count ?? 0;
    const isLastInQ = questionInQuadrant === qSize - 1;
    const isLast = currentIndex === totalCount - 1;

    if (isLast) {
      if (totalAnswered === totalCount) setSectionComplete(true);
      return;
    }

    if (isLastInQ) {
      const qStart = currentBound.start;
      const qDone =
        answeredStatus.slice(qStart, qStart + qSize).filter(Boolean).length === qSize;

      if (qDone) {
        setQuadrantBanner(currentQuadrant.label);
        setTimeout(() => {
          setQuadrantBanner(null);
          setDirection(1);
          setCurrentIndex(currentIndex + 1);
        }, 1500);
        return;
      }
    }

    goTo(currentIndex + 1);
  }, [
    currentIndex,
    questionInQuadrant,
    currentBound,
    answeredStatus,
    currentQuadrant,
    totalAnswered,
    totalCount,
    goTo,
  ]);

  const handlePrev = useCallback(
    () => goTo(currentIndex - 1),
    [goTo, currentIndex]
  );

  const loading = clientLoading || responsesLoading || questionsLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">
          No client profile found. Please contact your consultant.
        </p>
      </div>
    );
  }

  const currentQuestion = allQuestions[currentIndex];
  const qSize = currentBound?.count ?? 0;
  const isLastInQuadrant = questionInQuadrant === qSize - 1;
  const isLastQuestion = currentIndex === totalCount - 1;
  const nextQuadrantLabel =
    currentQuadrantIndex < 3 ? QUADRANTS[currentQuadrantIndex + 1].label : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/portal/assessment"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Assessment
      </Link>
      <SectionProgressHeader
        title="SWOT Analysis"
        answeredCount={totalAnswered}
        totalCount={totalCount}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-6">
        <SectionGuidance intro={swot.intro} estimatedMinutes={40} />

      {sectionComplete ? (
        <WhatsNext
          completedTitle="SWOT Analysis"
          nextTitle="MOST Analysis"
          nextHref="/portal/assessment/most"
          nextDescription="20 questions · ~40 mins"
          onReview={() => { setSectionComplete(false); setCurrentIndex(0); }}
        />
      ) : (
        <>
          {/* Quadrant tabs — dark pill selector */}
          <div className="flex gap-1 bg-[#141414] rounded-lg p-1">
            {QUADRANTS.map((q, qi) => {
              const isActive = qi === currentQuadrantIndex;
              const count = quadrantCounts[qi];
              const qBound = quadrantBounds[qi];
              const complete = count === qBound.count;
              return (
                <button
                  key={q.key}
                  onClick={() => goTo(quadrantBounds[qi].start)}
                  className={cn(
                    "relative flex-1 py-2 px-1.5 text-xs font-medium transition-colors text-center rounded-lg z-10",
                    isActive ? "text-white" : "text-white/45 hover:text-white/75"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="swot-tab-bg"
                      className="absolute inset-0 rounded-lg bg-white/15"
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}
                  <span className="relative z-10">{q.label}</span>
                  {complete ? (
                    <span className="relative z-10 ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand-green flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-[#141414]" />
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "relative z-10 ml-1 text-xs",
                        count > 0 ? "text-brand-blue" : "text-white/25"
                      )}
                    >
                      {count}/{qBound.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quadrant completion banner */}
          <AnimatePresence>
            {quadrantBanner && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg bg-brand-green/10 border border-brand-green/30 px-4 py-3 text-sm font-medium text-brand-green"
              >
                <span className="flex items-center justify-center gap-1.5">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  {quadrantBanner} complete — moving to {nextQuadrantLabel}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Question nav — label + dots + counter, single row */}
          <div className="flex items-center justify-between gap-4">
            <span className="type-overline truncate flex-1 min-w-0">
              {currentQuadrant.label} — {swot[currentQuadrant.key].subtitle}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {Array.from({ length: qSize }, (_, i) => {
                const globalIdx = (currentBound?.start ?? 0) + i;
                const isCurrent = globalIdx === currentIndex;
                const isAnswered = answeredStatus[globalIdx];
                return (
                  <button
                    key={i}
                    onClick={() => goTo(globalIdx)}
                    aria-label={`Go to question ${i + 1}`}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-200",
                      isCurrent
                        ? "bg-slate-400"
                        : "bg-slate-200"
                    )}
                  />
                );
              })}
              <span className="type-meta pl-1.5">
                {questionInQuadrant + 1}/{qSize}
              </span>
            </div>
          </div>

          {/* Question card with slide animation */}
          <div className="relative overflow-hidden">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ x: direction * 60, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: direction * -60, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <AutosaveField
                  fieldId={currentQuestion.id}
                  clientId={clientId}
                  section="assessment"
                  sub="swot"
                  initialValue={
                    (responses[currentQuestion.id] as string) ?? ""
                  }
                  onSaveSuccess={(result) =>
                    setLocalProgress("assessment-swot", result)
                  }
                >
                  {({
                    value,
                    onChange,
                    isSaving,
                    isSaved,
                    hasError,
                    retry,
                  }) => (
                    <FieldCard
                      fieldId={currentQuestion.id}
                      isAnswered={isFieldAnswered(currentQuestion.id, value)}
                      isSaving={isSaving}
                      isSaved={isSaved}
                      hasError={hasError}
                      onRetry={retry}
                      className="min-h-[220px]"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <label className="block type-label">
                            {currentQuestion.question}
                          </label>
                          <TtsButton text={currentQuestion.question} />
                        </div>
                        <textarea
                          value={value}
                          onChange={(e) => {
                            onChange(e.target.value);
                            setLocalResponse(
                              currentQuestion.id,
                              e.target.value
                            );
                          }}
                          placeholder="Type your response…"
                          rows={4}
                          className="textarea-field"
                        />

                        {/* Weight select */}
                        <AutosaveField
                          fieldId={currentQuestion.weightId}
                          clientId={clientId}
                          section="assessment"
                          sub="swot"
                          initialValue={
                            (responses[currentQuestion.weightId] as string) ??
                            ""
                          }
                          onSaveSuccess={(result) =>
                            setLocalProgress("assessment-swot", result)
                          }
                        >
                          {({ value: wVal, onChange: wOnChange }) => (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-500 flex-shrink-0">
                                Importance:
                              </span>
                              <select
                                value={wVal}
                                onChange={(e) => {
                                  wOnChange(e.target.value);
                                  setLocalResponse(
                                    currentQuestion.weightId,
                                    e.target.value
                                  );
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
                              >
                                {WEIGHT_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </AutosaveField>
                      </div>
                    </FieldCard>
                  )}
                </AutosaveField>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                currentIndex === 0
                  ? "border-slate-100 text-slate-300 cursor-not-allowed"
                  : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <div className="flex items-center gap-2">
              {!isLastQuestion && (
                <button
                  onClick={() => goTo(currentIndex + 1)}
                  className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-all"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleNext}
                className={cn(
                  "flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all",
                  isLastInQuadrant || isLastQuestion
                    ? "bg-[#141414] text-white hover:opacity-90"
                    : "bg-[#141414] text-white hover:bg-slate-800"
                )}
              >
                {isLastQuestion ? "Complete SWOT" : isLastInQuadrant ? `Next: ${nextQuadrantLabel}` : "Next question"}
                {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic text-center">
            {swot.weightingNote}
          </p>
        </>
      )}
      </div>

      <TeamAssessmentBanner clientId={clientId} />
    </div>
  );
}
