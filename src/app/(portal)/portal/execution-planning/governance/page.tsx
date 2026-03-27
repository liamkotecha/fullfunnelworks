"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { GovernanceCalendar } from "@/components/framework/GovernanceCalendar";

const mod = EXECUTION_PLANNING_SECTION.modules.governance;

const reviews = mod.governanceCalendar.map((g, i) => ({
  id: `s3-governance-review-${i}`,
  label: `${g.reviewType} (${g.frequency})`,
}));

export default function GovernancePage() {
  return (
    <ReadOnlyModuleShell
      section="execution_planning"
      sub="governance"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      backHref="/portal/execution-planning"
      backLabel="Back to Execution Planning"
    >
      {(responses) => {
        const stored = responses["s3-governance-calendar"];
        const rows = Array.isArray(stored) ? stored : [];
        if (rows.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Governance Calendar</h3>
            <GovernanceCalendar reviews={reviews} value={rows} onChange={() => {}} readOnly />
          </div>
        );
      }}
    </ReadOnlyModuleShell>
  );
}
