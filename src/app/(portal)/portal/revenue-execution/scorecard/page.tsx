"use client";

import { useMemo } from "react";
import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { AutosaveField, FieldCard } from "@/components/framework";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { isFieldAnswered } from "@/lib/framework-nav";

const mod = REVENUE_EXECUTION_SECTION.modules.scorecard;

// Flatten all scorecard measures across areas for the combined table
const allMeasures = mod.scorecardAreas.flatMap((a) =>
  a.measures.map((m) => ({ id: m.id, label: `${a.area}: ${m.label}` }))
);

export default function ScorecardPage() {
  return (
    <ModulePageShell
      section="revenue_execution"
      sub="scorecard"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
    >
      <ScorecardInner />
    </ModulePageShell>
  );
}

function ScorecardInner() {
  const { clientId } = usePortalClient();
  const { responses, setLocalResponse, setLocalProgress } = useResponses(clientId);

  if (!clientId) return null;

  return (
    <AutosaveField
      fieldId="s2-scorecard-measures"
      clientId={clientId}
      section="revenue_execution"
      sub="scorecard"
      initialValue={(responses["s2-scorecard-measures"] as string) ?? ""}
      onSaveSuccess={(result) => setLocalProgress("revenue_execution-scorecard", result)}
    >
      {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
        const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <FieldCard
            fieldId="s2-scorecard-measures"
            isAnswered={isFieldAnswered("s2-scorecard-measures", value)}
            isSaving={isSaving}
            isSaved={isSaved}
            hasError={hasError}
            onRetry={retry}
          >
            <div className="space-y-2">
              <h3 className="type-question">Balanced Scorecard</h3>
              <p className="type-sub italic">Set current levels, targets and RAG status across all four perspectives.</p>
              <MeasureTable
                measures={allMeasures}
                value={parsed}
                onChange={(rows) => {
                  const json = JSON.stringify(rows);
                  onChange(json);
                  setLocalResponse("s2-scorecard-measures", json);
                }}
              />
            </div>
          </FieldCard>
        );
      }}
    </AutosaveField>
  );
}
