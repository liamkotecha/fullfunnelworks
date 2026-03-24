"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.reset;

export default function AdminResetPage() {
  return (
    <AdminModuleShell
      section="execution_planning"
      sub="reset"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
