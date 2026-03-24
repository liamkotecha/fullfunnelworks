"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { AutosaveField, FieldCard } from "@/components/framework";
import { RiskRegister } from "@/components/framework/RiskRegister";
import { isFieldAnswered } from "@/lib/framework-nav";

const mod = EXECUTION_PLANNING_SECTION.modules.risk;

export default function RiskPage() {
  return (
    <ModulePageShell
      section="execution_planning"
      sub="risk"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    >
      <RiskInner />
    </ModulePageShell>
  );
}

function RiskInner() {
  const { clientId } = usePortalClient();
  const { responses, setLocalResponse, setLocalProgress } = useResponses(clientId);

  if (!clientId) return null;

  return (
    <AutosaveField
      fieldId="s3-risk-register"
      clientId={clientId}
      section="execution_planning"
      sub="risk"
      initialValue={(responses["s3-risk-register"] as string) ?? ""}
      onSaveSuccess={(result) => setLocalProgress("execution_planning-risk", result)}
    >
      {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
        const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <FieldCard
            fieldId="s3-risk-register"
            isAnswered={isFieldAnswered("s3-risk-register", value)}
            isSaving={isSaving}
            isSaved={isSaved}
            hasError={hasError}
            onRetry={retry}
          >
            <div className="space-y-2">
              <h3 className="type-question">Risk Register</h3>
              <p className="type-sub italic">Log risks, assess likelihood and impact, and assign mitigation actions.</p>
              <RiskRegister
                value={parsed}
                onChange={(rows) => {
                  const json = JSON.stringify(rows);
                  onChange(json);
                  setLocalResponse("s3-risk-register", json);
                }}
              />
            </div>
          </FieldCard>
        );
      }}
    </AutosaveField>
  );
}
