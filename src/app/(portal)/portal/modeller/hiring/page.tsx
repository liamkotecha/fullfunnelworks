/**
 * /portal/modeller/hiring — Hiring Plan Modeller.
 * Three-view layout: P&L Waterfall | Timeline | Break-even.
 * Premium-gated. Autosaves 1500ms after last change.
 */
"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Sparkles, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useHiringPlan } from "@/hooks/useHiringPlan";
import type { Hire } from "@/lib/hiring/calc";

// Components
import { HireCard } from "@/components/hiring/HireCard";
import { BasePLPanel } from "@/components/hiring/BasePLPanel";
import { HiringKPIStrip } from "@/components/hiring/KPIStrip";
import { PLWaterfallView } from "@/components/hiring/views/PLWaterfallView";
import { HeadcountView } from "@/components/hiring/views/HeadcountView";
import { BreakEvenView } from "@/components/hiring/views/BreakEvenView";

// ── Types ────────────────────────────────────────────────────

type View = "pl" | "headcount" | "breakeven";

const VIEWS: { key: View; label: string }[] = [
  { key: "pl", label: "P&L Waterfall" },
  { key: "headcount", label: "Timeline" },
  { key: "breakeven", label: "Break-even" },
];

// ── Save status label ────────────────────────────────────────

function SaveIndicator({ status, savedAt }: { status: string; savedAt: Date | null }) {
  if (status === "saving") {
    return (
      <motion.span
        key="saving"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-xs text-slate-400 flex items-center gap-1"
      >
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving…
      </motion.span>
    );
  }
  if (status === "saved" && savedAt) {
    const ago = Math.round((Date.now() - savedAt.getTime()) / 60000);
    return (
      <motion.span
        key="saved"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-xs text-brand-green"
      >
        Saved {ago < 1 ? "just now" : `${ago}m ago`}
      </motion.span>
    );
  }
  if (status === "error") {
    return (
      <motion.span
        key="error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-xs text-red-500"
      >
        Save failed
      </motion.span>
    );
  }
  return null;
}

// ── Premium Gate ─────────────────────────────────────────────

function PremiumGate() {
  return (
    <div className="max-w-lg mx-auto py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[#1C1C1E] flex items-center justify-center mx-auto mb-6">
        <Users className="w-7 h-7 text-white" />
      </div>
      <h2 className="font-serif text-2xl text-slate-900 mb-3">Hiring Plan Modeller</h2>
      <p className="font-sans text-sm text-slate-500 mb-6 leading-relaxed">
        Plan a 12-month hiring roadmap and see the full financial impact — cumulative people costs,
        revenue contribution per hire with ramp-up, and EBITDA impact month by month.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-black/[0.08] text-sm font-medium text-slate-600">
        <Sparkles className="w-3.5 h-3.5" />
        Available on Premium plan
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────

function EmptyHires({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">No hires planned</p>
      <p className="text-xs text-slate-400 mb-4">
        Add your first planned hire to start modelling the financial impact.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#141414] text-white hover:bg-[#2a2a2a] transition-colors"
      >
        Add first hire
      </button>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

function uid() {
  return `hire-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HiringPlanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = (searchParams.get("view") as View) || "pl";

  const { plan, loading: clientLoading } = usePortalClient();
  const { data: session } = useSession();
  const isAdmin = (session?.user as Record<string, unknown>)?.role === "admin";

  const {
    hires,
    setHires,
    base,
    setBase,
    useModeller,
    toggleSource,
    months,
    saveStatus,
    savedAt,
    loading,
    modellerLoaded,
  } = useHiringPlan();

  const setView = useCallback(
    (v: View) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", v);
      router.replace(`/portal/modeller/hiring?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const addHire = useCallback(() => {
    setHires([
      ...hires,
      {
        id: uid(),
        role: "",
        department: "Sales",
        startMonth: 1,
        salary: 0,
        revenueContribution: 0,
        rampMonths: 3,
        hiringCost: 0,
      },
    ]);
  }, [hires, setHires]);

  const updateHire = useCallback(
    (idx: number, field: keyof Hire, value: string | number) => {
      const next = [...hires];
      if (field === "role" || field === "department") {
        next[idx] = { ...next[idx], [field]: String(value) };
      } else {
        next[idx] = { ...next[idx], [field]: parseFloat(String(value)) || 0 };
      }
      setHires(next);
    },
    [hires, setHires]
  );

  const removeHire = useCallback(
    (idx: number) => {
      setHires(hires.filter((_, i) => i !== idx));
    },
    [hires, setHires]
  );

  // ── Loading / gating ──

  if (clientLoading || loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (plan !== "premium" && !isAdmin) {
    return <PremiumGate />;
  }

  // ── Render ───────────────

  return (
    <div className="space-y-6">
      {/* Dark header bar */}
      <div className="sticky top-16 z-20 rounded bg-[#141414] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-2xl font-bold text-white truncate" style={{ letterSpacing: "-0.02em" }}>
              Hiring Plan
            </h2>
            <AnimatePresence mode="wait">
              <SaveIndicator status={saveStatus} savedAt={savedAt} />
            </AnimatePresence>
          </div>

          <button
            onClick={addHire}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Add hire
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <HiringKPIStrip hires={hires} months={months} />

      {hires.length === 0 ? (
        <EmptyHires onAdd={addHire} />
      ) : (
        <>
          {/* Cards + Base panel */}
          <div className="flex gap-6 items-start">
            {/* Hire cards */}
            <div className="flex-1 min-w-0 space-y-4">
              {hires.map((hire, idx) => (
                <HireCard
                  key={hire.id}
                  hire={hire}
                  onChange={(field, value) => updateHire(idx, field, value)}
                  onRemove={() => removeHire(idx)}
                />
              ))}
            </div>

            {/* Base P&L panel */}
            <div className="w-[360px] flex-shrink-0 sticky top-36">
              <BasePLPanel
                base={base}
                setBase={setBase}
                useModeller={useModeller}
                toggleSource={toggleSource}
                months={months}
                modellerLoaded={modellerLoaded}
              />
            </div>
          </div>

          {/* Output view tabs */}
          <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 w-fit">
            {VIEWS.map((v) => {
              const isActive = view === v.key;
              return (
                <button
                  key={v.key}
                  onClick={() => setView(v.key)}
                  className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
                  style={{
                    color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)",
                  }}
                >
                  {isActive && (
                    <motion.div
                      layoutId="hiring-view-pill"
                      className="absolute inset-0 bg-white/15 rounded-md"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                  <span className="relative z-10">{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active view */}
          <AnimatePresence mode="wait">
            {view === "pl" && (
              <motion.div
                key="pl"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <PLWaterfallView months={months} hires={hires} />
              </motion.div>
            )}
            {view === "headcount" && (
              <motion.div
                key="headcount"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <HeadcountView hires={hires} />
              </motion.div>
            )}
            {view === "breakeven" && (
              <motion.div
                key="breakeven"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                <BreakEvenView hires={hires} base={base} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
