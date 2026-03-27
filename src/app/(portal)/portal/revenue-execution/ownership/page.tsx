"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { OwnershipMatrix } from "@/components/framework/OwnershipMatrix";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.ownership;

const roles = mod.ownershipRoles.map((r, i) => ({
  id: `s2-ownership-role-${i}`,
  label: `${r.role} — ${r.responsibility}`,
}));

export default function OwnershipPage() {
  return (
    <ReadOnlyModuleShell
      section="revenue_execution"
      sub="ownership"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
      backHref="/portal/revenue-execution"
      backLabel="Back to Revenue Execution"
    >
      {(responses) => {
        const parsed = (() => {
          const v = responses["s2-ownership-matrix"];
          if (Array.isArray(v)) return v;
          if (typeof v === "string" && v) {
            try { return JSON.parse(v); } catch { return []; }
          }
          return [];
        })();
        if (parsed.length === 0) return null;
        return (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700">Ownership Matrix</h3>
            <OwnershipMatrix roles={roles} value={parsed} onChange={() => {}} readOnly />
          </div>
        );
      }}
    </ReadOnlyModuleShell>
  );
}
