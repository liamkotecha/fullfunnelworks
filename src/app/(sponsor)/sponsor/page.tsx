"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Speedometer } from "@/components/ui/Speedometer";
import { cn } from "@/lib/utils";

// ── Section definitions (display only — no navigation) ───────

interface SectionDef {
  id: string;
  label: string;
  subKeys: string[];
  color: string;
}

const SECTIONS: SectionDef[] = [
  {
    id: "assessment",
    label: "Assessment",
    subKeys: ["assessment-checklist", "assessment-swot", "assessment-most", "assessment-gap", "assessment-leadership"],
    color: "#6CC2FF",
  },
  {
    id: "people",
    label: "People",
    subKeys: ["people-team", "people-structure", "people-challenges", "people-methodology"],
    color: "#a78bfa",
  },
  {
    id: "product",
    label: "Product",
    subKeys: ["product-challenges", "product-outcomes"],
    color: "#34d399",
  },
  {
    id: "process",
    label: "Process",
    subKeys: ["process-checklist", "process-methodology", "process-builder"],
    color: "#fbbf24",
  },
  {
    id: "roadmap",
    label: "Roadmap",
    subKeys: ["roadmap-roadmap"],
    color: "#a855f7",
  },
  {
    id: "kpis",
    label: "KPIs",
    subKeys: ["kpis-kpis"],
    color: "#14b8a6",
  },
  {
    id: "gtm",
    label: "GTM Playbook",
    subKeys: ["gtm-market", "gtm-competition", "gtm-icp", "gtm-messaging", "gtm-channels", "gtm-pipeline"],
    color: "#6366f1",
  },
];

// ── Types ─────────────────────────────────────────────────────

type SubProgress = Record<string, { answeredCount: number; totalCount: number }>;

interface ProjectData {
  title: string;
  staleness: string;
  activeModules: string[];
  assignedTo?: { name: string; email: string } | null;
  clientId?: { businessName?: string } | null;
}

// ── Animations ────────────────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Helpers ───────────────────────────────────────────────────

function getSectionPercent(subKeys: string[], subProgress: SubProgress): number {
  let answered = 0;
  let total = 0;
  for (const key of subKeys) {
    const p = subProgress[key];
    if (!p) continue;
    answered += p.answeredCount ?? 0;
    total += p.totalCount ?? 0;
  }
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}

function getOverall(sections: SectionDef[], activeModules: string[], subProgress: SubProgress) {
  let answered = 0;
  let total = 0;
  for (const s of sections) {
    if (!activeModules.includes(s.id)) continue;
    for (const key of s.subKeys) {
      const p = subProgress[key];
      if (!p || p.totalCount === 0) continue;
      answered += p.answeredCount ?? 0;
      total += p.totalCount ?? 0;
    }
  }
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}

// ── Component ─────────────────────────────────────────────────

export default function SponsorDashboard() {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [subProgress, setSubProgress] = useState<SubProgress>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sponsor/project")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error);
        } else {
          setProject(d.data.project);
          setSubProgress(d.data.subSectionProgress ?? {});
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load project data");
        setLoading(false);
      });
  }, []);

  const activeModules = project?.activeModules ?? [];

  const activeSections = useMemo(
    () => SECTIONS.filter((s) => activeModules.includes(s.id)),
    [activeModules]
  );

  const overallPercent = useMemo(
    () => getOverall(SECTIONS, activeModules, subProgress),
    [activeModules, subProgress]
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 rounded" />
        <div className="h-64 bg-white rounded-xl" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500 text-lg">
          {error ?? "No project found for your account."}
        </p>
        <p className="text-slate-400 mt-2 text-sm">
          Please contact your consultant if you believe this is an error.
        </p>
      </div>
    );
  }

  const staleness = project.staleness;
  const consultant = project.assignedTo;
  const clientName =
    (project.clientId as { businessName?: string } | null)?.businessName ?? "";

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-8">
      {/* Staleness alert */}
      {(staleness === "stalled" || staleness === "at_risk") && (
        <motion.div variants={fadeUp}>
          <div
            className={cn(
              "rounded-lg px-5 py-4 border",
              staleness === "at_risk"
                ? "bg-red-50 border-red-200"
                : "bg-amber-50 border-amber-200"
            )}
          >
            <p
              className={cn(
                "font-semibold text-sm",
                staleness === "at_risk" ? "text-red-800" : "text-amber-800"
              )}
            >
              {staleness === "at_risk"
                ? "⚠️ This engagement needs attention — your consulting team has been notified."
                : "⏸ This engagement is currently paused — your consulting team has been notified."}
            </p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={fadeUp}>
        <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-1">
          {clientName}
        </p>
        <h2
          className="text-3xl font-bold text-slate-900"
          style={{ letterSpacing: "-0.02em" }}
        >
          {project.title}
        </h2>
        {consultant && (
          <p className="text-slate-500 text-sm mt-1">
            Consultant:{" "}
            <a
              href={`mailto:${consultant.email}`}
              className="font-medium text-slate-700 hover:underline"
            >
              {consultant.name}
            </a>
          </p>
        )}
      </motion.div>

      {/* Speedometer + overall score */}
      <motion.div variants={fadeUp}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Framework Progress
          </p>
          <Speedometer percent={overallPercent} size={200} />
        </div>
      </motion.div>

      {/* Section progress bars */}
      {activeSections.length > 0 && (
        <motion.div variants={fadeUp}>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Section Breakdown
          </h3>
          <div className="space-y-3">
            {activeSections.map((s) => {
              const pct = getSectionPercent(s.subKeys, subProgress);
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm px-5 py-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-slate-800 text-sm">{s.label}</span>
                    <span
                      className="text-sm font-bold tabular-nums"
                      style={{ color: s.color }}
                    >
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Footer note */}
      <motion.div variants={fadeUp}>
        <p className="text-center text-xs text-slate-400 pb-4">
          This is a read-only snapshot. For questions, contact your consultant
          {consultant?.email ? (
            <>
              {" "}at{" "}
              <a href={`mailto:${consultant.email}`} className="underline">
                {consultant.email}
              </a>
            </>
          ) : ""}.
        </p>
      </motion.div>
    </motion.div>
  );
}
