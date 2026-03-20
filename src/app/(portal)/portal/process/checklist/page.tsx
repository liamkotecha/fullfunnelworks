/**
 * Process: Standardisation Checklist — animated checklist
 */
"use client";

import { useCallback, useMemo, useState, useRef } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import {
  SectionProgressHeader,
  AutosaveField,
  SectionGuidance,
  WhatsNext,
} from "@/components/framework";
import { PROCESS_SECTION } from "@/lib/concept-map";
import { useQuestions } from "@/hooks/useQuestions";
import { Skeleton } from "@/components/ui/Skeleton";
type Phase = "idle" | "tick" | "strike" | "done";

export default function ProcessChecklistPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);

  const { questions: dbQuestions, loading: questionsLoading } = useQuestions("process", "checklist");
  const items = useMemo(() => dbQuestions.map((q) => q.question), [dbQuestions]);
  const fieldIds = useMemo(() => dbQuestions.map((q) => q.fieldId), [dbQuestions]);
  const [phases, setPhases] = useState<Record<string, Phase>>({});
  const [pendingReorder, setPendingReorder] = useState<Set<string>>(new Set());
  const [reviewMode, setReviewMode] = useState(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const isChecked = useCallback(
    (id: string) => responses[id] === true || responses[id] === "true",
    [responses]
  );
  const answeredCount = useMemo(() => fieldIds.filter((id) => isChecked(id)).length, [fieldIds, isChecked]);

  const sortedIndices = useMemo(() => {
    const unchecked: number[] = [];
    const checked: number[] = [];
    fieldIds.forEach((id, i) => {
      if (isChecked(id) && !pendingReorder.has(id)) checked.push(i);
      else if (!isChecked(id)) unchecked.push(i);
    });
    const pending: number[] = [];
    fieldIds.forEach((id, i) => { if (pendingReorder.has(id)) pending.push(i); });
    return [...unchecked, ...pending, ...checked];
  }, [fieldIds, isChecked, pendingReorder]);

  const handleCheck = useCallback(
    (fieldId: string, onChange: (v: string) => void) => {
      const wasChecked = isChecked(fieldId);
      const newVal = wasChecked ? "" : "true";
      if (timers.current[fieldId]) clearTimeout(timers.current[fieldId]);
      if (!wasChecked) {
        setPhases((p) => ({ ...p, [fieldId]: "tick" }));
        setPendingReorder((s) => new Set(s).add(fieldId));
        onChange(newVal);
        setLocalResponse(fieldId, true);
        timers.current[fieldId] = setTimeout(() => {
          setPhases((p) => ({ ...p, [fieldId]: "strike" }));
          timers.current[fieldId] = setTimeout(() => {
            setPendingReorder((s) => { const n = new Set(s); n.delete(fieldId); return n; });
            setPhases((p) => ({ ...p, [fieldId]: "done" }));
          }, 600);
        }, 400);
      } else {
        onChange(newVal);
        setLocalResponse(fieldId, false);
        setPhases((p) => ({ ...p, [fieldId]: "idle" }));
        setPendingReorder((s) => { const n = new Set(s); n.delete(fieldId); return n; });
      }
    },
    [isChecked, setLocalResponse]
  );

  const loading = clientLoading || responsesLoading || questionsLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!clientId) {
    return <div className="max-w-3xl mx-auto text-center py-16"><p className="text-slate-500">No client profile found.</p></div>;
  }

  const allComplete = answeredCount === items.length;

  return (
    <div className="max-w-2xl mx-auto">
      <SectionProgressHeader
        title={PROCESS_SECTION.currentChallenges.heading}
        answeredCount={answeredCount}
        totalCount={items.length}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-8 space-y-6">
        <SectionGuidance
          intro={PROCESS_SECTION.intro}
          estimatedMinutes={12}
        />

        {allComplete && !reviewMode ? (
          <WhatsNext
            completedTitle="Process Standardisation Checklist"
            nextTitle="Sales Capability Methodology"
            nextHref="/portal/process/methodology"
            nextDescription="5 discovery phases · ~30 mins"
            onReview={() => setReviewMode(true)}
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
                    section="process"
                    sub="checklist"
                    debounceMs={0}
                    initialValue={checked ? "true" : ""}
                    onSaveSuccess={(result) => setLocalProgress("process-checklist", result)}
                  >
                    {({ onChange }) => (
                      <motion.div
                        layout
                        layoutId={fieldId}
                        initial={false}
                        animate={{ opacity: showStrike ? 0.55 : 1 }}
                        transition={{ layout: { type: "spring", stiffness: 200, damping: 28, mass: 0.8 }, opacity: { duration: 0.5, ease: "easeInOut" } }}
                        id={`field-${fieldId}`}
                        className={cn(
                          "rounded-lg border p-4 cursor-pointer select-none",
                          showStrike ? "border-brand-green/30 bg-brand-green/5" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                        )}
                        onClick={() => handleCheck(fieldId, onChange)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-colors duration-500",
                            showTick ? "bg-brand-green border-brand-green" : "border-slate-300 hover:border-slate-400"
                          )}>
                            <AnimatePresence>
                              {showTick && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: [0, 1.25, 1], opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                          <span className={cn(
                            "text-sm leading-relaxed transition-all duration-700",
                            showStrike ? "text-slate-400 line-through decoration-slate-400/60" : "text-slate-700"
                          )}>
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
    </div>
  );
}
