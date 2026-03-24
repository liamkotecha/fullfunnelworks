"use client";

import { useMemo } from "react";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { useQuestions } from "@/hooks/useQuestions";
import {
  SectionProgressHeader,
  SectionGuidance,
  AutosaveField,
  FieldCard,
} from "@/components/framework";
import { WorkstreamTabs } from "@/components/framework/WorkstreamTabs";
import { ActionTable, type ActionRow } from "@/components/framework/ActionTable";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { isFieldAnswered } from "@/lib/framework-nav";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { Skeleton } from "@/components/ui/Skeleton";

const mod = EXECUTION_PLANNING_SECTION.modules.ninetyDay;
const WORKSTREAMS = mod.workstreams;
const TABS = WORKSTREAMS.map((w) => ({ id: w.id, label: `${w.icon} ${w.label}` }));

export default function NinetyDayPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const { loading: questionsLoading } = useQuestions("execution_planning", "ninety-day");

  const fieldIds = useMemo(() => {
    const ids = WORKSTREAMS.map((w) => `s3-90day-${w.id}-actions`);
    ids.push("s3-90day-measures");
    return ids;
  }, []);

  const answeredCount = useMemo(
    () => fieldIds.filter((id) => isFieldAnswered(id, responses[id])).length,
    [fieldIds, responses]
  );

  const loading = clientLoading || responsesLoading || questionsLoading;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
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

  return (
    <div className="max-w-3xl mx-auto">
      <SectionProgressHeader
        title={`${mod.number} ${mod.title}`}
        answeredCount={answeredCount}
        totalCount={fieldIds.length}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-8">
        <SectionGuidance intro={mod.purpose} estimatedMinutes={30} />

        <WorkstreamTabs tabs={TABS}>
          {(activeId) => {
            const ws = WORKSTREAMS.find((w) => w.id === activeId)!;
            const fieldId = `s3-90day-${ws.id}-actions`;
            return (
              <div className="space-y-4">
                <div className="rounded-lg bg-slate-50 p-4 space-y-1">
                  <p className="text-sm font-semibold text-slate-900">{ws.label}</p>
                  <p className="text-xs text-slate-600">{ws.purpose}</p>
                  <p className="text-xs text-slate-500 italic">Success evidence: {ws.successEvidence}</p>
                </div>

                <AutosaveField
                  fieldId={fieldId}
                  clientId={clientId}
                  section="execution_planning"
                  sub="ninety-day"
                  initialValue={(responses[fieldId] as string) ?? ""}
                  onSaveSuccess={(result) => setLocalProgress("execution_planning-ninety-day", result)}
                >
                  {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
                    const parsed: ActionRow[] = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
                    return (
                      <FieldCard
                        fieldId={fieldId}
                        isAnswered={isFieldAnswered(fieldId, value)}
                        isSaving={isSaving}
                        isSaved={isSaved}
                        hasError={hasError}
                        onRetry={retry}
                      >
                        <div className="space-y-2">
                          <h3 className="type-question">{ws.label} — 90-Day Actions</h3>
                          <ActionTable
                            value={parsed}
                            onChange={(rows) => {
                              const json = JSON.stringify(rows);
                              onChange(json);
                              setLocalResponse(fieldId, json);
                            }}
                          />
                        </div>
                      </FieldCard>
                    );
                  }}
                </AutosaveField>
              </div>
            );
          }}
        </WorkstreamTabs>

        {/* Measures */}
        <AutosaveField
          fieldId="s3-90day-measures"
          clientId={clientId}
          section="execution_planning"
          sub="ninety-day"
          initialValue={(responses["s3-90day-measures"] as string) ?? ""}
          onSaveSuccess={(result) => setLocalProgress("execution_planning-ninety-day", result)}
        >
          {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
            const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
            return (
              <FieldCard
                fieldId="s3-90day-measures"
                isAnswered={isFieldAnswered("s3-90day-measures", value)}
                isSaving={isSaving}
                isSaved={isSaved}
                hasError={hasError}
                onRetry={retry}
              >
                <div className="space-y-2">
                  <h3 className="type-question">90-Day Delivery Measures</h3>
                  <MeasureTable
                    measures={mod.measures.map((m) => ({ id: m.id, label: m.label }))}
                    value={parsed}
                    onChange={(rows) => {
                      const json = JSON.stringify(rows);
                      onChange(json);
                      setLocalResponse("s3-90day-measures", json);
                    }}
                  />
                </div>
              </FieldCard>
            );
          }}
        </AutosaveField>
      </div>
    </div>
  );
}
