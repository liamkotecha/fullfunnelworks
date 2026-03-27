"use client";

import { useMemo, useCallback, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import {
  SectionProgressHeader,
  AutosaveField,
  FieldCard,
  SectionGuidance,
  TtsButton,
  WhatsNext,
  TeamAssessmentBanner,
} from "@/components/framework";
import { isFieldAnswered } from "@/lib/framework-nav";
import { Skeleton } from "@/components/ui/Skeleton";
import { NumberRadixSlider } from "@/components/ui/NumberRadixSlider";

const FIELDS = [
  {
    id: "gap-priority",
    label: "Top Priority Gap #1",
    type: "text" as const,
    placeholder: "Describe the most critical capability gap affecting growth…",
  },
  {
    id: "gap-impact",
    label: "Impact on Growth (1-10)",
    type: "number" as const,
    placeholder: "Rate 1 to 10",
  },
  {
    id: "gap-timeline",
    label: "Quick Win or Long-term Initiative?",
    type: "select" as const,
    options: [
      { value: "", label: "Select…" },
      { value: "quick-win", label: "Quick Win (0-3 months)" },
      { value: "medium-term", label: "Medium Term (3-6 months)" },
      { value: "long-term", label: "Long-term Initiative (6-12 months)" },
    ],
  },
];

export default function GapPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const [reviewMode, setReviewMode] = useState(false);

  const answeredCount = useMemo(
    () => FIELDS.filter((f) => isFieldAnswered(f.id, responses[f.id])).length,
    [responses]
  );

  const jumpToNext = useCallback(() => {
    for (const f of FIELDS) {
      if (!isFieldAnswered(f.id, responses[f.id])) {
        const el = document.getElementById(`field-${f.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }
  }, [responses]);

  const loading = clientLoading || responsesLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
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
        title="Gap Analysis"
        answeredCount={answeredCount}
        totalCount={FIELDS.length}
        lastSavedAt={null}
        onJumpToNext={jumpToNext}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-6">
        <p className="text-sm text-slate-600">
        Identify the most critical capability gaps and prioritize them by impact and timeline.
      </p>

      <SectionGuidance
        intro="Pinpointing the gap between where you are and where you need to be lets you focus resources on the highest-impact improvements first."
        estimatedMinutes={6}
      />

      {answeredCount === FIELDS.length && !reviewMode ? (
        <WhatsNext
          completedTitle="Gap Analysis"
          nextTitle="Leadership Questions"
          nextHref="/portal/assessment/leadership"
          nextDescription="10 questions · ~20 mins"
          onReview={() => setReviewMode(true)}
        />
      ) : (
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <AutosaveField
            key={field.id}
            fieldId={field.id}
            clientId={clientId}
            section="assessment"
            sub="gap"
            initialValue={(responses[field.id] as string) ?? ""}
            onSaveSuccess={(result) => {
              setLocalProgress("assessment-gap", result);
            }}
          >
            {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
              <FieldCard
                fieldId={field.id}
                isAnswered={isFieldAnswered(field.id, value)}
                isSaving={isSaving}
                isSaved={isSaved}
                hasError={hasError}
                onRetry={retry}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <label className="block type-label">
                      {field.label}
                    </label>
                    <TtsButton text={field.label} />
                  </div>

                  {field.type === "text" && (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setLocalResponse(field.id, e.target.value);
                      }}
                      placeholder={field.placeholder}
                      className="input-field"
                    />
                  )}

                  {field.type === "number" && (
                    <div className="space-y-2">
                      <NumberRadixSlider
                        value={value && !isNaN(parseInt(value, 10)) ? parseInt(value, 10) : 1}
                        onValueChange={(n) => {
                          onChange(String(n));
                          setLocalResponse(field.id, String(n));
                        }}
                        min={1}
                        max={10}
                        step={1}
                      />
                      <p className="text-xs text-slate-400">1 = minimal impact · 10 = critical to growth</p>
                    </div>
                  )}

                  {field.type === "select" && field.options && (
                    <select
                      value={value}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setLocalResponse(field.id, e.target.value);
                      }}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </FieldCard>
            )}
          </AutosaveField>
        ))}
      </div>
      )}
      </div>

      <TeamAssessmentBanner clientId={clientId} />
    </div>
  );
}
