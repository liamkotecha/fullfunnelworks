"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.crm;

export default function AdminCrmPage() {
  return (
    <AdminModuleShell
      section="revenue_execution"
      sub="crm"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
