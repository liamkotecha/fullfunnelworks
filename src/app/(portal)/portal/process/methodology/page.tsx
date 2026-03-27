/**
 * Sales Capability Methodology — 5-phase accordion with reflective questions
 */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";
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
} from "@/components/framework";
import { PROCESS_SECTION } from "@/lib/concept-map";
import { isFieldAnswered } from "@/lib/framework-nav";
import { Skeleton } from "@/components/ui/Skeleton";

const PHASES = PROCESS_SECTION.salesCapabilityMethodology.phases;
const ALL_QUESTION_IDS = PHASES.flatMap((p) => p.questions.map((q) => q.id));

export default function MethodologyPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const [openPhase, setOpenPhase] = useState<number>(1);

  const loading = clientLoading || responsesLoading;
  const answeredCount = useMemo(
    () => ALL_QUESTION_IDS.filter((id) => isFieldAnswered(id, responses[id])).length,
    [responses]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-3">
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
      </div>
    );
  }

  if (!clientId) {
    return <div className="max-w-3xl mx-auto text-center py-16"><p className="text-slate-500">No client profile found.</p></div>;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/portal/process"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Process
      </Link>
      <SectionProgressHeader
        title={PROCESS_SECTION.salesCapabilityMethodology.heading}
        answeredCount={answeredCount}
        totalCount={ALL_QUESTION_IDS.length}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-8 space-y-4">
        <SectionGuidance intro={PROCESS_SECTION.salesCapabilityMethodology.intro} estimatedMinutes={25} />

        <div className="space-y-3">
          {PHASES.map((phase) => {
            const isOpen = openPhase === phase.number;
            const phaseAnswered = phase.questions.filter((q) => isFieldAnswered(q.id, responses[q.id])).length;
            const phaseComplete = phaseAnswered === phase.questions.length;

            return (
              <div key={phase.number} className="rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenPhase(isOpen ? 0 : phase.number)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
                    isOpen ? "bg-[#141414] text-white" : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      phaseComplete
                        ? "bg-brand-green text-[#141414]"
                        : isOpen ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {phaseComplete ? "✓" : phase.number}
                    </span>
                    <div>
                      <p className={cn("text-xs uppercase tracking-widest font-semibold", isOpen ? "text-white/60" : "text-slate-400")}>
                        Phase {phase.number}
                      </p>
                      <p className="font-semibold text-sm mt-0.5">{phase.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-xs", isOpen ? "text-white/60" : "text-slate-400")}>
                      {phaseAnswered}/{phase.questions.length}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="p-5 border-t border-slate-200 space-y-5">
                        <p className="text-sm text-slate-600 italic">{phase.objective}</p>

                        <ul className="space-y-1.5">
                          {phase.points.map((point, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-blue mt-1.5 flex-shrink-0" />
                              {point}
                            </li>
                          ))}
                        </ul>

                        <div className="space-y-3">
                          {phase.questions.map((q) => (
                            <AutosaveField
                              key={q.id}
                              fieldId={q.id}
                              clientId={clientId}
                              section="process"
                              sub="methodology"
                              initialValue={String(responses[q.id] ?? "")}
                              onSaveSuccess={(result) => {
                                setLocalResponse(q.id, responses[q.id]);
                                setLocalProgress("process-methodology", result);
                              }}
                            >
                              {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
                                <FieldCard
                                  fieldId={q.id}
                                  isAnswered={isFieldAnswered(q.id, value)}
                                  isSaving={isSaving}
                                  isSaved={isSaved}
                                  hasError={hasError}
                                  onRetry={retry}
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    <p className="text-xs font-semibold text-slate-600 flex-1">{q.label}</p>
                                    <TtsButton text={q.label} className="mt-0.5 flex-shrink-0" />
                                  </div>
                                  <textarea
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder="Your answer…"
                                    rows={3}
                                    className="w-full resize-y bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm leading-relaxed"
                                  />
                                </FieldCard>
                              )}
                            </AutosaveField>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {answeredCount === ALL_QUESTION_IDS.length && (
          <WhatsNext
            completedTitle="Sales Capability Methodology"
            nextTitle="Sales Process Builder"
            nextHref="/portal/process/builder"
            nextDescription="Map your end-to-end sales process"
          />
        )}
      </div>
    </div>
  );
}
