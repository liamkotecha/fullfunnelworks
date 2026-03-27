"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/notifications/ToastContext";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { ActionTable, type ActionRow } from "@/components/framework/ActionTable";
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

interface AdminModuleShellProps {
  section: string;
  sub: string;
  title: string;
  intro: string;
  fields: readonly ModuleField[];
  measures?: readonly Measure[];
  backHref?: string;
  children?: (ctx: {
    responses: Record<string, unknown>;
    setField: (id: string, val: unknown) => void;
  }) => React.ReactNode;
}

export function AdminModuleShell({
  section,
  sub,
  title,
  intro,
  fields,
  measures,
  backHref,
  children,
}: AdminModuleShellProps) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const pathname = usePathname();
  const { success, error: toastError } = useToast();

  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const apiUrl = `/api/projects/${id}/consultant-responses/${section}/${sub}`;
  // Derive back URL from current path so it works in both /admin and /consultant areas
  const back = backHref ?? pathname.split("/").slice(0, -1).join("/");

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

  // Measure table data
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
    return Array.isArray(stored) ? stored as ActionRow[] : [];
  }, [responses, sub]);

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
      {/* Back nav */}
      <button
        onClick={() => router.push(back)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-1">{intro}</p>
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

      {/* Fields */}
      <div className="bg-white rounded-lg shadow-sm ring-1 ring-slate-200 p-8 space-y-8">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              {field.question}
            </label>
            {field.type === "select" && field.options ? (
              <select
                value={(responses[field.id] as string) ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              >
                <option value="">Select…</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : field.type === "text" ? (
              <input
                type="text"
                value={(responses[field.id] as string) ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                placeholder="Type your response…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none"
              />
            ) : (
              <textarea
                value={(responses[field.id] as string) ?? ""}
                onChange={(e) => setField(field.id, e.target.value)}
                rows={4}
                placeholder="Type your response…"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none resize-y"
              />
            )}
          </div>
        ))}

        {/* Render children for special fields (ownership matrix, workstream tabs, etc.) */}
        {children?.({ responses, setField })}

        {/* Measure table */}
        {measures && measures.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Key Measures</h3>
            <MeasureTable
              measures={[...measures]}
              value={measureRows}
              onChange={(rows) => setField(`${sub}-measures`, rows)}
            />
          </div>
        )}

        {/* Action table */}
        {measures && measures.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-700">Action Plan</h3>
            <ActionTable
              value={actionRows}
              onChange={(rows) => setField(`${sub}-actions`, rows)}
            />
          </div>
        )}
      </div>

      {/* Bottom save */}
      {dirty && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
