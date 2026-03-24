"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.ownership;

const roles = mod.ownershipRoles.map((r, i) => ({
  id: `s2-ownership-role-${i}`,
  label: `${r.role} — ${r.responsibility}`,
}));

export default function AdminOwnershipPage() {
  return (
    <AdminModuleShell
      section="revenue_execution"
      sub="ownership"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    >
      {({ responses, setField }) => {
        const parsed = (() => {
          const v = responses["s2-ownership-matrix"];
          if (Array.isArray(v)) return v;
          if (typeof v === "string" && v) {
            try { return JSON.parse(v); } catch { return []; }
          }
          return [];
        })();
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Ownership Matrix</h3>
            <OwnershipMatrix
              roles={roles}
              value={parsed}
              onChange={(rows) => setField("s2-ownership-matrix", rows)}
            />
          </div>
        );
      }}
    </AdminModuleShell>
  );
}
