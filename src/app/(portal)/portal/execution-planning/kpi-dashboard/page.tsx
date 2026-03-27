"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { InterventionRules } from "@/components/framework/InterventionRules";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.kpiDashboard;

const areas = mod.interventionAreas.map((a, i) => ({
  id: `s3-kpi-area-${i}`,
  label: a.area,
}));

export default function KpiDashboardPage() {
  return (
    <ReadOnlyModuleShell
      section="execution_planning"
      sub="kpi-dashboard"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={[]}
      backHref="/portal/execution-planning"
      backLabel="Back to Execution Planning"
    >
      {(responses) => {
        const stored = responses["s3-intervention-rules"];
        const rows = Array.isArray(stored) ? stored : [];
        if (rows.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Intervention Rules</h3>
            <InterventionRules areas={areas} value={rows} onChange={() => {}} readOnly />
          </div>
        );
      }}
    </ReadOnlyModuleShell>
  );
}
