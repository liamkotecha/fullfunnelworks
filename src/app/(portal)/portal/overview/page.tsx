/**
 * /portal/overview — Client home screen.
 * Attention-first: resume card, live progress, in-progress sections.
 */
"use client";

import { useSession } from "next-auth/react";
import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, Search, Users, Target, Settings,
  MapPin, BarChart3, Map, Check, Clock, X, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProgress } from "@/context/ProgressContext";
import { getSubSectionFieldIds } from "@/lib/framework-nav";
import { useProjectContext } from "@/context/ProjectContext";
import { usePortalClient } from "@/hooks/usePortalClient";
import { Speedometer } from "@/components/ui/Speedometer";

// ── Data model ───────────────────────────────────────────────

interface SubDef { key: string; label: string; href: string; }
interface SectionDef {
  id: string; label: string; href: string; desc: string;
  icon: React.ElementType; subs: SubDef[];
  iconColor: string; iconBg: string;
  /** Brand colour class for label text — matches the section page palette */
  labelColor: string;
  /** Brand colour class for progress bar fill */
  barColor: string;
}

const SECTION_DEFS: SectionDef[] = [
  {
    id: "assessment", label: "Assessment", href: "/portal/assessment/checklist",
    desc: "SWOT · MOST · Gap · Leadership", icon: Search,
    iconColor: "text-brand-blue", iconBg: "bg-brand-blue/10",
    labelColor: "text-brand-blue", barColor: "bg-brand-blue",
    subs: [
      { key: "assessment-checklist", label: "Assessment Checklist", href: "/portal/assessment/checklist" },
      { key: "assessment-swot",      label: "SWOT Analysis",        href: "/portal/assessment/swot" },
      { key: "assessment-most",      label: "MOST Analysis",         href: "/portal/assessment/most" },
      { key: "assessment-gap",       label: "Gap Analysis",          href: "/portal/assessment/gap" },
      { key: "assessment-leadership",label: "Leadership Questions",  href: "/portal/assessment/leadership" },
    ],
  },
  {
    id: "people", label: "People", href: "/portal/people/team",
    desc: "Team · Structure · Challenges · Capability", icon: Users,
    iconColor: "text-brand-pink", iconBg: "bg-brand-pink/10",
    labelColor: "text-brand-pink", barColor: "bg-brand-pink",
    subs: [
      { key: "people-team",        label: "Team Members",           href: "/portal/people/team" },
      { key: "people-structure",   label: "Company Structure",       href: "/portal/people/structure" },
      { key: "people-challenges",  label: "Challenges & Strategy",   href: "/portal/people/challenges" },
      { key: "people-methodology", label: "Team Capability Tracker",  href: "/portal/people/methodology" },
    ],
  },
  {
    id: "product", label: "Product", href: "/portal/product/challenges",
    desc: "Challenges · Outcomes", icon: Target,
    iconColor: "text-brand-green", iconBg: "bg-brand-green/10",
    labelColor: "text-brand-green", barColor: "bg-brand-green",
    subs: [
      { key: "product-challenges", label: "Product Challenges", href: "/portal/product/challenges" },
      { key: "product-outcomes",   label: "Outcome Mapper",     href: "/portal/product/outcomes" },
    ],
  },
  {
    id: "process", label: "Process", href: "/portal/process/checklist",
    desc: "Checklist · Methodology · Builder", icon: Settings,
    iconColor: "text-brand-blue", iconBg: "bg-brand-blue/10",
    labelColor: "text-brand-blue", barColor: "bg-brand-blue",
    subs: [
      { key: "process-checklist",   label: "Process Checklist",  href: "/portal/process/checklist" },
      { key: "process-methodology", label: "Sales Methodology",  href: "/portal/process/methodology" },
      { key: "process-builder",     label: "Process Builder",    href: "/portal/process/builder" },
    ],
  },
  {
    id: "roadmap", label: "Roadmap", href: "/portal/roadmap",
    desc: "5-phase growth plan", icon: MapPin,
    iconColor: "text-brand-pink", iconBg: "bg-brand-pink/10",
    labelColor: "text-brand-pink", barColor: "bg-brand-pink",
    subs: [{ key: "roadmap-roadmap", label: "Roadmap", href: "/portal/roadmap" }],
  },
  {
    id: "kpis", label: "KPIs", href: "/portal/kpis",
    desc: "Company & department metrics", icon: BarChart3,
    iconColor: "text-brand-green", iconBg: "bg-brand-green/10",
    labelColor: "text-brand-green", barColor: "bg-brand-green",
    subs: [{ key: "kpis-kpis", label: "KPIs", href: "/portal/kpis" }],
  },
  {
    id: "gtm", label: "GTM Playbook", href: "/portal/gtm/market",
    desc: "Market Intelligence · Competition", icon: Map,
    iconColor: "text-brand-blue", iconBg: "bg-brand-blue/10",
    labelColor: "text-brand-blue", barColor: "bg-brand-blue",
    subs: [
      { key: "gtm-market",      label: "Market Intelligence", href: "/portal/gtm/market" },
      { key: "gtm-competition", label: "Competition",         href: "/portal/gtm/competition" },
    ],
  },
];

function getGreeting(name: string) {
  const h = new Date().getHours();
  const tod = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  return `Good ${tod}, ${name}`;
}

function getSubPercent(
  sub: SubDef,
  progress: Record<string, { answeredCount: number; totalCount: number; lastSavedAt: string | null }>
) {
  const p = progress[sub.key];
  // Use framework-nav field count as fallback when sub hasn't been visited yet
  const total = p?.totalCount || getSubSectionFieldIds(sub.key).length;
  if (total === 0) return 0;
  return Math.round(((p?.answeredCount ?? 0) / total) * 100);
}

function getSectionPercent(
  subs: SubDef[],
  progress: Record<string, { answeredCount: number; totalCount: number; lastSavedAt: string | null }>
) {
  if (subs.length === 0) return 0;
  // Average of child percentages — matches sidebar calculation
  const percentages = subs.map((sub) => getSubPercent(sub, progress));
  return Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: "easeOut" } } };

// ── RAG badge ────────────────────────────────────────────────

function RagBadge({ percent, hasSubs }: { percent: number; hasSubs: boolean }) {
  if (!hasSubs) return <Clock className="w-3.5 h-3.5 text-slate-300 flex-shrink-0 mt-0.5" />;
  if (percent >= 67) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
        {percent === 100 ? "Complete" : "On track"}
      </span>
    );
  }
  if (percent >= 33) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#141414] bg-brand-blue/10 border border-brand-blue/20 rounded-md px-1.5 py-0.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-blue flex-shrink-0" />
        In progress
      </span>
    );
  }
  if (percent > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
        Behind
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-md px-1.5 py-0.5 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
      Not started
    </span>
  );
}

// ── Circular progress ring (motion.dev-style) ─────────────────

function CircularProgress({ percent }: { percent: number }) {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgb(108,194,255)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.2 }}
        />
      </svg>
      {/* Centred % label */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white tabular-nums">{percent}%</span>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function PortalOverviewPage() {
  const { data: session } = useSession();
  const { progress, loaded: progressLoaded, refreshAll } = useProgress();
  const { staleness } = useProjectContext();
  const { clientId, activeModules } = usePortalClient();
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  // Team progress
  const [teamData, setTeamData] = useState<{
    teamMode: boolean;
    members: Array<{ userId: string; name: string; role: string; isComplete: boolean }>;
    allSubmitted: boolean;
  } | null>(null);
  const [teamLoading, setTeamLoading] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    setTeamLoading(true);
    fetch(`/api/team/${clientId}`)
      .then((r) => r.json())
      .then((d) => { setTeamData(d); setTeamLoading(false); })
      .catch(() => { setTeamLoading(false); });
  }, [clientId]);

  // Nudge banner dismiss state (sessionStorage)
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setNudgeDismissed(sessionStorage.getItem("nudge_dismissed") === "1");
    }
  }, []);
  const dismissNudge = () => {
    sessionStorage.setItem("nudge_dismissed", "1");
    setNudgeDismissed(true);
  };

  // Re-fetch server progress every time the overview page mounts
  // This catches saves that completed after navigating away from other pages
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const sectionData = useMemo(() =>
    SECTION_DEFS.map((s) => ({
      ...s,
      percent: getSectionPercent(s.subs, progress),
    })), [progress]);

  // Overall completion across all tracked subsections
  const { overallPercent, overallAnswered, overallTotal } = useMemo(() => {
    const allSubs = SECTION_DEFS.flatMap((s) => s.subs);
    let ans = 0;
    let tot = 0;
    for (const sub of allSubs) {
      const p = progress[sub.key];
      ans += p?.answeredCount ?? 0;
      // Use framework-nav field count as fallback for unvisited subs
      tot += p?.totalCount || getSubSectionFieldIds(sub.key).length;
    }
    return { overallPercent: tot > 0 ? Math.round((ans / tot) * 100) : 0, overallAnswered: ans, overallTotal: tot };
  }, [progress]);

  // Last touched subsection — for resume card
  const resumeTarget = useMemo(() => {
    let best: { sub: SubDef; savedAt: Date; sectionLabel: string; percent: number } | null = null;
    for (const section of SECTION_DEFS) {
      for (const sub of section.subs) {
        const p = progress[sub.key];
        if (!p?.lastSavedAt) continue;
        const d = new Date(p.lastSavedAt);
        if (!best || d > best.savedAt) {
          best = {
            sub,
            savedAt: d,
            sectionLabel: section.label,
            percent: getSectionPercent(section.subs, progress),
          };
        }
      }
    }
    return best;
  }, [progress]);

  // In-progress sections (percent 1–99)
  const inProgress = useMemo(() =>
    sectionData.filter((s) => s.percent > 0 && s.percent < 100), [sectionData]);

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="space-y-6 max-w-5xl mx-auto"
    >
      {/* Nudge banner — warm re-engagement (7–13 days inactive) */}
      {staleness === "nudge" && !nudgeDismissed && resumeTarget && (
        <motion.div variants={fadeUp}>
          <div className="relative bg-[#141414]/5 border border-brand-blue/30 rounded-lg px-5 py-4 flex items-center gap-4">
            <span className="text-lg flex-shrink-0">👋</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">
                Welcome back — here&apos;s where you left off
              </p>
              <p className="text-slate-500 text-sm mt-0.5">
                You haven&apos;t visited in a while. Ready to pick up from{" "}
                <span className="font-medium text-slate-700">{resumeTarget.sub.label}</span>?
              </p>
            </div>
            <Link
              href={resumeTarget.sub.href}
              className="flex-shrink-0 px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-brand-blue/90 transition-colors"
            >
              Resume
            </Link>
            <button
              onClick={dismissNudge}
              className="flex-shrink-0 p-1 rounded hover:bg-slate-200/60 transition-colors text-slate-400 hover:text-slate-600"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Greeting row + Speedometer */}
      <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-1">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-slate-900" style={{ letterSpacing: "-0.02em" }}>
            {getGreeting(firstName)}
          </h1>
          <p className="text-[15px] text-slate-400 mt-0.5">
            {overallPercent === 0
              ? "Let's get your Growth Strategy Framework started."
              : `${overallAnswered} of ${overallTotal} questions answered across your framework.`}
          </p>
        </div>
        {/* Maturity speedometer — only once some progress loaded */}
        {progressLoaded && (
          <div className="flex-shrink-0 flex flex-col items-center">
            <Speedometer percent={overallPercent} size={160} />
            <p className="text-xs text-slate-400 mt-0.5 tracking-wide uppercase font-medium">Maturity Score</p>
          </div>
        )}
      </motion.div>

      {/* Resume hero — only shown if user has started something */}
      {resumeTarget && (
        <motion.div variants={fadeUp}>
          <Link href={resumeTarget.sub.href} className="block group">
            <div className="bg-[#141414] rounded-lg p-5 flex items-center gap-5">
              {/* Circular progress ring */}
              <CircularProgress percent={resumeTarget.percent} />
              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-1">
                  Resume where you left off
                </p>
                <h2 className="text-lg font-bold text-white truncate" style={{ letterSpacing: "-0.02em" }}>
                  {resumeTarget.sub.label}
                </h2>
                <p className="text-sm text-white/50 mt-0.5">{resumeTarget.sectionLabel}</p>
              </div>
              {/* Arrow */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* All sections grid */}
      <motion.div variants={fadeUp}>
        {/* Team progress card — only when team mode is active */}
        {teamLoading && clientId ? (
          <div className="mb-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-4 h-4 bg-slate-200 rounded" />
                <div className="h-3.5 w-40 bg-slate-200 rounded" />
              </div>
              <div className="space-y-2.5">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-200" />
                      <div className="h-3 w-28 bg-slate-200 rounded" />
                    </div>
                    <div className="h-3 w-16 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : teamData?.teamMode && teamData.members.length > 0 ? (
          <div className="mb-6">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-900">Team Assessment Progress</h3>
              </div>
              <div className="space-y-2.5">
                {teamData.members.map((m) => {
                  const isYou = m.userId === session?.user?.id;
                  return (
                    <div key={m.userId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                          {m.name[0]?.toUpperCase()}
                        </div>
                        <span className="text-sm text-slate-700 truncate">
                          {m.name}{isYou ? " (you)" : ""}
                        </span>
                      </div>
                      {m.isComplete ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <Check className="w-3 h-3" /> Submitted
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-medium text-[#141414]">
                          <Clock className="w-3 h-3" /> In progress
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
                {teamData.members.filter((m) => m.isComplete).length} of {teamData.members.length} submitted
              </div>
            </div>
          </div>
        ) : null}

        <p className="type-overline mb-3">Your Framework</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sectionData.map((s) => {
            const Icon = s.icon;
            const isComplete = s.percent >= 100;
            // Backward compat: if activeModules is empty, all modules are unlocked
            const isLocked = activeModules.length > 0 && !activeModules.includes(s.id);

            const cardContent = (
              <div
                className={cn(
                  "rounded-lg border p-4 shadow",
                  isLocked
                    ? "border-slate-100 bg-white opacity-40 select-none cursor-default"
                    : cn(
                        "transition-colors group",
                        isComplete
                          ? "border-brand-green/30 bg-brand-green/5 hover:bg-brand-green/10"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      )
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#141414]">
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : (
                      <Icon className={cn("w-4 h-4", s.iconColor)} />
                    )}
                  </div>
                  {!isLocked && <RagBadge percent={s.percent} hasSubs={s.subs.length > 0} />}
                </div>
                <p className="text-[15px] font-semibold text-slate-600">
                  {s.label}
                </p>
                <p className="text-sm text-slate-700 mt-0.5 mb-3">{s.desc}</p>
                {!isLocked && s.subs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", s.percent > 0 ? "bg-[#141414]" : "bg-slate-200")}
                        initial={{ width: 0 }}
                        animate={{ width: `${s.percent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                    <span className={cn(
                      "text-xs tabular-nums font-semibold flex-shrink-0",
                      s.percent > 0 ? "text-slate-600" : "text-slate-400"
                    )}>
                      {s.percent}%
                    </span>
                  </div>
                )}
                {!isLocked && s.subs.length === 0 && (
                  <span className="text-xs text-slate-400">Coming soon</span>
                )}
                {isLocked && (
                  <span className="text-xs text-slate-400">Not included in your plan</span>
                )}
              </div>
            );

            if (isLocked) {
              return (
                <div key={s.id} className="relative group/locked">
                  {cardContent}
                  <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 text-center text-xs bg-[#141414] text-white px-3 py-2 rounded-lg opacity-0 group-hover/locked:opacity-100 transition-opacity z-10">
                    This module isn&apos;t included in your current plan. Contact your consultant to unlock it.
                  </div>
                </div>
              );
            }

            return (
              <Link key={s.id} href={s.href}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </motion.div>

      {/* First-time empty state CTA — only show once progress has loaded to avoid flash */}
      {progressLoaded && !resumeTarget && overallPercent === 0 && (
        <motion.div variants={fadeUp}>
          <div className="rounded-lg shadow-sm ring-1 ring-slate-200 bg-white p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-lg bg-brand-blue/10 flex items-center justify-center flex-shrink-0">
              <Search className="w-4 h-4 text-brand-blue" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Start with the Assessment Checklist</p>
              <p className="text-sm text-slate-500 mt-0.5">
                The quickest section to complete — 5 questions, ~10 minutes. A great first win.
              </p>
              <Link
                href="/portal/assessment/checklist"
                className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors"
              >
                Begin checklist <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

