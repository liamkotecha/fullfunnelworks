"use client";

import { useMemo, useCallback } from "react";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { useQuestions } from "@/hooks/useQuestions";
import {
  SectionProgressHeader,
  AutosaveField,
  FieldCard,
  SectionGuidance,
} from "@/components/framework";
import { MeasureTable } from "@/components/framework/MeasureTable";
import { ActionTable, type ActionRow } from "@/components/framework/ActionTable";
import { isFieldAnswered } from "@/lib/framework-nav";
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

interface ModulePageShellProps {
  section: string;
  sub: string;
  title: string;
  intro: string;
  fields: readonly ModuleField[];
  measures?: readonly Measure[];
  /** Extra content rendered between fields and measure table */
  children?: React.ReactNode;
}

export function ModulePageShell({
  section,
  sub,
  title,
  intro,
  fields,
  measures,
  children,
}: ModulePageShellProps) {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);
  const { questions: dbQuestions, loading: questionsLoading } = useQuestions(section, sub);

  const loading = clientLoading || responsesLoading || questionsLoading;

  // Count answered
  const fieldIds = useMemo(() => {
    const ids = fields.map((f) => f.id);
    if (measures?.length) {
      ids.push(`${sub}-measures`);
      ids.push(`${sub}-actions`);
    }
    return ids;
  }, [fields, measures, sub]);

  const answeredCount = useMemo(
    () => fieldIds.filter((id) => isFieldAnswered(id, responses[id])).length,
    [fieldIds, responses]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">No client profile found. Please contact your consultant.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionProgressHeader
        title={title}
        answeredCount={answeredCount}
        totalCount={fieldIds.length}
        lastSavedAt={null}
      />

      <div className="mt-6 bg-white rounded-lg shadow-sm ring-1 ring-slate-200 overflow-hidden p-8 space-y-8">
        <SectionGuidance intro={intro} estimatedMinutes={15} />

        {/* Regular fields */}
        {fields.map((field) => (
          <AutosaveField
            key={field.id}
            fieldId={field.id}
            clientId={clientId}
            section={section}
            sub={sub}
            initialValue={(responses[field.id] as string) ?? ""}
            onSaveSuccess={(result) => setLocalProgress(`${section}-${sub}`, result)}
          >
            {({ value, onChange, isSaving, isSaved, hasError, retry }) => (
              <FieldCard
                fieldId={field.id}
                isAnswered={isFieldAnswered(field.id, value)}
                isSaving={isSaving}
                isSaved={isSaved}
                hasError={hasError}
                onRetry={retry}
              >
                <div className="space-y-2">
                  <h3 className="type-question">{field.question}</h3>
                  {field.type === "select" && field.options ? (
                    <select
                      value={value}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setLocalResponse(field.id, e.target.value);
                      }}
                      className="select-field"
                    >
                      <option value="">Select…</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === "text" ? (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setLocalResponse(field.id, e.target.value);
                      }}
                      placeholder="Type your response…"
                      className="input-field"
                    />
                  ) : (
                    <textarea
                      value={value}
                      onChange={(e) => {
                        onChange(e.target.value);
                        setLocalResponse(field.id, e.target.value);
                      }}
                      placeholder="Type your response…"
                      rows={4}
                      className="textarea-field"
                    />
                  )}
                </div>
              </FieldCard>
            )}
          </AutosaveField>
        ))}

        {/* Extra content (ownership, risk, etc.) */}
        {children}

        {/* Measure table */}
        {measures && measures.length > 0 && (
          <AutosaveField
            fieldId={`${sub}-measures`}
            clientId={clientId}
            section={section}
            sub={sub}
            initialValue={(responses[`${sub}-measures`] as string) ?? ""}
            onSaveSuccess={(result) => setLocalProgress(`${section}-${sub}`, result)}
          >
            {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
              const parsed = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
              return (
                <FieldCard
                  fieldId={`${sub}-measures`}
                  isAnswered={isFieldAnswered(`${sub}-measures`, value)}
                  isSaving={isSaving}
                  isSaved={isSaved}
                  hasError={hasError}
                  onRetry={retry}
                >
                  <div className="space-y-2">
                    <h3 className="type-question">Performance Measures</h3>
                    <p className="type-sub italic">Set current levels, targets and RAG status for each measure.</p>
                    <MeasureTable
                      measures={measures.map((m) => ({ id: m.id, label: m.label }))}
                      value={parsed}
                      onChange={(rows) => {
                        const json = JSON.stringify(rows);
                        onChange(json);
                        setLocalResponse(`${sub}-measures`, json);
                      }}
                    />
                  </div>
                </FieldCard>
              );
            }}
          </AutosaveField>
        )}

        {/* Action table */}
        {measures && measures.length > 0 && (
          <AutosaveField
            fieldId={`${sub}-actions`}
            clientId={clientId}
            section={section}
            sub={sub}
            initialValue={(responses[`${sub}-actions`] as string) ?? ""}
            onSaveSuccess={(result) => setLocalProgress(`${section}-${sub}`, result)}
          >
            {({ value, onChange, isSaving, isSaved, hasError, retry }) => {
              const parsed: ActionRow[] = value ? (() => { try { return JSON.parse(value); } catch { return []; } })() : [];
              return (
                <FieldCard
                  fieldId={`${sub}-actions`}
                  isAnswered={isFieldAnswered(`${sub}-actions`, value)}
                  isSaving={isSaving}
                  isSaved={isSaved}
                  hasError={hasError}
                  onRetry={retry}
                >
                  <div className="space-y-2">
                    <h3 className="type-question">Actions</h3>
                    <p className="type-sub italic">Track actions, owners and due dates.</p>
                    <ActionTable
                      value={parsed}
                      onChange={(rows) => {
                        const json = JSON.stringify(rows);
                        onChange(json);
                        setLocalResponse(`${sub}-actions`, json);
                      }}
                    />
                  </div>
                </FieldCard>
              );
            }}
          </AutosaveField>
        )}
      </div>
    </div>
  );
}
