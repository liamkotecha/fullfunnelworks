/**
 * Sales Process Builder — 5-stage accordion, 2 inputs per stage
 */
"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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

const STAGES = PROCESS_SECTION.salesProcessBuilder.stages;
const ALL_FIELD_IDS = STAGES.flatMap((s) => [
  `proc_stage_${s.id}_0`,
  `proc_stage_${s.id}_1`,
]);

export default function BuilderPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const [openStage, setOpenStage] = useState<string>(STAGES[0].id);

  const loading = clientLoading || responsesLoading;
  const answeredCount = useMemo(
    () => ALL_FIELD_IDS.filter((id) => isFieldAnswered(id, responses[id])).length,
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
      <SectionProgressHeader
        title={PROCESS_SECTION.salesProcessBuilder.heading}
        answeredCount={answeredCount}
        totalCount={ALL_FIELD_IDS.length}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-8 space-y-4">
        <SectionGuidance
          intro="Build out each stage of your standardised sales process. This playbook becomes the foundation for onboarding new hires and scaling revenue predictably."
          estimatedMinutes={20}
        />

        <div className="space-y-3">
          {STAGES.map((stage) => {
            const f0 = `proc_stage_${stage.id}_0`;
            const f1 = `proc_stage_${stage.id}_1`;
            const stageAnswered = [f0, f1].filter((id) => isFieldAnswered(id, responses[id])).length;
            const stageComplete = stageAnswered === 2;
            const isOpen = openStage === stage.id;

            return (
              <div key={stage.id} className="rounded-lg border border-slate-200 overflow-hidden">
                <button
                  onClick={() => setOpenStage(isOpen ? "" : stage.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 text-left transition-colors",
                    isOpen ? "bg-[#141414] text-white" : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      stageComplete
                        ? "bg-brand-green text-[#141414]"
                        : isOpen ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                    )}>
                      {stageComplete ? "✓" : stage.label.split(".")[0]}
                    </span>
                    <p className="font-semibold text-sm">{stage.heading}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn("text-xs", isOpen ? "text-white/60" : "text-slate-400")}>
                      {stageAnswered}/2
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
                      <div className="p-5 border-t border-slate-200 space-y-4">
                        {stage.fields.map((field, fi) => {
                          const fieldId = `proc_stage_${stage.id}_${fi}`;
                          return (
                            <AutosaveField
                              key={fieldId}
                              fieldId={fieldId}
                              clientId={clientId}
                              section="process"
                              sub="builder"
                              initialValue={String(responses[fieldId] ?? "")}
                              onSaveSuccess={(result) => {
                                setLocalResponse(fieldId, responses[fieldId]);
                                setLocalProgress("process-builder", result);
                              }}
                            >
                              {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
                                <FieldCard
                                  fieldId={fieldId}
                                  isAnswered={isFieldAnswered(fieldId, value)}
                                  isSaving={isSaving}
                                  isSaved={isSaved}
                                  hasError={hasError}
                                  onRetry={retry}
                                >
                                  <div className="flex items-start gap-2 mb-2">
                                    <p className="text-xs font-semibold text-slate-600 flex-1">{field.label}</p>
                                    <TtsButton text={field.label} className="mt-0.5 flex-shrink-0" />
                                  </div>
                                  <textarea
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full resize-y bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm leading-relaxed"
                                  />
                                </FieldCard>
                              )}
                            </AutosaveField>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {answeredCount === ALL_FIELD_IDS.length && (
          <WhatsNext
            completedTitle="Sales Process Builder"
            nextTitle="Strategic Roadmap"
            nextHref="/portal/roadmap"
            nextDescription="Build your 5-phase growth roadmap"
          />
        )}
      </div>
    </div>
  );
}
