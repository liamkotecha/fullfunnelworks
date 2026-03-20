"use client";

import { SectionHolding } from "@/components/framework";
import { Settings } from "lucide-react";

export default function ProcessPage() {
  return (
    <SectionHolding
      icon={<Settings className="w-7 h-7 text-brand-blue" strokeWidth={1.5} />}
      title="Process & Execution"
      subSections={[
        "Process Checklist",
        "Sales Methodology",
        "Sales Process Builder",
      ]}
    />
  );
}
