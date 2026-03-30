/**
 * Team Members — add and manage all employees in one place.
 * These members are referenced in the Capability Tracker and Company Structure pages.
 */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Plus, Trash2, GripVertical, Users, AlertCircle, ArrowLeft } from "lucide-react";
import { Reorder, useDragControls, motion } from "framer-motion";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader, WhatsNext } from "@/components/framework";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------
export type TeamMember = {
  id: string;
  name: string;
  title: string;
  department: string;
  email: string;
};

const COLUMNS: {
  key: keyof Omit<TeamMember, "id">;
  label: string;
  placeholder: string;
  pill: string;
  width: string;
}[] = [
  { key: "name",       label: "Name",       placeholder: "e.g. Sarah Johnson",      pill: "text-[#141414] bg-brand-blue/10 ring-1 ring-brand-blue/20",    width: "min-w-[160px]" },
  { key: "title",      label: "Job Title",  placeholder: "e.g. Account Executive",  pill: "text-[#141414] bg-brand-pink/10 ring-1 ring-brand-pink/20",   width: "min-w-[160px]" },
  { key: "department", label: "Department", placeholder: "e.g. Sales",              pill: "text-[#141414] bg-[#141414]/5 ring-1 ring-[#141414]/10",      width: "min-w-[140px]" },
  { key: "email",      label: "Email",      placeholder: "e.g. sarah@company.com",  pill: "text-[#141414] bg-brand-green/10 ring-1 ring-brand-green/20", width: "min-w-[200px]" },
];

function newMember(): TeamMember {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    name: "", title: "", department: "", email: "",
  };
}

const TEAM_FIELD_ID = "team-members";

// ---------------------------------------------------------------------------
// Auto-resizing cell input (single line for team members)
// ---------------------------------------------------------------------------
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function CellInput({
  value, placeholder, onChange, type = "text",
}: { value: string; placeholder: string; onChange: (v: string) => void; type?: string }) {
  const [touched, setTouched] = useState(false);
  const isEmailInvalid = type === "email" && touched && value.trim() !== "" && !EMAIL_RE.test(value);

  return (
    <div className="relative w-full">
      <input
        type={type}
        value={value}
        onChange={(e) => { onChange(e.target.value); }}
        onBlur={() => setTouched(true)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-400 focus:ring-0 py-0",
          isEmailInvalid ? "text-red-500" : "text-gray-900"
        )}
      />
      {isEmailInvalid && (
        <span
          title="Invalid email address"
          className="absolute right-0 top-1/2 -translate-y-1/2 text-red-400"
        >
          <AlertCircle className="w-3.5 h-3.5" />
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draggable row
// ---------------------------------------------------------------------------
function DraggableRow({
  member,
  idx,
  onUpdate,
  onDelete,
}: {
  member: TeamMember;
  idx: number;
  onUpdate: (id: string, key: keyof Omit<TeamMember, "id">, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const controls = useDragControls();

  return (
    <Reorder.Item
      as="tr"
      value={member}
      dragListener={false}
      dragControls={controls}
      whileDrag={{
        scale: 1.025,
        opacity: 0.92,
        boxShadow: "0 12px 40px rgba(0,0,0,0.14)",
        backgroundColor: "#ffffff",
        zIndex: 50,
        rotate: 0.4,
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className="group bg-white border-b border-gray-100 last:border-0"
      style={{ position: "relative" }}
    >
      <td className="px-3 py-2.5 align-middle w-9">
        <div className="flex flex-col items-center gap-0.5">
          <motion.div
            onPointerDown={(e) => controls.start(e)}
            className="cursor-grab active:cursor-grabbing touch-none"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.95 }}
          >
            <GripVertical className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </motion.div>
          <span className="text-[10px] font-semibold text-gray-300 select-none">{idx + 1}</span>
        </div>
      </td>

      {COLUMNS.map((col) => (
        <td key={col.key} className={cn("px-4 py-2.5 align-middle", col.width)}>
          <CellInput
            value={member[col.key]}
            placeholder={col.placeholder}
            onChange={(v) => onUpdate(member.id, col.key, v)}
            type={col.key === "email" ? "email" : "text"}
          />
        </td>
      ))}

      <td className="px-3 py-2.5 align-middle w-10">
        <button
          onClick={() => onDelete(member.id)}
          title="Remove member"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </td>
    </Reorder.Item>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TeamMembersPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, hasFetched, setLocalResponse } = useResponses(clientId);

  const loading = clientLoading || responsesLoading;

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [initialised, setInitialised] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Wait until useResponses has completed a real fetch (hasFetched=true) so we
    // never hydrate from an empty-responses state that exists before the first load.
    if (!hasFetched || initialised) return;
    const raw = responses[TEAM_FIELD_ID];
    if (raw && typeof raw === "string" && raw.trim().startsWith("[")) {
      try {
        const parsed: TeamMember[] = JSON.parse(raw);
        if (parsed.length > 0) { setMembers(parsed); setInitialised(true); return; }
      } catch { /* fall through */ }
    }
    setMembers([newMember()]);
    setInitialised(true);
  }, [hasFetched, responses, initialised]);

  const save = useCallback(
    (next: TeamMember[]) => {
      if (!clientId) return;
      // Update local state immediately so navigating away & back reflects edits
      const value = JSON.stringify(next);
      setLocalResponse(TEAM_FIELD_ID, value);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await fetch(`/api/responses/${clientId}/people/team`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId: TEAM_FIELD_ID, value }),
        });
      }, 700);
    },
    [clientId, setLocalResponse],
  );

  const reorder = useCallback((next: TeamMember[]) => { setMembers(next); save(next); }, [save]);

  const updateMember = useCallback(
    (id: string, key: keyof Omit<TeamMember, "id">, value: string) => {
      setMembers((prev) => {
        const next = prev.map((m) => (m.id === id ? { ...m, [key]: value } : m));
        save(next);
        return next;
      });
    },
    [save],
  );

  const addMember = useCallback(() => {
    setMembers((prev) => { const next = [...prev, newMember()]; save(next); return next; });
  }, [save]);

  const deleteMember = useCallback(
    (id: string) => {
      setMembers((prev) => {
        const next = prev.filter((m) => m.id !== id);
        const final = next.length === 0 ? [newMember()] : next;
        save(final);
        return final;
      });
    },
    [save],
  );

  const filledCount = useMemo(
    () => members.filter((m) => m.name.trim()).length,
    [members],
  );

  const hasComplete = useMemo(
    () => members.some((m) => m.name.trim() && m.title.trim()),
    [members],
  );

  const isEmpty = useMemo(
    () => members.every((m) => !m.name.trim()),
    [members],
  );

  if (loading || !initialised) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500 text-sm">No client profile found.</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/portal/people"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors mb-4"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to People
      </Link>
      <SectionProgressHeader
        title="Team Members"
        answeredCount={filledCount}
        totalCount={Math.max(members.length, 1)}
        lastSavedAt={null}
      />

      <div className="mt-5 mb-4">
        <p className="text-sm text-gray-500">
          Add everyone in your team here. These records are used across the Company Structure and Team Capability Tracker sections.
        </p>
      </div>

      {isEmpty && (
        <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No team members yet</p>
          <p className="text-xs text-slate-400">
            Start by typing into the first row below, or click <strong>Add team member</strong> to grow the list.
          </p>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="w-9 px-3 py-3" />
                {COLUMNS.map((col) => (
                  <th key={col.key} scope="col" className="px-4 py-3 font-semibold">
                    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest", col.pill)}>
                      {col.label}
                    </span>
                  </th>
                ))}
                <th scope="col" className="w-10 px-3 py-3" />
              </tr>
            </thead>

            <Reorder.Group as="tbody" axis="y" values={members} onReorder={reorder}>
              {members.map((member, idx) => (
                <DraggableRow
                  key={member.id}
                  member={member}
                  idx={idx}
                  onUpdate={updateMember}
                  onDelete={deleteMember}
                />
              ))}
            </Reorder.Group>
          </table>
        </div>

        <div className="bg-gray-50 border-t border-gray-200 px-5 py-3">
          <button
            onClick={addMember}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors"
          >
            <span className="w-5 h-5 rounded-full border-2 border-dashed border-gray-300 group-hover:border-gray-600 flex items-center justify-center transition-colors flex-shrink-0">
              <Plus className="w-3 h-3" />
            </span>
            Add team member
          </button>
        </div>
      </div>

      {hasComplete && (
        <div className="mt-6">
          <WhatsNext
            completedTitle="Team Members"
            nextTitle="Company Structure"
            nextHref="/portal/people/structure"
            nextDescription="Define reporting lines and your organisational hierarchy"
          />
        </div>
      )}
    </div>
  );
}
