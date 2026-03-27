/**
 * GTM Marketplace — 5-tab, 5 questions each, 2 textareas per question (current / next)
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

const SUBSECTIONS = GTM_SECTION.marketplace.subsections;
const CHAR_LIMIT = 500;

function CharCounter({ count }: { count: number }) {
  const remaining = CHAR_LIMIT - count;
  const inDanger = remaining <= 100;
  const color = remaining < 0 ? "#ef4444" : remaining <= 50 ? "#f59e0b" : "#94a3b8";

  return (
    <motion.span
      key={inDanger ? count : "safe"}
      initial={inDanger ? { scale: 1.5 } : { scale: 1 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 700, damping: 14 }}
      style={{ color, display: "inline-block" }}
      className="text-xs tabular-nums select-none font-semibold"
    >
      {remaining}
    </motion.span>
  );
}
const ALL_IDS = SUBSECTIONS.flatMap((s) =>
  s.questions.flatMap((q) => [
    `mkt-${s.number}-${q.id.split("-")[2]}-current`,
    `mkt-${s.number}-${q.id.split("-")[2]}-next`,
  ])
);

export default function MarketPage() {
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
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return <div className="max-w-3xl mx-auto text-center py-16"><p className="text-slate-500">No client profile found.</p></div>;
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
        title={GTM_SECTION.marketplace.heading}
        answeredCount={answeredCount}
        totalCount={ALL_IDS.length}
        lastSavedAt={null}
      />

      {/* Tab bar */}
      <LayoutGroup id="mkt-tab">
        <div className="mt-4 flex gap-1.5 bg-[#141414] rounded-lg p-1.5">
          {SUBSECTIONS.map((s, i) => {
            const subIds = s.questions.flatMap((q) => [
              `mkt-${s.number}-${q.id.split("-")[2]}-current`,
              `mkt-${s.number}-${q.id.split("-")[2]}-next`,
            ]);
            const tabComplete = subIds.every((id) => isFieldAnswered(id, responses[id]));
            return (
              <button
                key={s.number}
                onClick={() => setActiveTab(i)}
                className="relative flex-1 py-2 px-1 rounded-md text-xs font-semibold transition-colors z-10"
                style={{ color: activeTab === i ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
              >
                {activeTab === i && (
                  <motion.div
                    layoutId="mkt-tab-bg"
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
        <SectionGuidance
          intro={GTM_SECTION.marketplace.intro}
          description={GTM_SECTION.marketplace.subIntro}
          estimatedMinutes={20}
        />
        <div>
          <h2 className="type-question">{sub.title}</h2>
          <p className="type-sub mt-1">{sub.italic}</p>
        </div>

        <div className="space-y-6">
          {sub.questions.map((q, qi) => {
            const qNum = q.id.split("-")[2];
            const currentId = `mkt-${sub.number}-${qNum}-current`;
            const nextId = `mkt-${sub.number}-${qNum}-next`;

            return (
              <div key={q.id} className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="type-question">
                      <span className="type-meta font-normal mr-1.5">Q{qi + 1}.</span>
                      {q.label}
                    </p>
                    <p className="type-sub mt-0.5">{q.question}</p>
                  </div>
                  <TtsButton text={`${q.label}. ${q.question}`} className="mt-0.5 flex-shrink-0" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* CURRENT */}
                  <AutosaveField
                    fieldId={currentId}
                    clientId={clientId}
                    section="gtm"
                    sub="market"
                    initialValue={String(responses[currentId] ?? "")}
                    onSaveSuccess={(result) => {
                      setLocalResponse(currentId, responses[currentId]);
                      setLocalProgress("gtm-market", result);
                    }}
                  >
                    {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
                      <FieldCard
                        fieldId={currentId}
                        isAnswered={isFieldAnswered(currentId, value)}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        hasError={hasError}
                        onRetry={retry}
                        className="!border-0 !shadow-none"
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Current State</p>
                        <div className="relative">
                          <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="What you do now…"
                            rows={5}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pb-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-colors resize-y"
                          />
                          <div className="absolute bottom-2.5 right-3 pointer-events-none">
                            <CharCounter count={value.length} />
                          </div>
                        </div>
                      </FieldCard>
                    )}
                  </AutosaveField>

                  {/* NEXT */}
                  <AutosaveField
                    fieldId={nextId}
                    clientId={clientId}
                    section="gtm"
                    sub="market"
                    initialValue={String(responses[nextId] ?? "")}
                    onSaveSuccess={(result) => {
                      setLocalResponse(nextId, responses[nextId]);
                      setLocalProgress("gtm-market", result);
                    }}
                  >
                    {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
                      <FieldCard
                        fieldId={nextId}
                        isAnswered={isFieldAnswered(nextId, value)}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        hasError={hasError}
                        onRetry={retry}
                        className="!border-0 !shadow-none"
                      >
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">30-60 Day Action</p>
                        <div className="relative">
                          <textarea
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            placeholder="What you will put in place next…"
                            rows={5}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 pb-10 text-sm text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-colors resize-y"
                          />
                          <div className="absolute bottom-2.5 right-3 pointer-events-none">
                            <CharCounter count={value.length} />
                          </div>
                        </div>
                      </FieldCard>
                    )}
                  </AutosaveField>
                </div>
              </div>
            );
          })}
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
                completedTitle="Marketplace Analysis"
                nextTitle="Competition Analysis"
                nextHref="/portal/gtm/competition"
                nextDescription="Analyse your competitive position"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}
