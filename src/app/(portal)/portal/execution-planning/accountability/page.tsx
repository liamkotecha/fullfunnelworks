"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";

const mod = EXECUTION_PLANNING_SECTION.modules.accountability;

const roles = mod.accountabilityRoles.map((r, i) => ({
  id: `s3-accountability-role-${i}`,
  label: `${r.function} — ${r.accountabilities}`,
}));

export default function AccountabilityPage() {
  return (
    <ReadOnlyModuleShell
      section="execution_planning"
      sub="accountability"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={[]}
      measures={mod.measures}
      backHref="/portal/execution-planning"
      backLabel="Back to Execution Planning"
    >
      {(responses) => {
        const stored = responses["s3-accountability-matrix"];
        const rows = Array.isArray(stored) ? stored : [];
        if (rows.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Functional Accountability Matrix</h3>
            <OwnershipMatrix roles={roles} value={rows} onChange={() => {}} readOnly />
          </div>
        );
      }}
    </ReadOnlyModuleShell>
  );
}
