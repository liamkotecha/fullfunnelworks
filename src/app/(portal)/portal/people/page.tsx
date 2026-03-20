"use client";

import { SectionHolding } from "@/components/framework";
import { Users } from "lucide-react";

export default function PeoplePage() {
  return (
    <SectionHolding
      icon={<Users className="w-7 h-7 text-brand-blue" strokeWidth={1.5} />}
      title="People Development"
      subSections={[
        "Team Members",
        "Company Structure",
        "Challenges & Strategy",
        "Team Capability Tracker",
      ]}
    />
  );
}
