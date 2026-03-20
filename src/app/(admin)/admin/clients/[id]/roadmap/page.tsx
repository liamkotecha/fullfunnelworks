/**
 * Admin: Roadmap Phase Manager — /admin/clients/[id]/roadmap
 * Admin can mark each of the 5 strategic phases as complete.
 * Completion state is stored in the client's IntakeResponse and
 * reflected live on the client portal roadmap page.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Zap, CheckCircle2 } from "lucide-react";
import { ROADMAP_SECTION } from "@/lib/concept-map";
import { cn } from "@/lib/utils";

const PHASES = ROADMAP_SECTION.phases;

const PHASE_SPANS: { start: number; end: number }[] = [
  { start: 1,  end: 2  },
  { start: 3,  end: 5  },
  { start: 4,  end: 6  },
  { start: 6,  end: 8  },
  { start: 9,  end: 12 },
];
const TOTAL_MONTHS = 12;
const MONTHS = Array.from({ length: TOTAL_MONTHS }, (_, i) => i + 1);

const PHASE_COLOURS = [
  { bar: "bg-[rgb(108,194,255)]",  barRaw: "rgb(108,194,255)",  text: "text-[rgb(50,130,190)]",  dot: "bg-[rgb(108,194,255)]",  pill: "bg-[rgb(108,194,255)]/15 text-[rgb(50,120,180)]",  glow: "shadow"  },
  { bar: "bg-purple-400",          barRaw: "rgb(167,139,250)",  text: "text-purple-600",          dot: "bg-purple-400",          pill: "bg-purple-50 text-purple-600",                      glow: "shadow"  },
  { bar: "bg-amber-400",           barRaw: "rgb(251,191,36)",   text: "text-amber-600",           dot: "bg-amber-400",           pill: "bg-amber-50 text-amber-600",                        glow: "shadow"  },
  { bar: "bg-[rgb(112,255,162)]",  barRaw: "rgb(112,255,162)", text: "text-emerald-600",         dot: "bg-[rgb(112,255,162)]",  pill: "bg-[rgb(112,255,162)]/15 text-emerald-600",         glow: "shadow"  },
  { bar: "bg-slate-400",           barRaw: "rgb(148,163,184)",  text: "text-slate-500",           dot: "bg-slate-400",           pill: "bg-slate-100 text-slate-500",                       glow: "shadow"  },
];

export default function AdminRoadmapPage() {
  const { id: clientId } = useParams<{ id: string }>();
  const router = useRouter();

  const [clientName, setClientName] = useState<string>("");
  const [completedPhases, setCompletedPhases] = useState<boolean[]>(Array(5).fill(false));
  const [savingPhase, setSavingPhase] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Load client name + existing phase completion state
  useEffect(() => {
    Promise.all([
      fetch(`/api/clients/${clientId}`).then((r) => r.json()),
      fetch(`/api/responses/${clientId}`).then((r) => r.json()),
    ]).then(([clientRes, responseRes]) => {
      setClientName(clientRes.data?.businessName ?? "Client");
      const resp = responseRes.responses ?? {};
      setCompletedPhases(
        PHASES.map((p) => resp[`roadmap_phase_complete_${p.number}`] === "true" || resp[`roadmap_phase_complete_${p.number}`] === true)
      );
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [clientId]);

  const togglePhase = useCallback(async (phaseIndex: number) => {
    const phase = PHASES[phaseIndex];
    const fieldId = `roadmap_phase_complete_${phase.number}`;
    const newValue = completedPhases[phaseIndex] ? "" : "true";

    setSavingPhase(phaseIndex);

    // Optimistic update
    setCompletedPhases((prev) => {
      const next = [...prev];
      next[phaseIndex] = newValue === "true";
      return next;
    });

    try {
      const res = await fetch(`/api/responses/${clientId}/roadmap/roadmap`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId, value: newValue }),
      });
      if (!res.ok) throw new Error("Save failed");
    } catch {
      // Revert on error
      setCompletedPhases((prev) => {
        const next = [...prev];
        next[phaseIndex] = !next[phaseIndex];
        return next;
      });
    } finally {
      setSavingPhase(null);
    }
  }, [clientId, completedPhases]);

  const completedCount = completedPhases.filter(Boolean).length;
  const percent = Math.round((completedCount / PHASES.length) * 100);
  const isAllComplete = completedCount === PHASES.length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-72 bg-white rounded-lg ring-1 ring-black/[0.06] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Dark progress header ── */}
      <div className="sticky top-16 z-20 rounded bg-[#141414] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <h2
            className="text-2xl font-bold text-white truncate flex-1 min-w-0"
            style={{ letterSpacing: "-0.02em" }}
          >
            {ROADMAP_SECTION.heading}
          </h2>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Zap className="w-3 h-3 text-white/40" />
              </motion.div>
              <div className="relative w-24 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: isAllComplete ? "rgb(112,255,162)" : "rgb(108,194,255)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
                />
              </div>
            </div>
            <span className="text-sm font-semibold text-white/60 tabular-nums">
              {completedCount}/{PHASES.length}
            </span>
            <AnimatePresence mode="wait">
              {isAllComplete ? (
                <motion.div
                  key="complete"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                >
                  <CheckCircle2 className="w-5 h-5 text-[rgb(112,255,162)]" />
                </motion.div>
              ) : (
                <motion.span
                  key="pct"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold text-white tabular-nums"
                >
                  {percent}%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-xs text-white/40 mt-1">
          Toggle each phase to mark it complete — updates the client portal in real time.
        </p>
      </div>

      {/* ── Phase toggle cards ── */}
      <div className="grid grid-cols-1 gap-3">
        {PHASES.map((phase, i) => {
          const col = PHASE_COLOURS[i];
          const done = completedPhases[i];
          const saving = savingPhase === i;

          return (
            <motion.div
              key={phase.number}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={cn(
                "bg-white rounded-lg ring-1 px-5 py-4 flex gap-4 transition-all",
                done ? "ring-[rgb(112,255,162)]/40" : "ring-black/[0.06]"
              )}
            >
              <div className={cn("w-1 rounded-full flex-shrink-0 self-stretch transition-colors", done ? "bg-[rgb(112,255,162)]" : col.bar)} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className={cn(
                    "w-7 h-7 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                    done ? "bg-[rgb(112,255,162)]" : "bg-[#1C1C1E]"
                  )}>
                    {done
                      ? <Check className="w-3.5 h-3.5 text-[#1C1C1E]" />
                      : <span className="text-xs font-bold text-white">{phase.number}</span>
                    }
                  </div>
                  <p className={cn("text-sm font-bold flex-1", done ? "text-slate-400 line-through" : col.text)}>
                    {phase.title}
                  </p>
                  <span className={cn(
                    "text-xs px-2.5 py-0.5 rounded-full font-medium",
                    done ? "bg-[rgb(112,255,162)]/15 text-emerald-700" : col.pill
                  )}>
                    {done ? "✓ Complete" : phase.duration}
                  </span>

                  {/* Toggle button */}
                  <button
                    onClick={() => togglePhase(i)}
                    disabled={saving}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ml-auto flex-shrink-0",
                      saving && "opacity-60 cursor-not-allowed",
                      done
                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        : "bg-[#1C1C1E] text-white hover:bg-slate-800"
                    )}
                  >
                    {saving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : done ? (
                      <Check className="w-3 h-3" />
                    ) : null}
                    {saving ? "Saving…" : done ? "Mark Incomplete" : "Mark Complete"}
                  </button>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
                  {phase.items.map((item, j) => (
                    <li key={j} className={cn("flex items-start gap-2 text-sm", done ? "text-slate-400 line-through" : "text-slate-500")}>
                      <div className={cn("w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 transition-colors", done ? "bg-emerald-300" : col.dot)} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Gantt preview ── */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Timeline Preview</p>
        <div className="bg-white rounded ring-1 ring-black/[0.06] overflow-hidden">
          {/* Month header */}
          <div
            className="border-b border-slate-100"
            style={{ display: "grid", gridTemplateColumns: `200px repeat(${TOTAL_MONTHS}, 1fr)` }}
          >
            <div className="px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-r border-slate-100">
              Phase
            </div>
            {MONTHS.map((m) => (
              <div key={m} className={cn("py-2.5 text-center text-xs font-medium", m % 2 === 0 ? "text-slate-400" : "text-slate-300")}>
                M{m}
              </div>
            ))}
          </div>

          {PHASES.map((phase, i) => {
            const col = PHASE_COLOURS[i];
            const span = PHASE_SPANS[i];
            const done = completedPhases[i];
            const barLeft = `calc(${((span.start - 1) / TOTAL_MONTHS) * 100}% + 3px)`;
            const barWidth = `calc(${((span.end - span.start + 1) / TOTAL_MONTHS) * 100}% - 6px)`;

            return (
              <div
                key={phase.number}
                className="border-b border-slate-50 last:border-b-0"
                style={{ display: "grid", gridTemplateColumns: `200px 1fr`, minHeight: "56px" }}
              >
                <div className="px-4 py-3 border-r border-slate-100 flex items-center gap-2.5">
                  <div className={cn(
                    "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 transition-colors",
                    done ? "bg-[rgb(112,255,162)]" : "bg-[#1C1C1E]"
                  )}>
                    {done
                      ? <Check className="w-3 h-3 text-[#1C1C1E]" />
                      : <span className="text-[10px] font-bold text-white">{phase.number}</span>
                    }
                  </div>
                  <p className={cn("text-xs font-semibold truncate", done ? "text-slate-400 line-through" : "text-slate-700")}>
                    {phase.title}
                  </p>
                </div>

                <div className="relative flex items-center overflow-hidden">
                  <div className="absolute inset-0 flex pointer-events-none">
                    {MONTHS.map((m) => (
                      <div key={m} className={cn("flex-1 h-full", m % 2 === 0 ? "bg-slate-50/60" : "")} />
                    ))}
                  </div>
                  <div
                    onClick={() => document.getElementById(`phase-card-${i}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className={cn(
                      "absolute h-7 rounded flex items-center px-2.5 gap-1.5 text-xs font-semibold select-none transition-all cursor-pointer text-[#1C1C1E] shadow"
                    )}
                    style={{
                      left: barLeft,
                      width: barWidth,
                      background: done ? "rgb(112,255,162)" : col.barRaw,
                    }}
                  >
                    {done && <Check className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{phase.title}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
