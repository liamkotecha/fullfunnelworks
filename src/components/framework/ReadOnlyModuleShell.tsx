"use client";

import { useMemo } from "react";
import { useConsultantResponses } from "@/hooks/useConsultantResponses";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { ActionTable } from "@/components/framework/ActionTable";
import { Skeleton } from "@/components/ui/Skeleton";

interface ModuleField {
  id: string;
  type: string;
  question: string;
  options?: readonly string[];
}

interface Measure {
  id: string;
  label: string;
}

interface ReadOnlyModuleShellProps {
  section: string;
  sub: string;
  title: string;
  intro: string;
  fields: readonly ModuleField[];
  measures?: readonly Measure[];
  children?: (responses: Record<string, unknown>) => React.ReactNode;
}

export function ReadOnlyModuleShell({
  section,
  sub,
  title,
  intro,
  fields,
  measures,
  children,
}: ReadOnlyModuleShellProps) {
  const { responses, loading, updatedAt } = useConsultantResponses(section, sub);

  const measureRows = useMemo(() => {
    if (!measures?.length) return [];
    const stored = responses[`${sub}-measures`];
    const arr = Array.isArray(stored) ? stored : [];
    return measures.map((m) => {
      const existing = arr.find((r: Record<string, string>) => r.id === m.id);
      return existing ?? { id: m.id, label: m.label, current: "", target: "", rag: "", owner: "" };
    });
  }, [measures, responses, sub]);

  const actionRows = useMemo(() => {
    const stored = responses[`${sub}-actions`];
    return Array.isArray(stored) ? stored : [];
  }, [responses, sub]);

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
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-1">{intro}</p>
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
          {/* Regular fields (read-only) */}
          {fields.map((field) => {
            const val = (responses[field.id] as string) ?? "";
            if (!val) return null;
            return (
              <div key={field.id} className="space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{field.question}</p>
                <p className="text-sm text-slate-900 bg-slate-50 rounded-md px-4 py-3 leading-relaxed whitespace-pre-wrap">{val}</p>
              </div>
            );
          })}

          {/* Custom children (matrices, workstream tabs, etc.) */}
          {children?.(responses)}

          {/* Measure table */}
          {measures && measures.length > 0 && measureRows.some((r) => r.current || r.target) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Key Measures</h3>
              <MeasureTable
                measures={[...measures]}
                value={measureRows}
                onChange={() => {}}
                readOnly
              />
            </div>
          )}

          {/* Action table */}
          {actionRows.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-700">Action Plan</h3>
              <ActionTable value={actionRows} onChange={() => {}} readOnly />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
