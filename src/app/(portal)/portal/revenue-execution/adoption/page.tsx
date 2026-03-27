"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.adoption;

export default function AdoptionPage() {
  return (
    <ReadOnlyModuleShell
      section="revenue_execution"
      sub="adoption"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
      backHref="/portal/revenue-execution"
      backLabel="Back to Revenue Execution"
    />
  );
}
