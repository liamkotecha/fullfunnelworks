"use client";

import { SectionHolding } from "@/components/framework";
import { Map } from "lucide-react";

export default function GtmPage() {
  return (
    <SectionHolding
      icon={<Map className="w-7 h-7 text-brand-blue" strokeWidth={1.5} />}
      title="Go-to-Market"
      subSections={[
        "Market Intelligence",
        "Competition Analysis",
      ]}
    />
  );
}
