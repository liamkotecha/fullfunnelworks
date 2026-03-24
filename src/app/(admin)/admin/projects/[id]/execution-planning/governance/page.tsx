"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { GovernanceCalendar } from "@/components/framework/GovernanceCalendar";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.governance;
const calendarReviews = mod.governanceCalendar.map((c) => ({
  id: c.reviewType.toLowerCase().replace(/\s+/g, "-"),
  label: `${c.reviewType} (${c.frequency})`,
}));

export default function AdminGovernancePage() {
  return (
    <AdminModuleShell
      section="execution_planning"
      sub="governance"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
    >
      {({ responses, setField }) => {
        const stored = responses["s3-governance-calendar"];
        const rows = Array.isArray(stored) ? stored : [];
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Governance Calendar</h3>
            <GovernanceCalendar
              reviews={calendarReviews}
              value={rows}
              onChange={(r) => setField("s3-governance-calendar", r)}
            />
          </div>
        );
      }}
    </AdminModuleShell>
  );
}
