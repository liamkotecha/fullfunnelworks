"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.scorecard;
const AREAS = mod.scorecardAreas;

export default function AdminScorecardPage() {
  return (
    <AdminModuleShell
      section="revenue_execution"
      sub="scorecard"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
    >
      {({ responses, setField }) => (
        <div className="space-y-6">
          <h3 className="text-sm font-semibold text-slate-700">Balanced Scorecard</h3>
          {AREAS.map((area) => {
            const key = `scorecard-${area.area.toLowerCase().replace(/[^a-z]/g, "-")}`;
            const stored = responses[key];
            const rows = Array.isArray(stored) ? stored : [];
            return (
              <div key={area.area} className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{area.area}</h4>
                <MeasureTable
                  measures={[...area.measures]}
                  value={rows}
                  onChange={(r) => setField(key, r)}
                />
              </div>
            );
          })}
        </div>
      )}
    </AdminModuleShell>
  );
}
