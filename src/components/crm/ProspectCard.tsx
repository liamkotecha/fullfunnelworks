/**
 * ProspectCard — compact card for the pipeline Kanban board.
 * Shows business name, contact, score badge, source, deal value,
 * days in stage, and assigned consultant avatar.
 */
"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { LeadScoreBadge } from "./LeadScoreBadge";
import type { ProspectDTO } from "@/types";

const SOURCE_LABELS: Record<string, string> = {
  web_form: "Web form",
  manual: "Manual",
  referral: "Referral",
  event: "Event",
  other: "Other",
};

function InitialsAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <div
      className="flex items-center justify-center w-6 h-6 rounded-full bg-navy text-white text-[10px] font-bold flex-shrink-0"
      title={name}
    >
      {initials}
    </div>
  );
}

interface ProspectCardProps {
  prospect: ProspectDTO;
  isDragging?: boolean;
}

export function ProspectCard({ prospect, isDragging }: ProspectCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/admin/crm/prospects/${prospect.id}`)}
      className={cn(
        "bg-white rounded-lg border border-gray-200 p-3 cursor-pointer transition-all duration-150",
        "hover:border-gray-300 hover:shadow-sm",
        isDragging && "shadow-lg ring-2 ring-brand-blue/20 rotate-1 scale-[1.02]"
      )}
    >
      {/* Business name + contact */}
      <p className="text-sm font-semibold text-slate-900 leading-tight truncate">
        {prospect.businessName}
      </p>
      <p className="text-xs text-slate-500 mt-0.5 truncate">
        {prospect.contactName}
      </p>

      {/* Score + source badges */}
      <div className="flex items-center gap-2 mt-2.5">
        <LeadScoreBadge score={prospect.leadScore} />
        <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">
          {SOURCE_LABELS[prospect.source] ?? prospect.source}
        </span>
      </div>

      {/* Deal value + days in stage + consultant */}
      <div className="flex items-center justify-between mt-2.5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {prospect.dealValue ? (
            <span className="font-medium text-slate-700">
              {formatPence(prospect.dealValue)}
            </span>
          ) : null}
          <span>{prospect.daysInStage}d in stage</span>
        </div>
        {prospect.assignedConsultant && (
          <InitialsAvatar name={prospect.assignedConsultant.name} />
        )}
      </div>
    </div>
  );
}
