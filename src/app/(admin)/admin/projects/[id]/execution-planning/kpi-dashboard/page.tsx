"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { InterventionRules } from "@/components/framework/InterventionRules";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.kpiDashboard;
const interventionAreas = mod.interventionAreas.map((a) => ({
  id: a.area.toLowerCase().replace(/\s+/g, "-"),
  label: a.area,
}));

export default function AdminKpiDashboardPage() {
  return (
    <AdminModuleShell
      section="execution_planning"
      sub="kpi-dashboard"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={[]}
    >
      {({ responses, setField }) => {
        const stored = responses["s3-intervention-rules"];
        const rows = Array.isArray(stored) ? stored : [];
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Intervention Rules</h3>
            <InterventionRules
              areas={interventionAreas}
              value={rows}
              onChange={(r) => setField("s3-intervention-rules", r)}
            />
          </div>
        );
      }}
    </AdminModuleShell>
  );
}
