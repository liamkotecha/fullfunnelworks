"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { RiskRegister } from "@/components/framework/RiskRegister";

const mod = EXECUTION_PLANNING_SECTION.modules.risk;

export default function RiskPage() {
  return (
    <ReadOnlyModuleShell
      section="execution_planning"
      sub="risk"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
      backHref="/portal/execution-planning"
      backLabel="Back to Execution Planning"
    >
      {(responses) => {
        const stored = responses["s3-risk-register"];
        const rows = Array.isArray(stored) ? stored : [];
        if (rows.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Risk Register</h3>
            <RiskRegister value={rows} onChange={() => {}} readOnly />
          </div>
        );
      }}
    </ReadOnlyModuleShell>
  );
}
