"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.reset;

export default function ResetPage() {
  return (
    <ModulePageShell
      section="execution_planning"
      sub="reset"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
