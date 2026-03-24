"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { RiskRegister } from "@/components/framework/RiskRegister";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.risk;

export default function AdminRiskPage() {
  return (
    <AdminModuleShell
      section="execution_planning"
      sub="risk"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    >
      {({ responses, setField }) => {
        const stored = responses["s3-risk-register"];
        const rows = Array.isArray(stored) ? stored : [];
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Risk Register</h3>
            <RiskRegister
              value={rows}
              onChange={(r) => setField("s3-risk-register", r)}
            />
          </div>
        );
      }}
    </AdminModuleShell>
  );
}
