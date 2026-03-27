"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.qbr;

export default function QbrPage() {
  return (
    <ReadOnlyModuleShell
      section="revenue_execution"
      sub="qbr"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      backHref="/portal/revenue-execution"
      backLabel="Back to Revenue Execution"
    />
  );
}
