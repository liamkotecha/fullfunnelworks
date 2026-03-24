"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { AutosaveField, FieldCard } from "@/components/framework";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";
import { isFieldAnswered } from "@/lib/framework-nav";

const mod = EXECUTION_PLANNING_SECTION.modules.accountability;

const roles = mod.accountabilityRoles.map((r, i) => ({
  id: `s3-accountability-role-${i}`,
  label: `${r.function} — ${r.accountabilities}`,
}));

export default function AccountabilityPage() {
  return (
    <ModulePageShell
      section="execution_planning"
      sub="accountability"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={[]}
      measures={mod.measures}
    >
      <AccountabilityInner />
    </ModulePageShell>
  );
}

function AccountabilityInner() {
  const { clientId } = usePortalClient();
  const { responses, setLocalResponse, setLocalProgress } = useResponses(clientId);

  if (!clientId) return null;

  return (
    <AutosaveField
      fieldId="s3-accountability-matrix"
      clientId={clientId}
      section="execution_planning"
      sub="accountability"
      initialValue={(responses["s3-accountability-matrix"] as string) ?? ""}
      onSaveSuccess={(result) => setLocalProgress("execution_planning-accountability", result)}
    >
      {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
        const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <FieldCard
            fieldId="s3-accountability-matrix"
            isAnswered={isFieldAnswered("s3-accountability-matrix", value)}
            isSaving={isSaving}
            isSaved={isSaved}
            hasError={hasError}
            onRetry={retry}
          >
            <div className="space-y-2">
              <h3 className="type-question">Functional Accountability Matrix</h3>
              <p className="type-sub italic">Assign a named owner for each function and confirm accountability.</p>
              <OwnershipMatrix
                roles={roles}
                value={parsed}
                onChange={(rows) => {
                  const json = JSON.stringify(rows);
                  onChange(json);
                  setLocalResponse("s3-accountability-matrix", json);
                }}
              />
            </div>
          </FieldCard>
        );
      }}
    </AutosaveField>
  );
}
