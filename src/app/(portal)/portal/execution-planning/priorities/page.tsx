"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.priorities;

export default function PrioritiesPage() {
  return (
    <ModulePageShell
      section="execution_planning"
      sub="priorities"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
