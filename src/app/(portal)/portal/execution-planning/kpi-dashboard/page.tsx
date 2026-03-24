"use client";

import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { useQuestions } from "@/hooks/useQuestions";
import { useMemo } from "react";
import {
  SectionProgressHeader,
  SectionGuidance,
  AutosaveField,
  FieldCard,
} from "@/components/framework";
import { InterventionRules } from "@/components/framework/InterventionRules";
import { isFieldAnswered } from "@/lib/framework-nav";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { Skeleton } from "@/components/ui/Skeleton";

const mod = EXECUTION_PLANNING_SECTION.modules.kpiDashboard;

const areas = mod.interventionAreas.map((a, i) => ({
  id: `s3-kpi-area-${i}`,
  label: a.area,
}));

export default function KpiDashboardPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const { loading: questionsLoading } = useQuestions("execution_planning", "kpi-dashboard");

  const fieldIds = ["s3-kpi-intervention-rules"];
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
        <SectionGuidance intro={mod.purpose} estimatedMinutes={20} />

        {/* Intervention guidance */}
        <div className="rounded-lg bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Reference: Typical interventions</p>
          <div className="space-y-1">
            {mod.interventionAreas.map((a, i) => (
              <p key={i} className="text-xs text-slate-600">
                <span className="font-medium">{a.area}:</span> {a.typicalIntervention}
              </p>
            ))}
          </div>
        </div>

        <AutosaveField
          fieldId="s3-kpi-intervention-rules"
          clientId={clientId}
          section="execution_planning"
          sub="kpi-dashboard"
          initialValue={(responses["s3-kpi-intervention-rules"] as string) ?? ""}
          onSaveSuccess={(result) => setLocalProgress("execution_planning-kpi-dashboard", result)}
        >
          {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
            const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
            return (
              <FieldCard
                fieldId="s3-kpi-intervention-rules"
                isAnswered={isFieldAnswered("s3-kpi-intervention-rules", value)}
                isSaving={isSaving}
                isSaved={isSaved}
                hasError={hasError}
                onRetry={retry}
              >
                <div className="space-y-2">
                  <h3 className="type-question">Intervention Rules</h3>
                  <p className="type-sub italic">Define amber and red triggers for each KPI area, with planned interventions and owners.</p>
                  <InterventionRules
                    areas={areas}
                    value={parsed}
                    onChange={(rows) => {
                      const json = JSON.stringify(rows);
                      onChange(json);
                      setLocalResponse("s3-kpi-intervention-rules", json);
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
