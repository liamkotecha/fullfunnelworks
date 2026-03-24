"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { AutosaveField, FieldCard } from "@/components/framework";
import { GovernanceCalendar } from "@/components/framework/GovernanceCalendar";
import { isFieldAnswered } from "@/lib/framework-nav";

const mod = EXECUTION_PLANNING_SECTION.modules.governance;

const reviews = mod.governanceCalendar.map((g, i) => ({
  id: `s3-governance-review-${i}`,
  label: `${g.reviewType} (${g.frequency})`,
}));

export default function GovernancePage() {
  return (
    <ModulePageShell
      section="execution_planning"
      sub="governance"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
    >
      <GovernanceInner />
    </ModulePageShell>
  );
}

function GovernanceInner() {
  const { clientId } = usePortalClient();
  const { responses, setLocalResponse, setLocalProgress } = useResponses(clientId);

  if (!clientId) return null;

  return (
    <AutosaveField
      fieldId="s3-governance-calendar"
      clientId={clientId}
      section="execution_planning"
      sub="governance"
      initialValue={(responses["s3-governance-calendar"] as string) ?? ""}
      onSaveSuccess={(result) => setLocalProgress("execution_planning-governance", result)}
    >
      {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
        const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <FieldCard
            fieldId="s3-governance-calendar"
            isAnswered={isFieldAnswered("s3-governance-calendar", value)}
            isSaving={isSaving}
            isSaved={isSaved}
            hasError={hasError}
            onRetry={retry}
          >
            <div className="space-y-2">
              <h3 className="type-question">Governance Calendar</h3>
              <p className="type-sub italic">Schedule review meetings and assign chairs and attendees.</p>
              <GovernanceCalendar
                reviews={reviews}
                value={parsed}
                onChange={(rows) => {
                  const json = JSON.stringify(rows);
                  onChange(json);
                  setLocalResponse("s3-governance-calendar", json);
                }}
              />
            </div>
          </FieldCard>
        );
      }}
    </AutosaveField>
  );
}
