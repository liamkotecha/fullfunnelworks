"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useConsultantResponses } from "@/hooks/useConsultantResponses";
import { WorkstreamTabs } from "@/components/framework/WorkstreamTabs";
import { ActionTable, type ActionRow } from "@/components/framework/ActionTable";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";
import { Skeleton } from "@/components/ui/Skeleton";

const mod = EXECUTION_PLANNING_SECTION.modules.ninetyDay;
const WORKSTREAMS = mod.workstreams;
const TABS = WORKSTREAMS.map((w) => ({ id: w.id, label: `${w.icon} ${w.label}` }));

export default function NinetyDayPage() {
  const { responses, loading, updatedAt } = useConsultantResponses("execution_planning", "ninety-day");
  const hasData = Object.keys(responses).length > 0;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/portal/execution-planning"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Execution Planning
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{mod.number} {mod.title}</h1>
        <p className="text-sm text-slate-500 mt-1">{mod.purpose}</p>
        {updatedAt && (
          <p className="text-xs text-slate-400 mt-2">
            Last updated by consultant: {new Date(updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>

      {!hasData ? (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">Your consultant has not completed this section yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-8">
          <WorkstreamTabs tabs={TABS}>
            {(activeId) => {
              const ws = WORKSTREAMS.find((w) => w.id === activeId)!;
              const actionsKey = `s3-90day-${activeId}-actions`;
              const stored = responses[actionsKey];
              const rows: ActionRow[] = Array.isArray(stored) ? stored : [];

              return (
                <div className="space-y-4">
                  <div className="rounded-lg bg-slate-50 p-4 space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{ws.label}</p>
                    <p className="text-xs text-slate-600">{ws.purpose}</p>
                  </div>
                  {rows.length > 0 ? (
                    <ActionTable value={rows} onChange={() => {}} readOnly />
                  ) : (
                    <p className="text-sm text-slate-400 text-center py-4">No actions set for this workstream yet.</p>
                  )}
                </div>
              );
            }}
          </WorkstreamTabs>

          {/* Measures */}
          {(() => {
            const stored = responses["ninety-day-measures"];
            const rows = Array.isArray(stored) ? stored : [];
            if (rows.length === 0 || !rows.some((r: Record<string, string>) => r.current || r.target)) return null;
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">Key Measures</h3>
                <MeasureTable
                  measures={mod.measures.map((m) => ({ id: m.id, label: m.label }))}
                  value={rows}
                  onChange={() => {}}
                  readOnly
                />
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
