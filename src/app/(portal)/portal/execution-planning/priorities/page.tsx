"use client";

import { ReadOnlyModuleShell } from "@/components/framework/ReadOnlyModuleShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.priorities;

export default function PrioritiesPage() {
  return (
    <ReadOnlyModuleShell
      section="execution_planning"
      sub="priorities"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
      backHref="/portal/execution-planning"
      backLabel="Back to Execution Planning"
    />
  );
}
