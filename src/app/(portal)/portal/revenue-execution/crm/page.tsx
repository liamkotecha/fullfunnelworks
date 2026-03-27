"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.crm;

export default function CrmPage() {
  return (
    <ReadOnlyModuleShell
      section="revenue_execution"
      sub="crm"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
      backHref="/portal/revenue-execution"
      backLabel="Back to Revenue Execution"
    />
  );
}
