/**
 * /admin/clients/[id]/hiring-plan — read-only view of client's hiring plan.
 * Shows hire cards, KPI strip, and all three output views.
 */
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Users, Info } from "lucide-react";
import { calcPL } from "@/lib/modeller/calc";
import type { ModellerData } from "@/lib/modeller/calc";
import { buildMonthlyPL } from "@/lib/hiring/calc";
import type { Hire, HiringBase, MonthResult } from "@/lib/hiring/calc";
import { HireCard } from "@/components/hiring/HireCard";
import { HiringKPIStrip } from "@/components/hiring/KPIStrip";
import { BasePLPanel } from "@/components/hiring/BasePLPanel";
import { PLWaterfallView } from "@/components/hiring/views/PLWaterfallView";
import { HeadcountView } from "@/components/hiring/views/HeadcountView";
import { BreakEvenView } from "@/components/hiring/views/BreakEvenView";

type View = "pl" | "headcount" | "breakeven";
const VIEWS: { key: View; label: string }[] = [
  { key: "pl", label: "P&L Waterfall" },
  { key: "headcount", label: "Timeline" },
  { key: "breakeven", label: "Break-even" },
];

const EMPTY_BASE: HiringBase = {
  monthlyRevenue: 0,
  grossMarginPct: 60,
  existingPeopleMonthly: 0,
  monthlyOverheads: 0,
};

export default function AdminHiringPlanPage() {
  const { id } = useParams<{ id: string }>();
  const [hires, setHires] = useState<Hire[]>([]);
  const [base, setBase] = useState<HiringBase>(EMPTY_BASE);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("pl");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch("/api/hiring-plan").then((r) => r.json()),
      fetch("/api/modeller/base").then((r) => r.json()),
    ])
      .then(([plan, modellerData]: [Record<string, any>, ModellerData]) => {
        const h: Hire[] = plan.hires ?? [];
        setHires(h);

        if (plan.useModeller && modellerData.revenue) {
          const pl = calcPL(modellerData);
          setBase({
            monthlyRevenue: pl.totalRevenue,
            grossMarginPct: plan.baseOverride?.grossMarginPct ?? pl.grossMargin,
            existingPeopleMonthly: pl.totalPeopleMonthly,
            monthlyOverheads: pl.totalOverheads,
          });
        } else if (plan.baseOverride) {
          setBase(plan.baseOverride);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const months: MonthResult[] = useMemo(() => buildMonthlyPL(base, hires), [base, hires]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (hires.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <Users className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">No hiring plan yet</p>
        <p className="text-xs text-slate-400">This client hasn&apos;t created any planned hires.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info banner */}
      <div className="flex items-center gap-2 rounded-lg bg-brand-blue/10 px-4 py-2.5 text-sm text-slate-600">
        <Info className="w-4 h-4 text-brand-blue flex-shrink-0" />
        Hiring plan is edited in the client portal. This is a read-only view.
      </div>

      {/* KPI strip */}
      <HiringKPIStrip hires={hires} months={months} />

      {/* Cards + Base panel */}
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-4">
          {hires.map((hire) => (
            <HireCard
              key={hire.id}
              hire={hire}
              onChange={() => {}}
              onRemove={() => {}}
              readOnly
            />
          ))}
        </div>
        <div className="w-[360px] flex-shrink-0">
          <BasePLPanel
            base={base}
            setBase={() => {}}
            useModeller={false}
            toggleSource={() => {}}
            months={months}
            modellerLoaded={true}
            readOnly
          />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 w-fit">
        {VIEWS.map((v) => {
          const isActive = view === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
              style={{ color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="admin-hiring-view-pill"
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
          <motion.div key="pl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <PLWaterfallView months={months} hires={hires} />
          </motion.div>
        )}
        {view === "headcount" && (
          <motion.div key="headcount" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <HeadcountView hires={hires} />
          </motion.div>
        )}
        {view === "breakeven" && (
          <motion.div key="breakeven" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
            <BreakEvenView hires={hires} base={base} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
