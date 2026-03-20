/**
 * Leadership Questions — one question at a time with dot navigator.
 * Matches the MOST Analysis interaction pattern.
 */
"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function LeadershipPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const {
    responses,
    loading: responsesLoading,
    setLocalResponse,
    setLocalProgress,
  } = useResponses(clientId);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [sectionComplete, setSectionComplete] = useState(false);
  const [hasAutoInit, setHasAutoInit] = useState(false);

  const { questions: dbQuestions, loading: questionsLoading } = useQuestions("assessment", "leadership");

  const questions = useMemo(
    () => dbQuestions.map((q) => ({ id: q.fieldId, question: q.question, subPrompt: q.subPrompt ?? "" })),
    [dbQuestions]
  );

  const totalCount = questions.length;

  const answeredStatus = useMemo(
    () => questions.map((q) => isFieldAnswered(q.id, responses[q.id])),
    [questions, responses]
  );

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

  const goTo = useCallback(
    (nextIdx: number) => {
      if (nextIdx < 0 || nextIdx >= totalCount) return;
      setDirection(nextIdx > currentIndex ? 1 : -1);
      setCurrentIndex(nextIdx);
    },
    [currentIndex, totalCount]
  );

  const handleNext = useCallback(() => {
    const isLast = currentIndex === totalCount - 1;
    if (isLast) {
      if (totalAnswered === totalCount) setSectionComplete(true);
      return;
    }
    goTo(currentIndex + 1);
  }, [currentIndex, totalCount, totalAnswered, goTo]);

  const handlePrev = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

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
        <p className="text-slate-500">No client profile found. Please contact your consultant.</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === totalCount - 1;

  return (
    <div className="max-w-2xl mx-auto">
      <SectionProgressHeader
        title="Leadership Questions"
        answeredCount={totalAnswered}
        totalCount={totalCount}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-6">
        <SectionGuidance
          intro={ASSESSMENT_SECTION.leadershipQuestions.intro}
          estimatedMinutes={20}
        />

        {sectionComplete ? (
          <WhatsNext
            completedTitle="Leadership Questions"
            nextTitle="People Development"
            nextHref="/portal/people"
            nextDescription="Build capability and confidence within the team"
            onReview={() => { setSectionComplete(false); setCurrentIndex(0); }}
          />
        ) : (
          <>
            {/* Dot navigator + counter */}
            <div className="flex items-center justify-between gap-4">
              <span className="type-overline truncate flex-1 min-w-0">
                Question {currentIndex + 1} of {totalCount}
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
                {answeredStatus.map((answered, i) => {
                  const isCurrent = i === currentIndex;
                  return (
                    <button
                      key={i}
                      onClick={() => goTo(i)}
                      aria-label={`Go to question ${i + 1}`}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-200",
                        isCurrent
                          ? "bg-slate-400"
                          : answered
                          ? "bg-brand-green"
                          : "bg-slate-200"
                      )}
                    />
                  );
                })}
                <span className="type-meta pl-1.5">
                  {currentIndex + 1}/{totalCount}
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
                    sub="leadership"
                    initialValue={(responses[currentQuestion.id] as string) ?? ""}
                    onSaveSuccess={(result) =>
                      setLocalProgress("assessment-leadership", result)
                    }
                  >
                    {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
                      <FieldCard
                        fieldId={currentQuestion.id}
                        isAnswered={isFieldAnswered(currentQuestion.id, value)}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        hasError={hasError}
                        onRetry={retry}
                        className="min-h-[280px]"
                      >
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="type-question">
                              {currentQuestion.question}
                            </h3>
                            <TtsButton text={`${currentQuestion.question}. ${currentQuestion.subPrompt}`} />
                          </div>
                          {currentQuestion.subPrompt && (
                            <p className="type-sub italic">
                              {currentQuestion.subPrompt}
                            </p>
                          )}
                          <textarea
                            value={value}
                            onChange={(e) => {
                              onChange(e.target.value);
                              setLocalResponse(currentQuestion.id, e.target.value);
                            }}
                            placeholder="Type your response…"
                            rows={5}
                            className="textarea-field"
                          />
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
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#141414] text-white text-sm font-semibold hover:bg-slate-800 transition-all"
                >
                  {isLastQuestion ? "Complete" : "Next question"}
                  {!isLastQuestion && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <TeamAssessmentBanner clientId={clientId} />
    </div>
  );
}
