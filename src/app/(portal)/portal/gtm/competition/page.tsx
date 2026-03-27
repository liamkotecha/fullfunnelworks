/**
 * GTM Competition — 5-tab SWOT-style, 5 questions per tab (25 total)
 */
"use client";

import { useMemo, useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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
import { GTM_SECTION } from "@/lib/concept-map";
import { isFieldAnswered } from "@/lib/framework-nav";
import { Skeleton } from "@/components/ui/Skeleton";

const SUBSECTIONS = GTM_SECTION.competition.subsections;
const ALL_IDS = SUBSECTIONS.flatMap((s) => s.questions.map((q) => q.id));

export default function CompetitionPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const [activeTab, setActiveTab] = useState(0);

  const loading = clientLoading || responsesLoading;
  const answeredCount = useMemo(
    () => ALL_IDS.filter((id) => isFieldAnswered(id, responses[id])).length,
    [responses]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return <div className="max-w-4xl mx-auto text-center py-16"><p className="text-slate-500">No client profile found.</p></div>;
  }

  const sub = SUBSECTIONS[activeTab];

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/portal/gtm"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to GTM
      </Link>
      <SectionProgressHeader
        title={GTM_SECTION.competition.heading}
        answeredCount={answeredCount}
        totalCount={ALL_IDS.length}
        lastSavedAt={null}
      />

      {/* Context banner */}
      <div className="mt-4 bg-[#141414] rounded-lg px-5 py-3">
        <p className="text-xs text-white/60">Understand your competitive landscape, analyse strengths and weaknesses, and build a differentiated position.</p>
      </div>

      {/* Tab bar */}
      <LayoutGroup id="comp-tab">
        <div className="mt-5 flex gap-1.5 bg-[#141414] rounded-lg p-1.5">
          {SUBSECTIONS.map((s, i) => {
            const tabAnswered = s.questions.filter((q) => isFieldAnswered(q.id, responses[q.id])).length;
            const tabComplete = tabAnswered === s.questions.length;
            return (
              <button
                key={s.number}
                onClick={() => setActiveTab(i)}
                className="relative flex-1 py-2 px-1 rounded-md text-xs font-semibold transition-colors z-10"
                style={{ color: activeTab === i ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="comp-tab-bg"
                    className="absolute inset-0 bg-white/15 rounded-md"
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    style={{ zIndex: -1 }}
                  />
                )}
                <span>{tabComplete ? "✓ " : ""}{s.number}. {s.title.split(" ").slice(0, 2).join(" ")}{s.title.split(" ").length > 2 ? "…" : ""}</span>
              </button>
            );
          })}
        </div>
      </LayoutGroup>

      <div className="mt-4 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-6">
        <div>
          <h2 className="type-question">{sub.title}</h2>
          <p className="type-sub mt-1">{sub.italic}</p>
        </div>

        <div className="space-y-4">
          {sub.questions.map((q, qi) => (
            <AutosaveField
              key={q.id}
              fieldId={q.id}
              clientId={clientId}
              section="gtm"
              sub="competition"
              initialValue={String(responses[q.id] ?? "")}
              onSaveSuccess={(result) => {
                setLocalResponse(q.id, responses[q.id]);
                setLocalProgress("gtm-competition", result);
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
                    <p className="type-label flex-1">
                      <span className="type-meta font-normal mr-1.5">Q{qi + 1}.</span>{q.question}
                    </p>
                    <TtsButton text={q.question} className="mt-0.5 flex-shrink-0" />
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Your answer…"
                    rows={3}
                    className="textarea-field"
                  />
                </FieldCard>
              )}
            </AutosaveField>
          ))}
        </div>

        {/* Tab navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab((t) => Math.max(0, t - 1))}
            disabled={activeTab === 0}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all",
              activeTab === 0
                ? "border-slate-100 text-slate-300 cursor-not-allowed"
                : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          {activeTab < SUBSECTIONS.length - 1 ? (
            <button
              onClick={() => setActiveTab((t) => t + 1)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[#141414] text-white text-sm font-semibold hover:bg-slate-800 transition-all"
            >
              Next section
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            answeredCount === ALL_IDS.length && (
              <WhatsNext
                completedTitle="Competition Analysis"
                nextTitle="Your Progress"
                nextHref="/portal/overview"
                nextDescription="Review your full-funnel growth strategy"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
