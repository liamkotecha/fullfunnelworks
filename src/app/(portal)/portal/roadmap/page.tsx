/**
 * 5-Phase Strategic Roadmap — Gantt chart + task rows with live progress.
 * Phase completion is toggled by admin and reflected here.
 */
"use client";

import { useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Check, Circle, ChevronRight } from "lucide-react";
import Link from "next/link";
import { ROADMAP_SECTION } from "@/lib/concept-map";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useResponses } from "@/hooks/useResponses";
import { SectionProgressHeader } from "@/components/framework";
import { Skeleton } from "@/components/ui/Skeleton";

const PHASES = ROADMAP_SECTION.phases;
const PHASE_COMPLETE_FIELDS = PHASES.map((p) => `roadmap_phase_complete_${p.number}`);

// Month spans for each phase on a 12-month timeline
const PHASE_SPANS: { start: number; end: number }[] = [
  { start: 1,  end: 2  },
  { start: 3,  end: 5  },
  { start: 4,  end: 6  },
  { start: 6,  end: 8  },
  { start: 9,  end: 12 },
];

const TOTAL_MONTHS = 12;
const WEEK_W       = 52;   // px per week column
const LEFT_W       = 340;  // px for the label column

const PHASE_COLOURS = [
  { barRaw: "rgb(108,194,255)",  text: "text-[rgb(50,130,190)]" },
  { barRaw: "rgb(167,139,250)",  text: "text-purple-600"         },
  { barRaw: "rgb(251,191,36)",   text: "text-amber-600"          },
  { barRaw: "rgb(112,255,162)",  text: "text-emerald-600"        },
  { barRaw: "rgb(148,163,184)",  text: "text-slate-500"          },
];

// Task rows per phase — maps each phase item to a portal sub-section for live progress
const PHASE_TASKS: { label: string; subId: string; href: string }[][] = [
  [
    { label: "Map people, product, and process capabilities", subId: "assessment-checklist",  href: "/portal/assessment/checklist"   },
    { label: "Identify priority gaps affecting growth",        subId: "assessment-gap",        href: "/portal/assessment/gap"         },
    { label: "Define clear roles and responsibilities",        subId: "people-team",           href: "/portal/people/team"            },
    { label: "Establish baseline metrics and KPIs",            subId: "kpis",                  href: "/portal/kpis"                   },
  ],
  [
    { label: "Launch structured training programmes",          subId: "people-methodology",    href: "/portal/people/methodology"     },
    { label: "Implement coaching and mentoring",               subId: "people-methodology",    href: "/portal/people/methodology"     },
    { label: "Build scalable team capability",                 subId: "people-team",           href: "/portal/people/team"            },
    { label: "Reduce founder dependency",                      subId: "people-structure",      href: "/portal/people/structure"       },
  ],
  [
    { label: "Refresh value proposition and messaging",        subId: "product-challenges",    href: "/portal/product/challenges"     },
    { label: "Link product outcomes to customer impact",       subId: "product-outcomes",      href: "/portal/product/outcomes"       },
    { label: "Train teams on outcome-based selling",           subId: "assessment-leadership", href: "/portal/assessment/leadership"  },
    { label: "Test messaging with existing customers",         subId: "product-challenges",    href: "/portal/product/challenges"     },
  ],
  [
    { label: "Roll out standardised sales playbook",           subId: "process-methodology",   href: "/portal/process/methodology"    },
    { label: "Integrate digital-first tools and workflows",    subId: "process-checklist",     href: "/portal/process/checklist"      },
    { label: "Implement KPI tracking and dashboards",          subId: "kpis",                  href: "/portal/kpis"                   },
    { label: "Standardise operational processes",              subId: "process-builder",       href: "/portal/process/builder"        },
  ],
  [
    { label: "Track KPIs (conversion rates, cycle times, CX)", subId: "kpis",                 href: "/portal/kpis"                   },
    { label: "Refine strategy quarterly from data",             subId: "assessment-most",      href: "/portal/assessment/most"        },
    { label: "Scale processes as team grows",                   subId: "process-builder",      href: "/portal/process/builder"        },
    { label: "Build culture of continuous improvement",         subId: "assessment-leadership",href: "/portal/assessment/leadership"  },
  ],
];

function TaskStatusIcon({ pct }: { pct: number }) {
  if (pct === 100) return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#141414] flex-shrink-0">
      <Check className="w-3 h-3 text-[rgb(112,255,162)]" />
    </span>
  );
  if (pct > 0) return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full border-2 border-amber-400 flex-shrink-0">
      <span className="w-2 h-2 rounded-full bg-amber-400" />
    </span>
  );
  return <Circle className="w-5 h-5 text-slate-200 flex-shrink-0" />;
}
// Column shading alternates by month (mWeeks = weeks-per-month array)
function ColShading({ mWeeks }: { mWeeks: number[] }) {
  return (
    <div className="absolute inset-0 flex pointer-events-none select-none">
      {mWeeks.map((wks, idx) => (
        <div key={idx} style={{ width: wks * WEEK_W, flexShrink: 0 }} className={cn("h-full", idx % 2 === 1 && "bg-slate-50/60")} />
      ))}
    </div>
  );
}
export default function RoadmapPage() {
  const { clientId, loading: clientLoading } = usePortalClient();
  const { responses, subSectionProgress, loading: responsesLoading } = useResponses(clientId);

  const completedPhases = useMemo(
    () => PHASE_COMPLETE_FIELDS.map((f) => responses[f] === "true" || responses[f] === true),
    [responses]
  );
  const completedCount = completedPhases.filter(Boolean).length;
  const loading = clientLoading || responsesLoading;

  // All phases expanded by default
  const [expandedPhases, setExpandedPhases] = useState<Set<number>>(new Set([0, 1, 2, 3, 4]));
  const togglePhase = (i: number) =>
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  /* Calendar start — stored response or first of current month */
  const startDate = useMemo(() => {
    const stored = responses["program_start_date"];
    if (stored) {
      const d = new Date(stored as string);
      if (!isNaN(d.getTime())) return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, [responses]);

  /* Week-level calendar data ────────────────────────────────────── */
  // Weeks per month: ceil(daysInMonth / 7)  →  typically 4 or 5
  const monthWeeks = useMemo(() =>
    Array.from({ length: TOTAL_MONTHS }, (_, i) => {
      const days = new Date(startDate.getFullYear(), startDate.getMonth() + i + 1, 0).getDate();
      return Math.ceil(days / 7);
    }), [startDate]);

  // Cumulative week offsets: weekOffsets[i] = total weeks before month i
  const weekOffsets = useMemo(() => {
    const off = [0];
    for (let i = 0; i < monthWeeks.length; i++) off.push(off[i] + monthWeeks[i]);
    return off;
  }, [monthWeeks]);

  // Total pixel width of the timeline
  const TIMELINE_W = weekOffsets[TOTAL_MONTHS] * WEEK_W;

  // Month header groups (top row) — each spans its week count
  const monthGroups = useMemo(() =>
    Array.from({ length: TOTAL_MONTHS }, (_, i) => {
      const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
      return {
        label: d.toLocaleString("en-GB", { month: "short", year: "numeric" }), // "Mar 2026"
        weeks: monthWeeks[i],
        isOdd: i % 2 === 1,
      };
    }), [startDate, monthWeeks]);

  // Week labels per month (bottom header row) — W1, W2, W3 …
  const weekLabels = useMemo(() => {
    const labels: { label: string; monthIdx: number }[] = [];
    for (let mi = 0; mi < TOTAL_MONTHS; mi++) {
      for (let w = 1; w <= monthWeeks[mi]; w++) {
        labels.push({ label: `W${w}`, monthIdx: mi });
      }
    }
    return labels;
  }, [monthWeeks]);

  /* Drag-to-scroll (no visible scrollbar) */
  const scrollRef   = useRef<HTMLDivElement>(null);
  const isDragging  = useRef(false);
  const dragStartX  = useRef(0);
  const dragScrollL = useRef(0);
  const [grabbing, setGrabbing] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Don't intercept clicks on interactive elements (phase toggle buttons, task links, bar clicks)
    const target = e.target as HTMLElement;
    if (target.closest("button, a, [data-clickable]")) return;

    isDragging.current  = true;
    setGrabbing(true);
    dragStartX.current  = e.clientX;
    dragScrollL.current = scrollRef.current?.scrollLeft ?? 0;
    scrollRef.current?.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current || !scrollRef.current) return;
    scrollRef.current.scrollLeft = dragScrollL.current - (e.clientX - dragStartX.current);
  };
  const onPointerUp = () => { isDragging.current = false; setGrabbing(false); };

  /* Bar pixel geometry helpers — s/e are 1-indexed month numbers */
  const bLeft  = (s: number) => weekOffsets[s - 1] * WEEK_W + 2;
  const bWidth = (s: number, e: number) => (weekOffsets[e] - weekOffsets[s - 1]) * WEEK_W - 4;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <SectionProgressHeader
        title={ROADMAP_SECTION.heading}
        answeredCount={completedCount}
        totalCount={PHASES.length}
        lastSavedAt={null}
      />

      {/* No overflow-hidden on outer wrapper so sticky cols work inside scroll container */}
      <div className="bg-white rounded ring-1 ring-black/[0.06]">
        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          className={cn(
            "overflow-x-auto rounded",
            "[&::-webkit-scrollbar]:hidden [scrollbar-width:none]",
            grabbing ? "cursor-grabbing" : "cursor-grab",
          )}
        >
          {/* ── Month header ───────────────────────────────────────── */}
          <div className="flex border-b border-slate-200" style={{ minWidth: LEFT_W + TIMELINE_W }}>
            <div
              className="sticky left-0 z-20 bg-white border-r border-slate-200 flex items-center px-5"
              style={{ width: LEFT_W, flexShrink: 0, height: 36 }}
            >
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Task</span>
            </div>
            {monthGroups.map((g, idx) => (
              <div
                key={idx}
                style={{ width: g.weeks * WEEK_W, flexShrink: 0 }}
                className={cn(
                  "flex items-center pl-3 border-r border-slate-200 last:border-r-0",
                  g.isOdd && "bg-slate-50/60",
                )}
              >
                <span className="text-[11px] font-bold text-slate-700 tracking-wide whitespace-nowrap">{g.label}</span>
              </div>
            ))}
          </div>

          {/* ── Week header ────────────────────────────────────────── */}
          <div className="flex border-b border-slate-100" style={{ minWidth: LEFT_W + TIMELINE_W }}>
            <div
              className="sticky left-0 z-20 bg-white border-r border-slate-100"
              style={{ width: LEFT_W, flexShrink: 0, height: 28 }}
            />
            {weekLabels.map((wk, idx) => (
              <div
                key={idx}
                style={{ width: WEEK_W, flexShrink: 0 }}
                className={cn(
                  "flex items-center justify-center border-r border-slate-50 last:border-r-0 select-none",
                  wk.monthIdx % 2 === 1 && "bg-slate-50/60",
                )}
              >
                <span className="text-[10px] font-semibold text-slate-400">{wk.label}</span>
              </div>
            ))}
          </div>

          {/* ── Phase rows ─────────────────────────────────────────── */}
          {PHASES.map((phase, i) => {
            const col       = PHASE_COLOURS[i];
            const span      = PHASE_SPANS[i];
            const done      = completedPhases[i];
            const tasks     = PHASE_TASKS[i];
            const expanded  = expandedPhases.has(i);
            const pxLeft  = bLeft(span.start);
            const pxWidth = bWidth(span.start, span.end);

            return (
              <div key={phase.number} className={cn("border-b border-slate-50 last:border-b-0", done && "opacity-75")}>

                {/* Phase header row */}
                <div className="flex" style={{ minWidth: LEFT_W + TIMELINE_W, height: 52 }}>
                  <button
                    onClick={() => togglePhase(i)}
                    style={{ width: LEFT_W, flexShrink: 0 }}
                    className="sticky left-0 z-10 bg-white border-r border-slate-100 flex items-center gap-2.5 px-4 hover:bg-slate-50/60 transition-colors text-left"
                  >
                    <ChevronRight className={cn("w-3.5 h-3.5 text-slate-300 flex-shrink-0 transition-transform duration-200", expanded && "rotate-90")} />
                    <div className={cn("w-6 h-6 rounded flex items-center justify-center flex-shrink-0", done ? "" : "bg-[#1C1C1E]")} style={done ? { background: col.barRaw } : undefined}>
                      {done
                        ? <Check className="w-3 h-3 text-[#1C1C1E]" />
                        : <span className="text-[10px] font-bold text-white">{phase.number}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className={cn("text-sm font-semibold leading-tight truncate", done ? "text-slate-400 line-through" : "text-slate-800")}>
                        {phase.title}
                      </p>
                      <p className={cn("text-[11px] font-medium mt-0.5", done ? "text-emerald-500" : col.text)}>
                        {done ? "Complete" : phase.duration}
                      </p>
                    </div>
                  </button>

                  {/* Phase timeline cell */}
                  <div className="relative" style={{ width: TIMELINE_W, flexShrink: 0 }}>
                    <ColShading mWeeks={monthWeeks} />
                    <motion.div
                      initial={{ scaleX: 0, opacity: 0, y: "-50%" }}
                      animate={{ scaleX: 1, opacity: 1, y: "-50%" }}
                      transition={{ duration: 0.55, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
                      onClick={() => togglePhase(i)}
                      data-clickable="true"
                      style={{
                        position: "absolute",
                        top: "50%",
                        left: pxLeft,
                        width: pxWidth,
                        transformOrigin: "left center",
                        background: done ? col.barRaw : "#1C1C1E",
                        cursor: "pointer",
                      }}
                      className="h-5 rounded shadow-sm"
                    />
                    {/* Phase name — right of bar, vertically centred */}
                    <span
                      style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: pxLeft + pxWidth + 8, pointerEvents: "none" }}
                      className={cn("text-[11px] font-semibold whitespace-nowrap select-none", done ? col.text : "text-slate-500")}
                    >
                      {phase.title}
                    </span>
                  </div>
                </div>

                {/* Task sub-rows */}
                {expanded && tasks.map((task, j) => {
                  const prog       = subSectionProgress?.[task.subId];
                  const answered   = prog?.answeredCount ?? 0;
                  const total      = prog?.totalCount ?? 0;
                  const pct        = total > 0 ? Math.round((answered / total) * 100) : 0;
                  const isComplete = pct === 100;
                  // Completed tasks show a proportional bar: task j of N → (j+1)/N of phase span, min 1 week
                  const completedW = isComplete
                    ? Math.max(WEEK_W, Math.round(pxWidth * (j + 1) / tasks.length))
                    : null;

                  return (
                    <div key={j} className="flex border-t border-slate-50" style={{ minWidth: LEFT_W + TIMELINE_W, height: 38 }}>
                      <Link
                        href={task.href}
                        style={{ width: LEFT_W, flexShrink: 0 }}
                        className="sticky left-0 z-10 bg-[#f9fafb] border-r border-slate-100 flex items-center gap-2 pl-12 pr-4 group/task hover:bg-white transition-colors"
                      >
                        <TaskStatusIcon pct={pct} />
                        <span className={cn(
                          "text-xs leading-snug flex-1 min-w-0 truncate",
                          isComplete ? "text-slate-400 line-through" : "text-slate-600 group-hover/task:text-slate-900",
                        )}>
                          {task.label}
                        </span>
                      </Link>

                      {/* Task timeline cell */}
                      <div className="relative" style={{ width: TIMELINE_W, flexShrink: 0 }}>
                        <ColShading mWeeks={monthWeeks} />
                        <div
                          style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: pxLeft, width: pxWidth }}
                          className="h-3.5 rounded"
                        >
                          <div className="absolute inset-0 rounded" style={{ background: `${col.barRaw}18` }} />
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: completedW !== null ? completedW : `${pct}%` }}
                            transition={{ duration: 0.5, delay: 0.3 + j * 0.05, ease: "easeOut" }}
                            className="absolute inset-y-0 left-0 rounded"
                            style={{ background: col.barRaw, opacity: isComplete ? 1 : 0.6 }}
                          />
                        </div>
                        {pct > 0 && (
                          <span
                            style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: pxLeft + (completedW !== null ? completedW : pxWidth) + 6 }}
                            className={cn("text-[10px] font-bold tabular-nums whitespace-nowrap pointer-events-none select-none", isComplete ? col.text : "text-amber-500")}
                          >
                            {pct}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
