"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/notifications/ToastContext";
import { WorkstreamTabs } from "@/components/framework/WorkstreamTabs";
import { ActionTable, type ActionRow } from "@/components/framework/ActionTable";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { EXECUTION_PLANNING_SECTION } from "@/lib/concept-map";

const mod = EXECUTION_PLANNING_SECTION.modules.ninetyDay;
const WORKSTREAMS = mod.workstreams;
const TABS = WORKSTREAMS.map((w) => ({ id: w.id, label: `${w.icon} ${w.label}` }));

export default function AdminNinetyDayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const apiUrl = `/api/projects/${id}/consultant-responses/execution_planning/ninety-day`;

  useEffect(() => {
    fetch(apiUrl)
      .then((r) => r.json())
      .then((d) => {
        setResponses(d.responses ?? {});
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [apiUrl]);

  const setField = useCallback((fieldId: string, value: unknown) => {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    setDirty(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(apiUrl, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Saved");
      setDirty(false);
    } catch (e) {
      toastError("Failed to save", (e as Error).message);
    } finally {
      setSaving(false);
    }
  }, [apiUrl, responses, success, toastError]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-48 rounded" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => router.push(`/consultant/projects/${id}/execution-planning`)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{mod.number} {mod.title}</h1>
          <p className="text-sm text-slate-500 mt-1">{mod.purpose}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!dirty}
          isLoading={saving}
          leftIcon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          Save
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-8 space-y-8">
        <WorkstreamTabs tabs={TABS}>
          {(activeId) => {
            const ws = WORKSTREAMS.find((w) => w.id === activeId)!;
            const actionsKey = `s3-90day-${activeId}-actions`;
            const stored = responses[actionsKey];
            const rows: ActionRow[] = Array.isArray(stored) ? stored : [];

            return (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium text-slate-700">{ws.purpose}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong>Success evidence:</strong> {ws.successEvidence}
                  </p>
                </div>
                <ActionTable
                  value={rows}
                  onChange={(r) => setField(actionsKey, r)}
                />
              </div>
            );
          }}
        </WorkstreamTabs>

        {/* Measures */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700">Key Measures</h3>
          <MeasureTable
            measures={[...mod.measures]}
            value={(() => {
              const stored = responses["ninety-day-measures"];
              return Array.isArray(stored) ? stored : [];
            })()}
            onChange={(rows) => setField("ninety-day-measures", rows)}
          />
        </div>
      </div>

      {dirty && (
        <div className="flex justify-end">
          <Button onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
