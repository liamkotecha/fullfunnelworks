/**
 * Admin: Client Responses Viewer — /admin/clients/[id]/responses
 * Read-only view of all framework responses submitted by the client.
 * Grouped by section → sub-section, matching the portal design language.
 * Includes consultant notes layer per field.
 */
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  FileText,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Check,
  X,
  Users,
  Building2,
  Zap,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { FRAMEWORK_NAV, type NavSection } from "@/lib/framework-nav";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/Skeleton";
import type { ConsultantNoteDTO } from "@/types";

/* ── types ──────────────────────────────────────────────────── */
interface ResponseData {
  responses: Record<string, string>;
  subSectionProgress: Record<
    string,
    { answeredCount: number; totalCount: number; lastSavedAt?: string }
  >;
  overallProgress: number;
}

/* ── helpers ─────────────────────────────────────────────────── */
function tryParseJSON(str: string): unknown | null {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/* ── smart value renderers ───────────────────────────────────── */

function TeamMembersTable({
  members,
}: {
  members: {
    id?: string;
    name: string;
    title: string;
    department: string;
    email?: string;
  }[];
}) {
  const hasEmail = members.some((m) => m.email);
  return (
    <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="type-overline text-left py-2.5 px-3">Name</th>
            <th className="type-overline text-left py-2.5 px-3">Title</th>
            <th className="type-overline text-left py-2.5 px-3">Department</th>
            {hasEmail && (
              <th className="type-overline text-left py-2.5 px-3">Email</th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((m, i) => (
            <tr
              key={m.id ?? i}
              className="border-b border-slate-100 last:border-0"
            >
              <td className="py-2 px-3 font-medium text-slate-900">
                {m.name || "—"}
              </td>
              <td className="py-2 px-3 text-slate-600">{m.title || "—"}</td>
              <td className="py-2 px-3">
                <span className="badge-info">{m.department || "—"}</span>
              </td>
              {hasEmail && (
                <td className="py-2 px-3 text-slate-500 type-meta">
                  {m.email || "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100">
        <p className="type-meta flex items-center gap-1.5">
          <Users className="w-3 h-3" />
          {members.length} member{members.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
}

function CapabilitySummary({
  data,
  teamMembers,
}: {
  data: Record<
    string,
    {
      sales: number;
      digital: number;
      leadership: number;
      training?: string;
    }
  >;
  teamMembers?: { id: string; name: string }[];
}) {
  const nameMap = new Map(
    (teamMembers ?? []).map((m) => [m.id, m.name])
  );
  const entries = Object.entries(data);
  if (entries.length === 0)
    return <p className="type-meta py-2">No capability data</p>;

  return (
    <div
      className="mt-2 grid gap-3"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
      }}
    >
      {entries.map(([memberId, cap]) => (
        <div
          key={memberId}
          className="rounded-lg border border-slate-200 bg-white p-3"
        >
          <p className="text-sm font-semibold text-slate-900 mb-2">
            {nameMap.get(memberId) || memberId}
          </p>
          <div className="space-y-2">
            {(["sales", "digital", "leadership"] as const).map((skill) => (
              <div key={skill} className="flex items-center gap-2">
                <span className="type-overline w-20">{skill}</span>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cap[skill] ?? 0}%`,
                      background:
                        (cap[skill] ?? 0) >= 80
                          ? "rgb(112,255,162)"
                          : "#141414",
                    }}
                  />
                </div>
                <span className="type-meta w-8 text-right">
                  {cap[skill] ?? 0}
                </span>
              </div>
            ))}
            {cap.training && (
              <p className="type-meta mt-1 border-t border-slate-100 pt-1.5">
                <span className="font-semibold text-slate-600">Training:</span>{" "}
                {cap.training}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function StructureSummary({
  data,
  teamMembers,
}: {
  data: {
    positions?: Record<string, unknown>;
    reportingLines?: Record<string, string | null>;
  };
  teamMembers?: { id: string; name: string }[];
}) {
  const nameMap = new Map(
    (teamMembers ?? []).map((m) => [m.id, m.name])
  );
  const lines = data.reportingLines ?? {};
  const entries = Object.entries(lines).filter(([, v]) => v !== null);
  const posCount = Object.keys(data.positions ?? {}).length;

  return (
    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 type-meta mb-3">
        <Building2 className="w-4 h-4 text-slate-400" />
        <span className="font-semibold text-slate-600">
          {posCount} position{posCount !== 1 ? "s" : ""} mapped
        </span>
      </div>
      {entries.length > 0 && (
        <div className="space-y-1">
          {entries.map(([personId, reportsTo]) => (
            <p key={personId} className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">
                {nameMap.get(personId) || personId}
              </span>
              <span className="text-slate-400 mx-1.5">→</span>
              <span className="font-medium text-slate-900">
                {nameMap.get(reportsTo!) || reportsTo}
              </span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function SmartValue({
  fieldId,
  value,
  allResponses,
}: {
  fieldId: string;
  value: string;
  allResponses: Record<string, string>;
}) {
  // Boolean / checklist
  if (value === "true" || value === "false") {
    const isChecked = value === "true";
    return (
      <div className="flex items-center gap-2 mt-1">
        <div
          className={cn(
            "w-5 h-5 rounded-md flex items-center justify-center",
            isChecked ? "bg-[#141414]" : "bg-slate-100"
          )}
        >
          {isChecked ? (
            <Check className="w-3 h-3" style={{ color: "rgb(112,255,162)" }} />
          ) : (
            <X className="w-3 h-3 text-slate-400" />
          )}
        </div>
        <span
          className={cn(
            "text-sm font-medium",
            isChecked ? "text-slate-900" : "text-slate-400"
          )}
        >
          {isChecked ? "Yes" : "No"}
        </span>
      </div>
    );
  }

  const parsed = tryParseJSON(value);

  if (fieldId === "team-members" && Array.isArray(parsed)) {
    return <TeamMembersTable members={parsed} />;
  }

  if (fieldId === "team-capability" && parsed && !Array.isArray(parsed)) {
    let teamMembers: { id: string; name: string }[] | undefined;
    const tmRaw = allResponses["team-members"];
    if (tmRaw) {
      try {
        teamMembers = JSON.parse(tmRaw);
      } catch {
        /* skip */
      }
    }
    return (
      <CapabilitySummary
        data={
          parsed as Record<
            string,
            {
              sales: number;
              digital: number;
              leadership: number;
              training?: string;
            }
          >
        }
        teamMembers={teamMembers}
      />
    );
  }

  if (fieldId === "company-structure" && parsed && !Array.isArray(parsed)) {
    let teamMembers: { id: string; name: string }[] | undefined;
    const tmRaw = allResponses["team-members"];
    if (tmRaw) {
      try {
        teamMembers = JSON.parse(tmRaw);
      } catch {
        /* skip */
      }
    }
    return (
      <StructureSummary
        data={
          parsed as {
            positions?: Record<string, unknown>;
            reportingLines?: Record<string, string | null>;
          }
        }
        teamMembers={teamMembers}
      />
    );
  }

  // Default: plain text
  return (
    <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap mt-1">
      {value}
    </p>
  );
}

/* ── response field card (portal FieldCard pattern) ────────── */
function ResponseField({
  fieldId,
  value,
  clientId,
  note,
  onNoteChange,
  questionLabel,
  allResponses,
}: {
  fieldId: string;
  value?: string;
  clientId: string;
  note?: string;
  onNoteChange: (fieldId: string, note: string | null) => void;
  questionLabel?: string;
  allResponses: Record<string, string>;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note ?? "");
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraft(note ?? "");
  }, [note]);

  const saveNote = useCallback(
    async (text: string) => {
      if (text.trim() === (note ?? "")) return;
      if (!text.trim()) return;
      setSaving(true);
      try {
        await fetch(`/api/notes/${clientId}/${fieldId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: text.trim() }),
        });
        onNoteChange(fieldId, text.trim());
      } catch {
        /* silent */
      } finally {
        setSaving(false);
      }
    },
    [clientId, fieldId, note, onNoteChange]
  );

  const deleteNote = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/notes/${clientId}/${fieldId}`, { method: "DELETE" });
      onNoteChange(fieldId, null);
      setDraft("");
      setEditing(false);
    } catch {
      /* silent */
    } finally {
      setSaving(false);
    }
  }, [clientId, fieldId, onNoteChange]);

  const handleBlur = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (draft.trim()) saveNote(draft);
    }, 1000);
  }, [draft, saveNote]);

  if (!value || value.trim() === "") return null;

  const hasNote = Boolean(note);

  return (
    <div
      className={cn(
        "rounded-lg border p-5 transition-colors",
        hasNote
          ? "border-amber-200 bg-amber-50/30"
          : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      {/* Question + answered indicator */}
      <div className="flex items-start gap-3">
        {/* Answered dot — matches portal FieldCard top-right indicator */}
        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 bg-[#141414]">
          <Check className="w-3 h-3" style={{ color: "rgb(112,255,162)" }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="type-label text-slate-900">
            {questionLabel || fieldId}
          </p>
          <SmartValue
            fieldId={fieldId}
            value={value}
            allResponses={allResponses}
          />
        </div>

        {/* Note indicator */}
        {hasNote && !editing && (
          <div className="flex-shrink-0 mt-0.5">
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
        )}
      </div>

      {/* Consultant note area */}
      {note && !editing ? (
        <div className="mt-4 ml-8 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="w-3 h-3 text-amber-600" />
            <span className="type-overline text-amber-700">Consultant note</span>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">
            {note}
          </p>
          <div className="flex gap-3 mt-2.5 pt-2 border-t border-amber-200/60">
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1"
            >
              <Pencil className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={deleteNote}
              disabled={saving}
              className="text-xs font-medium text-amber-600 hover:text-red-600 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Delete
            </button>
          </div>
        </div>
      ) : editing ? (
        <div className="mt-4 ml-8 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <div className="flex items-center gap-2 mb-1.5">
            <MessageSquare className="w-3 h-3 text-amber-600" />
            <span className="type-overline text-amber-700">Consultant note</span>
          </div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleBlur}
            rows={3}
            className="textarea-field w-full !bg-white !border-amber-200 focus:!ring-amber-400 text-sm"
            placeholder="Add your note…"
            autoFocus
          />
          <div className="flex gap-3 mt-2 items-center">
            <button
              onClick={() => {
                if (draft.trim()) saveNote(draft);
                setEditing(false);
              }}
              disabled={saving || !draft.trim()}
              className="text-xs font-semibold text-amber-800 hover:text-amber-900 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setDraft(note ?? "");
                setEditing(false);
              }}
              className="text-xs font-medium text-amber-600 hover:text-amber-800 transition-colors"
            >
              Cancel
            </button>
            {saving && (
              <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
            )}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="mt-3 ml-8 flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-amber-600 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add note
        </button>
      )}
    </div>
  );
}

/* ── sub-section accordion (portal AccordionPhase pattern) ─── */
function SubSectionAccordion({
  label,
  fieldIds,
  responses,
  progress,
  defaultOpen,
  clientId,
  notes,
  onNoteChange,
  questionMap,
  allResponses,
}: {
  label: string;
  fieldIds: string[];
  responses: Record<string, string>;
  progress?: {
    answeredCount: number;
    totalCount: number;
    lastSavedAt?: string;
  };
  defaultOpen?: boolean;
  clientId: string;
  notes: Record<string, string>;
  onNoteChange: (fieldId: string, note: string | null) => void;
  questionMap: Record<string, string>;
  allResponses: Record<string, string>;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const filledFields = fieldIds.filter((id) => responses[id]?.trim());
  const pct =
    fieldIds.length > 0
      ? Math.round((filledFields.length / fieldIds.length) * 100)
      : 0;
  const isComplete = pct === 100 && fieldIds.length > 0;
  const isPartial = pct > 0 && pct < 100;

  return (
    <div
      className={cn(
        "rounded-lg border shadow-sm transition-colors overflow-hidden",
        open && isComplete
          ? "border-[rgb(112,255,162)]/30 bg-[rgb(112,255,162)]/[0.03]"
          : open && isPartial
          ? "border-slate-200 bg-slate-50/50"
          : "border-slate-200 bg-white"
      )}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/50"
      >
        {/* Chevron */}
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </motion.div>

        {/* Label */}
        <span className="flex-1 text-sm font-bold text-slate-900">
          {label}
        </span>

        {/* Counter + status */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-xs text-slate-500 tabular-nums">
            {filledFields.length} / {fieldIds.length} answered
          </span>

          {progress?.lastSavedAt && (
            <span className="type-meta flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(progress.lastSavedAt), {
                addSuffix: true,
              })}
            </span>
          )}

          {/* Status indicator — portal pattern */}
          {isComplete ? (
            <Check
              className="w-4 h-4"
              style={{ color: "rgb(112,255,162)" }}
            />
          ) : isPartial ? (
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-slate-300" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-slate-100">
              {filledFields.length === 0 ? (
                <div className="text-center py-6">
                  <p className="type-meta">No responses yet</p>
                </div>
              ) : (
                fieldIds.map((id) => (
                  <ResponseField
                    key={id}
                    fieldId={id}
                    value={responses[id]}
                    clientId={clientId}
                    note={notes[id]}
                    onNoteChange={onNoteChange}
                    questionLabel={questionMap[id]}
                    allResponses={allResponses}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── section block (portal SectionProgressHeader pattern) ──── */
function SectionBlock({
  section,
  responses,
  progress,
  clientId,
  notes,
  onNoteChange,
  questionMap,
  allResponses,
}: {
  section: NavSection;
  responses: Record<string, string>;
  progress: Record<
    string,
    { answeredCount: number; totalCount: number; lastSavedAt?: string }
  >;
  clientId: string;
  notes: Record<string, string>;
  onNoteChange: (fieldId: string, note: string | null) => void;
  questionMap: Record<string, string>;
  allResponses: Record<string, string>;
}) {
  const [open, setOpen] = useState(true);

  const allFieldIds =
    section.children.length > 0
      ? section.children.flatMap((sub) => sub.fieldIds)
      : (section.fieldIds ?? []);
  const allAnswered = allFieldIds.filter((id) =>
    responses[id]?.trim()
  ).length;
  const sectionPct =
    allFieldIds.length > 0
      ? Math.round((allAnswered / allFieldIds.length) * 100)
      : 0;
  const isComplete = sectionPct === 100 && allFieldIds.length > 0;

  if (allFieldIds.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Dark section header — matches portal SectionProgressHeader */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full sticky top-16 z-20 rounded-lg bg-[#141414] px-5 py-4 flex items-center gap-4 text-left group"
      >
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white tracking-[-0.02em]">
            {section.label}
          </h3>
          <p className="text-xs text-white/50 mt-0.5 tabular-nums">
            {allAnswered} of {allFieldIds.length} fields answered
          </p>
        </div>

        {/* Mini progress — matches portal progress bar */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-white/30" />
          <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${sectionPct}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background: isComplete
                  ? "rgb(112,255,162)"
                  : "rgb(108,194,255)",
              }}
            />
          </div>
          <span className="text-xs text-white/60 tabular-nums font-medium w-8 text-right">
            {sectionPct}%
          </span>

          {isComplete ? (
            <CheckCircle2
              className="w-5 h-5"
              style={{ color: "rgb(112,255,162)" }}
            />
          ) : (
            <motion.div
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors" />
            </motion.div>
          )}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2">
              {section.children.length > 0
                ? section.children.map((sub) => (
                    <SubSectionAccordion
                      key={sub.id}
                      label={sub.label}
                      fieldIds={sub.fieldIds}
                      responses={responses}
                      progress={progress[sub.id]}
                      clientId={clientId}
                      notes={notes}
                      onNoteChange={onNoteChange}
                      questionMap={questionMap}
                      allResponses={allResponses}
                    />
                  ))
                : (
                    <SubSectionAccordion
                      label="Responses"
                      fieldIds={section.fieldIds ?? []}
                      responses={responses}
                      defaultOpen
                      clientId={clientId}
                      notes={notes}
                      onNoteChange={onNoteChange}
                      questionMap={questionMap}
                      allResponses={allResponses}
                    />
                  )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── page ───────────────────────────────────────────────────── */
export default function ClientResponsesPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ResponseData | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [questionMap, setQuestionMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/responses/${id}`).then((r) => r.json()),
      fetch(`/api/notes/${id}`).then((r) => r.json()),
      fetch(`/api/questions/map`).then((r) => r.json()),
    ])
      .then(([d, n, qMap]) => {
        setData(d);
        const noteMap: Record<string, string> = {};
        if (Array.isArray(n)) {
          for (const item of n as ConsultantNoteDTO[]) {
            noteMap[item.fieldId] = item.note;
          }
        }
        setNotes(noteMap);
        if (qMap && typeof qMap === "object" && !qMap.error) {
          setQuestionMap(qMap as Record<string, string>);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleNoteChange = useCallback(
    (fieldId: string, note: string | null) => {
      setNotes((prev) => {
        const next = { ...prev };
        if (note === null) {
          delete next[fieldId];
        } else {
          next[fieldId] = note;
        }
        return next;
      });
    },
    []
  );

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 rounded-lg" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-14 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  /* No data */
  if (!data) {
    return (
      <div className="text-center py-16">
        <p className="type-meta">No response data found.</p>
      </div>
    );
  }

  const hasAnyResponse = Object.keys(data.responses).length > 0;

  /* Empty state — matches portal SectionHolding pattern */
  if (!hasAnyResponse) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <FileText className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">
          No responses yet
        </h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          The client hasn&apos;t submitted any framework responses yet. Once
          they begin, their answers will appear here organised by section.
        </p>
      </div>
    );
  }

  const overallPct = Math.round(data.overallProgress ?? 0);
  const isFullyComplete = overallPct === 100;

  return (
    <div className="space-y-6">
      {/* Overall progress — dark header matching portal SectionProgressHeader */}
      <div className="rounded-lg bg-[#141414] px-6 py-5 flex items-center gap-5">
        <div className="flex-1">
          <p className="type-overline text-white/50 mb-2">
            Overall Completion
          </p>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${overallPct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{
                background: isFullyComplete
                  ? "rgb(112,255,162)"
                  : "rgb(108,194,255)",
              }}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFullyComplete ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
            >
              <CheckCircle2
                className="w-6 h-6"
                style={{ color: "rgb(112,255,162)" }}
              />
            </motion.div>
          ) : (
            <Zap className="w-5 h-5 text-white/30" />
          )}
          <span className="font-bold text-2xl text-white tabular-nums">
            {overallPct}%
          </span>
        </div>
      </div>

      {/* Sections */}
      {FRAMEWORK_NAV.map((section) => (
        <SectionBlock
          key={section.id}
          section={section}
          responses={data.responses}
          progress={
            data.subSectionProgress as ResponseData["subSectionProgress"]
          }
          clientId={id}
          notes={notes}
          onNoteChange={handleNoteChange}
          questionMap={questionMap}
          allResponses={data.responses}
        />
      ))}
    </div>
  );
}