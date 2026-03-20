"use client";

import { SectionHolding } from "@/components/framework";
import { Target } from "lucide-react";

export default function ProductPage() {
  return (
    <SectionHolding
      icon={<Target className="w-7 h-7 text-brand-blue" strokeWidth={1.5} />}
      title="Product & Proposition"
      subSections={[
        "Product Challenges",
        "Outcome Mapper",
      ]}
    />
  );
}
