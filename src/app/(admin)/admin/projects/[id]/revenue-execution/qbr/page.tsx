"use client";

import { AdminModuleShell } from "@/components/admin/AdminModuleShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.qbr;

export default function AdminQbrPage() {
  return (
    <AdminModuleShell
      section="revenue_execution"
      sub="qbr"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
    />
  );
}
