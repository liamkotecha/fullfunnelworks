/**
 * Team Capability Tracker — per-member skill ratings and training notes.
 * Reads team members from the Team Members page (field: "team-members").
 * Stores capability data per member under field "team-capability".
 */
"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Users, ChevronRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader, WhatsNext } from "@/components/framework";
import { Skeleton } from "@/components/ui/Skeleton";
import { NumberRadixSlider } from "@/components/ui/NumberRadixSlider";
import { cn } from "@/lib/utils";
import type { TeamMember } from "../team/page";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type MemberCapability = {
  sales: number;
  digital: number;
  leadership: number;
  training: string;
};

type Capability = Record<string, MemberCapability>; // memberId → MemberCapability

const TEAM_FIELD_ID = "team-members";
const CAP_FIELD_ID  = "team-capability";

const DEFAULT_CAP: MemberCapability = { sales: 50, digital: 50, leadership: 50, training: "" };

// ---------------------------------------------------------------------------
// Slider with label
// ---------------------------------------------------------------------------
function SkillSlider({
  label,
  value,
  onChange,
  accent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  accent: string;
}) {
  return (
    <div className="space-y-1">
      <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-widest", accent)}>
        {label}
      </span>
      <NumberRadixSlider
        value={value}
        onValueChange={onChange}
        min={0}
        max={100}
        step={1}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Capability card for one team member
// ---------------------------------------------------------------------------
function CapabilityCard({
  member,
  cap,
  onChange,
}: {
  member: TeamMember;
  cap: MemberCapability;
  onChange: (updated: MemberCapability) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
    >
      {/* Header */}
      <div className="bg-[#141414] px-5 py-4 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-white/70" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white truncate">
            {member.name || <span className="font-normal opacity-50 italic">Unnamed member</span>}
          </p>
          {(member.title || member.department) && (
            <p className="text-xs text-white/60 truncate">
              {[member.title, member.department].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        {/* Aggregate score badge */}
        <div className="flex-shrink-0 text-center">
          <div className="text-lg font-black text-white tabular-nums">
            {Math.round((cap.sales + cap.digital + cap.leadership) / 3)}
          </div>
          <div className="text-[10px] text-white/50 font-semibold uppercase tracking-wider">avg</div>
        </div>
      </div>

      {/* Sliders */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-5 border-b border-gray-100">
        <SkillSlider
          label="Sales"
          value={cap.sales}
          accent="bg-blue-50 text-blue-700"
          onChange={(v) => onChange({ ...cap, sales: v })}
        />
        <SkillSlider
          label="Digital"
          value={cap.digital}
          accent="bg-emerald-50 text-emerald-700"
          onChange={(v) => onChange({ ...cap, digital: v })}
        />
        <SkillSlider
          label="Leadership"
          value={cap.leadership}
          accent="bg-amber-50 text-amber-700"
          onChange={(v) => onChange({ ...cap, leadership: v })}
        />
      </div>

      {/* Training notes */}
      <div className="px-5 py-4">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
          <BookOpen className="w-3.5 h-3.5" /> Training priorities
        </label>
        <textarea
          value={cap.training}
          onChange={(e) => onChange({ ...cap, training: e.target.value })}
          placeholder="Key training areas, courses, or development goals for this person…"
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none bg-white text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
        />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function TeamCapabilityPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, loading: responsesLoading, setLocalResponse, setLocalProgress } = useResponses(clientId);

  const loading = clientLoading || responsesLoading;

  // Members from the team directory page
  const members: TeamMember[] = useMemo(() => {
    try { return JSON.parse(String(responses[TEAM_FIELD_ID] ?? "[]")); }
    catch { return []; }
  }, [responses]);

  // Capability map: memberId → MemberCapability
  const [capability, setCapability] = useState<Capability>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate capability from saved responses
  useEffect(() => {
    if (loading) return;
    try {
      const saved: Capability = JSON.parse(String(responses[CAP_FIELD_ID] ?? "{}"));
      setCapability(saved);
    } catch {
      setCapability({});
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateMember = useCallback((memberId: string, updated: MemberCapability) => {
    setCapability((prev) => {
      const next = { ...prev, [memberId]: updated };
      setLocalResponse(CAP_FIELD_ID, JSON.stringify(next));
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/responses/${clientId}/people/methodology`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fieldId: CAP_FIELD_ID, value: JSON.stringify(next) }),
          });
          if (res.ok) {
            const result = await res.json();
            setLocalProgress("people-methodology", result);
          }
        } catch { /* silent */ }
      }, 700);
      return next;
    });
  }, [clientId, setLocalResponse, setLocalProgress]);

  // How many members have at least one non-default value
  const filledCount = useMemo(
    () => members.filter((m) => {
      const c = capability[m.id];
      if (!c) return false;
      return c.sales !== 50 || c.digital !== 50 || c.leadership !== 50 || c.training.length > 0;
    }).length,
    [members, capability]
  );

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16">
        <p className="text-slate-500">No client profile found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <SectionProgressHeader
        title="Team Capability Tracker"
        answeredCount={filledCount}
        totalCount={members.length || 1}
        lastSavedAt={null}
      />

      {members.length === 0 ? (
        /* ── Empty state ── */
        <div className="mt-8 bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-lg font-semibold text-gray-700 mb-1">No team members yet</p>
          <p className="text-sm text-gray-500 mb-6">
            Add your team in the Team Members page first, then come back here to rate capabilities.
          </p>
          <Link
            href="/portal/people/team"
            className="inline-flex items-center gap-2 bg-[#141414] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Team Members <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        /* ── Capability cards ── */
        <div className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {members.map((member) => (
              <CapabilityCard
                key={member.id}
                member={member}
                cap={capability[member.id] ?? DEFAULT_CAP}
                onChange={(updated) => updateMember(member.id, updated)}
              />
            ))}
          </AnimatePresence>

          {filledCount === members.length && members.length > 0 && (
            <WhatsNext
              completedTitle="Team Capability Tracker"
              nextTitle="Product Challenges"
              nextHref="/portal/product/challenges"
              nextDescription="Position your product around customer outcomes"
            />
          )}
        </div>
      )}
    </div>
  );
}
