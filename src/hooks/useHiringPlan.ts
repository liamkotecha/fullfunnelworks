/**
 * useHiringPlan — fetches hiring plan + base P&L, provides autosave.
 * Same debounce pattern as useModellerAutosave (1500ms).
 */
"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import type { Hire, HiringBase, MonthResult } from "@/lib/hiring/calc";
import { buildMonthlyPL } from "@/lib/hiring/calc";
import { calcPL } from "@/lib/modeller/calc";
import type { ModellerData } from "@/lib/modeller/calc";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface UseHiringPlanReturn {
  hires: Hire[];
  setHires: (hires: Hire[]) => void;
  base: HiringBase;
  setBase: (base: HiringBase) => void;
  useModeller: boolean;
  toggleSource: () => void;
  months: MonthResult[];
  saveStatus: SaveStatus;
  savedAt: Date | null;
  loading: boolean;
  modellerLoaded: boolean;
}

const EMPTY_BASE: HiringBase = {
  monthlyRevenue: 0,
  grossMarginPct: 60,
  existingPeopleMonthly: 0,
  monthlyOverheads: 0,
};

export function useHiringPlan(): UseHiringPlanReturn {
  const [hires, setHires] = useState<Hire[]>([]);
  const [base, setBase] = useState<HiringBase>(EMPTY_BASE);
  const [useModellerFlag, setUseModellerFlag] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [modellerLoaded, setModellerLoaded] = useState(false);
  const modellerBase = useRef<HiringBase | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirst = useRef(true);

  // ── Fetch plan + modeller base on mount ──
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [planRes, modellerRes] = await Promise.all([
          fetch("/api/hiring-plan"),
          fetch("/api/modeller/base"),
        ]);
        const plan = await planRes.json();
        const modellerData: ModellerData = await modellerRes.json();

        if (cancelled) return;

        // Derive base from Financial Modeller
        const pl = calcPL(modellerData);
        const derived: HiringBase = {
          monthlyRevenue: pl.totalRevenue,
          grossMarginPct: pl.grossMargin,
          existingPeopleMonthly: pl.totalPeopleMonthly,
          monthlyOverheads: pl.totalOverheads,
        };
        modellerBase.current = derived;
        setModellerLoaded(true);

        setHires(plan.hires ?? []);
        setUseModellerFlag(plan.useModeller ?? true);

        if (plan.useModeller) {
          // Use modeller-derived base, but allow stored gross margin override
          const overrideGM = plan.baseOverride?.grossMarginPct;
          setBase({
            ...derived,
            grossMarginPct: overrideGM && overrideGM !== 60 ? overrideGM : derived.grossMarginPct,
          });
        } else {
          setBase(plan.baseOverride ?? EMPTY_BASE);
        }
      } catch {
        // silent — empty state will show
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Toggle source ──
  const toggleSource = useCallback(() => {
    setUseModellerFlag((prev) => {
      const next = !prev;
      if (next && modellerBase.current) {
        // Switching to modeller: use modeller base, keep current GM
        setBase((cur) => ({
          ...modellerBase.current!,
          grossMarginPct: cur.grossMarginPct,
        }));
      }
      // Switching to override: keep current values (pre-filled from modeller)
      return next;
    });
  }, []);

  // ── Compute months ──
  const months = useMemo(() => buildMonthlyPL(base, hires), [base, hires]);

  // ── Autosave (1500ms debounce) ──
  const flush = useCallback(async () => {
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/hiring-plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hires,
          useModeller: useModellerFlag,
          baseOverride: base,
        }),
      });
      if (!res.ok) throw new Error(res.statusText);
      setSaveStatus("saved");
      setSavedAt(new Date());
    } catch {
      setSaveStatus("error");
    }
  }, [hires, useModellerFlag, base]);

  useEffect(() => {
    if (loading) return;
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 1500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hires, useModellerFlag, base, loading, flush]);

  return {
    hires,
    setHires,
    base,
    setBase,
    useModeller: useModellerFlag,
    toggleSource,
    months,
    saveStatus,
    savedAt,
    loading,
    modellerLoaded,
  };
}
