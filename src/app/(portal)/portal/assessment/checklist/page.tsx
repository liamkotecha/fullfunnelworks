/**
 * Assessment Checklist — animated todo-list style.
 * Checked items: tick animates in → text crosses out → card fades & glides to bottom.
 * Nice, smooth, deliberate sequence — not instant.
 */
"use client";

import { useCallback, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import {
  SectionProgressHeader,
  AutosaveField,
  SectionGuidance,
  WhatsNext,
  TeamAssessmentBanner,
} from "@/components/framework";
import { ASSESSMENT_SECTION } from "@/lib/concept-map";
import { useQuestions } from "@/hooks/useQuestions";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Track per-item animation phase so we can stagger the sequence:
 * idle → tick → strikethrough → reorder
 */
type Phase = "idle" | "tick" | "strike" | "done";

export default function ChecklistPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const {
    responses,
    loading: responsesLoading,
    setLocalResponse,
    setLocalProgress,
  } = useResponses(clientId);

  const { questions: dbQuestions, loading: questionsLoading } = useQuestions("assessment", "checklist");
  const items = useMemo(() => dbQuestions.map((q) => q.question), [dbQuestions]);
  const fieldIds = useMemo(() => dbQuestions.map((q) => q.fieldId), [dbQuestions]);

  // Phase map controls the staggered animation per item
  const [phases, setPhases] = useState<Record<string, Phase>>({});
  // Items waiting to be reordered (delayed so text crosses out first)
  const [pendingReorder, setPendingReorder] = useState<Set<string>>(new Set());
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isChecked = useCallback(
    (fieldId: string) =>
      responses[fieldId] === true || responses[fieldId] === "true",
    [responses]
  );

  const answeredCount = useMemo(
    () => fieldIds.filter((id) => isChecked(id)).length,
    [fieldIds, isChecked]
  );

  // Sort: unchecked first (original order), checked last (original order)
  // Items in pendingReorder stay in-place until animation completes
  const sortedIndices = useMemo(() => {
    const unchecked: number[] = [];
    const checked: number[] = [];
    fieldIds.forEach((id, i) => {
      if (isChecked(id) && !pendingReorder.has(id)) checked.push(i);
      else if (!isChecked(id)) unchecked.push(i);
    });
    // pending items stay at their current visual position (among unchecked)
    const pending: number[] = [];
    fieldIds.forEach((id, i) => {
      if (pendingReorder.has(id)) pending.push(i);
    });
    return [...unchecked, ...pending, ...checked];
  }, [fieldIds, isChecked, pendingReorder]);

  const jumpToNext = useCallback(() => {
    const nextIdx = fieldIds.findIndex((id) => !isChecked(id));
    if (nextIdx >= 0) {
      const el = document.getElementById(`field-${fieldIds[nextIdx]}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [fieldIds, isChecked]);

  /** Orchestrate: tick → strike → reorder with delays */
  const handleCheck = useCallback(
    (fieldId: string, onChange: (v: string) => void) => {
      const wasChecked = isChecked(fieldId);
      const newVal = wasChecked ? "" : "true";

      // Clear any pending timers for this item
      if (timers.current[fieldId]) clearTimeout(timers.current[fieldId]);

      if (!wasChecked) {
        // Phase 1: tick appears (0ms)
        setPhases((p) => ({ ...p, [fieldId]: "tick" }));
        setPendingReorder((s) => new Set(s).add(fieldId));

        // Fire the save immediately
        onChange(newVal);
        setLocalResponse(fieldId, true);

        // Phase 2: strikethrough (after 400ms — tick has finished animating)
        timers.current[fieldId] = setTimeout(() => {
          setPhases((p) => ({ ...p, [fieldId]: "strike" }));

          // Phase 3: release to reorder (after another 600ms — text has visibly crossed out)
          timers.current[fieldId] = setTimeout(() => {
            setPendingReorder((s) => {
              const next = new Set(s);
              next.delete(fieldId);
              return next;
            });
            setPhases((p) => ({ ...p, [fieldId]: "done" }));
          }, 600);
        }, 400);
      } else {
        // Un-checking: instant
        onChange(newVal);
        setLocalResponse(fieldId, false);
        setPhases((p) => ({ ...p, [fieldId]: "idle" }));
        setPendingReorder((s) => {
          const next = new Set(s);
          next.delete(fieldId);
          return next;
        });
      }
    },
    [isChecked, setLocalResponse]
  );

  const loading = clientLoading || responsesLoading || questionsLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
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

  const allComplete = answeredCount === items.length;

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
        title="Assessment Checklist"
        answeredCount={answeredCount}
        totalCount={items.length}
        lastSavedAt={null}
        onJumpToNext={jumpToNext}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-6">
        <p className="text-sm text-slate-600">{ASSESSMENT_SECTION.intro}</p>

      <SectionGuidance
        intro="This quick checklist helps you gauge readiness before diving into deeper analysis. Tick off the items that apply to your organisation today."
        estimatedMinutes={5}
      />

      {allComplete ? (
        <WhatsNext
          completedTitle="Assessment Checklist"
          nextTitle="SWOT Analysis"
          nextHref="/portal/assessment/swot"
          nextDescription="20 questions · ~40 mins"
        />
      ) : (
        <LayoutGroup>
          <motion.div layout className="space-y-2">
            {sortedIndices.map((i) => {
              const item = items[i];
              const fieldId = fieldIds[i];
              const checked = isChecked(fieldId);
              const phase = phases[fieldId] ?? (checked ? "done" : "idle");
              const showTick = phase === "tick" || phase === "strike" || phase === "done" || checked;
              const showStrike = phase === "strike" || phase === "done" || (checked && phase !== "tick");

              return (
                <AutosaveField
                  key={fieldId}
                  fieldId={fieldId}
                  clientId={clientId}
                  section="assessment"
                  sub="checklist"
                  debounceMs={0}
                  initialValue={checked ? "true" : ""}
                  onSaveSuccess={(result) => {
                    setLocalProgress("assessment-checklist", result);
                  }}
                >
                  {({ value, onChange }) => (
                    <motion.div
                      layout
                      layoutId={fieldId}
                      initial={false}
                      animate={{
                        opacity: showStrike ? 0.55 : 1,
                      }}
                      transition={{
                        layout: {
                          type: "spring",
                          stiffness: 200,
                          damping: 28,
                          mass: 0.8,
                        },
                        opacity: { duration: 0.5, ease: "easeInOut" },
                      }}
                      id={`field-${fieldId}`}
                      className={cn(
                        "rounded-lg border p-4 cursor-pointer select-none",
                        showStrike
                          ? "border-brand-green/30 bg-brand-green/5"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                      onClick={() => handleCheck(fieldId, onChange)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5",
                            "transition-colors duration-500 ease-in-out",
                            showTick
                              ? "bg-brand-green border-brand-green"
                              : "border-slate-300 hover:border-slate-400"
                          )}
                        >
                          <AnimatePresence>
                            {showTick && (
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                  duration: 0.4,
                                  ease: [0.34, 1.56, 0.64, 1],
                                }}
                              >
                                <Check className="w-4 h-4 text-white" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Text with animated strikethrough */}
                        <span
                          className={cn(
                            "text-sm leading-relaxed",
                            "transition-all duration-700 ease-in-out",
                            showStrike
                              ? "text-slate-400 line-through decoration-slate-400/60"
                              : "text-slate-700"
                          )}
                        >
                          {item}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AutosaveField>
              );
            })}
          </motion.div>
        </LayoutGroup>
      )}
      </div>

      <TeamAssessmentBanner clientId={clientId} />
    </div>
  );
}
