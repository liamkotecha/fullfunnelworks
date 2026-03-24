"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.accountability;

const roles = mod.accountabilityRoles.map((r, i) => ({
  id: `s3-accountability-role-${i}`,
  label: `${r.function} — ${r.accountabilities}`,
}));

export default function AdminAccountabilityPage() {
  return (
    <AdminModuleShell
      section="execution_planning"
      sub="accountability"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={[]}
      measures={mod.measures}
    >
      {({ responses, setField }) => {
        const parsed = (() => {
          const v = responses["s3-accountability-matrix"];
          if (Array.isArray(v)) return v;
          if (typeof v === "string" && v) {
            try { return JSON.parse(v); } catch { return []; }
          }
          return [];
        })();
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Accountability Matrix</h3>
            <OwnershipMatrix
              roles={roles}
              value={parsed}
              onChange={(rows) => setField("s3-accountability-matrix", rows)}
            />
          </div>
        );
      }}
    </AdminModuleShell>
  );
}
