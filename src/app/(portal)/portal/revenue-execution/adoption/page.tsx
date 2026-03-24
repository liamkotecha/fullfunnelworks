"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.adoption;

export default function AdoptionPage() {
  return (
    <ModulePageShell
      section="revenue_execution"
      sub="adoption"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
