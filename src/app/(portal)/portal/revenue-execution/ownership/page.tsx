"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { AutosaveField, FieldCard } from "@/components/framework";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";
import { isFieldAnswered } from "@/lib/framework-nav";

const mod = REVENUE_EXECUTION_SECTION.modules.ownership;

const roles = mod.ownershipRoles.map((r, i) => ({
  id: `s2-ownership-role-${i}`,
  label: `${r.role} — ${r.responsibility}`,
}));

export default function OwnershipPage() {
  return (
    <ModulePageShell
      section="revenue_execution"
      sub="ownership"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    >
      <OwnershipInner />
    </ModulePageShell>
  );
}

function OwnershipInner() {
  const { clientId } = usePortalClient();
  const { responses, setLocalResponse, setLocalProgress } = useResponses(clientId);

  if (!clientId) return null;

  return (
    <AutosaveField
      fieldId="s2-ownership-matrix"
      clientId={clientId}
      section="revenue_execution"
      sub="ownership"
      initialValue={(responses["s2-ownership-matrix"] as string) ?? ""}
      onSaveSuccess={(result) => setLocalProgress("revenue_execution-ownership", result)}
    >
      {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
        const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
        return (
          <FieldCard
            fieldId="s2-ownership-matrix"
            isAnswered={isFieldAnswered("s2-ownership-matrix", value)}
            isSaving={isSaving}
            isSaved={isSaved}
            hasError={hasError}
            onRetry={retry}
          >
            <div className="space-y-2">
              <h3 className="type-question">Ownership Matrix</h3>
              <p className="type-sub italic">Assign a named owner for each accountability area.</p>
              <OwnershipMatrix
                roles={roles}
                value={parsed}
                onChange={(rows) => {
                  const json = JSON.stringify(rows);
                  onChange(json);
                  setLocalResponse("s2-ownership-matrix", json);
                }}
              />
            </div>
          </FieldCard>
        );
      }}
    </AutosaveField>
  );
}
