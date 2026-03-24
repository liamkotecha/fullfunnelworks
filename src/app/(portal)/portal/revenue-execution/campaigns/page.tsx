"use client";

import { ModulePageShell } from "@/components/framework/ModulePageShell";
import { REVENUE_EXECUTION_SECTION } from "@/lib/concept-map";

const mod = REVENUE_EXECUTION_SECTION.modules.campaigns;

export default function CampaignsPage() {
  return (
    <ModulePageShell
      section="revenue_execution"
      sub="campaigns"
      title={`${mod.number} ${mod.title}`}
      intro={mod.purpose}
      fields={mod.fields}
      measures={mod.measures}
    />
  );
}
