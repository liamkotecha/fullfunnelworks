/**
 * /portal/modeller — Financial Scenario Modeller.
 * Three-tab layout: Base Model / Scenarios / Compare.
 * Premium-gated. Autosaves 1.5s after last change.
 */
"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";
import { useModellerAutosave } from "@/hooks/useModellerAutosave";
import { calcPL } from "@/lib/modeller/calc";
import type { ModellerData, PLResult } from "@/lib/modeller/calc";

// Components
import { KPIStrip } from "@/components/modeller/KPIStrip";
import { PLSummary } from "@/components/modeller/PLSummary";
import { WaterfallChart } from "@/components/modeller/WaterfallChart";
import { RevenueSection } from "@/components/modeller/RevenueSection";
import { PeopleSection } from "@/components/modeller/PeopleSection";
import { OverheadsSection } from "@/components/modeller/OverheadsSection";
import { ScenarioCard } from "@/components/modeller/ScenarioCard";
import { ImpactPanel } from "@/components/modeller/ImpactPanel";
import { CompareTable } from "@/components/modeller/CompareTable";

// ── Types ────────────────────────────────────────────────────

type Tab = "base" | "scenarios" | "compare";
type ScenarioType = "hire" | "price" | "revenue" | "client";

interface Scenario {
  id: string;
  name: string;
  type: ScenarioType;
  description: string;
  data: ModellerData;
  createdAt: string;
  updatedAt: string;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "base", label: "Base Model" },
  { key: "scenarios", label: "Scenarios" },
  { key: "compare", label: "Compare" },
];

const SCENARIO_TEMPLATES: { type: ScenarioType; label: string }[] = [
  { type: "hire", label: "+ New hire" },
  { type: "price", label: "± Price change" },
  { type: "revenue", label: "+ Revenue line" },
  { type: "client", label: "− Lose client" },
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
        <Calculator className="w-7 h-7 text-white" />
      </div>
      <h2 className="font-serif text-2xl text-slate-900 mb-3">Financial Scenario Modeller</h2>
      <p className="font-sans text-sm text-slate-500 mb-6 leading-relaxed">
        Model the financial impact of hiring decisions, pricing changes, new revenue lines,
        and losing clients — with live P&L calculations and break-even analysis.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-black/[0.08] text-sm font-medium text-slate-600">
        <Sparkles className="w-3.5 h-3.5" />
        Available on Premium plan
      </div>
    </div>
  );
}

// ── Empty state ──────────────────────────────────────────────

function EmptyScenarios() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
        <Calculator className="w-5 h-5 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700 mb-1">No scenarios yet</p>
      <p className="text-xs text-slate-400">
        Use the buttons above to create your first scenario
      </p>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────

export default function ModellerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = (searchParams.get("tab") as Tab) || "base";

  const { clientId, plan, loading: clientLoading } = usePortalClient();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // ── Base model state ─────

  const [base, setBase] = useState<ModellerData | null>(null);
  const [baseLoading, setBaseLoading] = useState(true);

  const fetchBase = useCallback(async () => {
    try {
      const res = await fetch("/api/modeller/base");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBase({ revenue: data.revenue, people: data.people, overheads: data.overheads });
    } catch {
      // defaults will be set by API
    } finally {
      setBaseLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientId) fetchBase();
  }, [clientId, fetchBase]);

  // ── Scenarios state ──────

  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch("/api/modeller/scenarios");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setScenarios(data);
      // Auto-select first if none selected
      if (data.length > 0 && !activeScenarioId) {
        setActiveScenarioId(data[0].id);
      }
    } catch {
      // ignore
    }
  }, [activeScenarioId]);

  useEffect(() => {
    if (clientId) fetchScenarios();
  }, [clientId, fetchScenarios]);

  const activeScenario = scenarios.find((s) => s.id === activeScenarioId) ?? null;

  // ── P&L calculations ────

  const basePL = useMemo<PLResult | null>(() => {
    if (!base) return null;
    return calcPL(base);
  }, [base]);

  const scenarioPL = useMemo<PLResult | null>(() => {
    if (!activeScenario) return null;
    return calcPL(activeScenario.data);
  }, [activeScenario]);

  // ── Autosave ─────────────

  const { status: baseSaveStatus, savedAt: baseSavedAt } = useModellerAutosave(
    base,
    "/api/modeller/base",
    !!clientId && !baseLoading
  );

  const { status: scenarioSaveStatus, savedAt: scenarioSavedAt } = useModellerAutosave(
    activeScenario?.data ?? null,
    activeScenarioId ? `/api/modeller/scenarios/${activeScenarioId}` : "",
    !!activeScenarioId
  );

  // ── Scenario mutations ───

  const createScenario = useCallback(
    async (type: ScenarioType, label: string) => {
      try {
        const res = await fetch("/api/modeller/scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, name: label }),
        });
        if (!res.ok) throw new Error();
        const created = await res.json();
        setScenarios((prev) => [created, ...prev]);
        setActiveScenarioId(created.id);
        router.push("/portal/modeller?tab=scenarios");
      } catch {
        // TODO: toast
      }
    },
    [router]
  );

  const deleteScenario = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/modeller/scenarios/${id}`, { method: "DELETE" });
        setScenarios((prev) => prev.filter((s) => s.id !== id));
        if (activeScenarioId === id) {
          setActiveScenarioId(scenarios.find((s) => s.id !== id)?.id ?? null);
        }
      } catch {
        // TODO: toast
      }
    },
    [activeScenarioId, scenarios]
  );

  const updateScenarioData = useCallback(
    (newData: ModellerData) => {
      if (!activeScenarioId) return;
      setScenarios((prev) =>
        prev.map((s) => (s.id === activeScenarioId ? { ...s, data: newData } : s))
      );
    },
    [activeScenarioId]
  );

  // ── Tab setter ───────────

  const setTab = useCallback(
    (t: Tab) => router.push(`/portal/modeller?tab=${t}`),
    [router]
  );

  // ── Loading / Guards ─────

  if (clientLoading || baseLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (plan !== "premium" && !isAdmin) {
    return <PremiumGate />;
  }

  if (!base || !basePL) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // ── Render ───────────────

  return (
    <div className="space-y-6">
      {/* Dark header bar */}
      <div className="sticky top-16 z-20 rounded bg-[#141414] px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <h2 className="text-2xl font-bold text-white truncate" style={{ letterSpacing: "-0.02em" }}>
              Financial Modeller
            </h2>
            <AnimatePresence mode="wait">
              <SaveIndicator
                status={tab === "scenarios" ? scenarioSaveStatus : baseSaveStatus}
                savedAt={tab === "scenarios" ? scenarioSavedAt : baseSavedAt}
              />
            </AnimatePresence>
          </div>

          {/* Scenario creation buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {SCENARIO_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => createScenario(t.type, t.label)}
                className="px-3 py-1.5 rounded-md text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-all"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <KPIStrip pl={tab === "scenarios" && scenarioPL ? scenarioPL : basePL} />

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 w-fit">
        {TABS.map((t) => {
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
              style={{
                color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)",
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="modeller-tab-pill"
                  className="absolute inset-0 bg-white/15 rounded-md"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {tab === "base" && (
          <motion.div
            key="base"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <BaseTab base={base} setBase={setBase} basePL={basePL} />
          </motion.div>
        )}

        {tab === "scenarios" && (
          <motion.div
            key="scenarios"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <ScenariosTab
              scenarios={scenarios}
              activeScenarioId={activeScenarioId}
              basePL={basePL}
              base={base}
              scenarioPL={scenarioPL}
              activeScenario={activeScenario}
              onSelect={setActiveScenarioId}
              onDelete={deleteScenario}
              onUpdate={updateScenarioData}
            />
          </motion.div>
        )}

        {tab === "compare" && (
          <motion.div
            key="compare"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <CompareTab basePL={basePL} scenarios={scenarios} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Base Model Tab ───────────────────────────────────────────

function BaseTab({
  base,
  setBase,
  basePL,
}: {
  base: ModellerData;
  setBase: (d: ModellerData) => void;
  basePL: PLResult;
}) {
  return (
    <div className="flex gap-6">
      {/* Left — editable sections */}
      <div className="flex-1 space-y-4 min-w-0">
        <RevenueSection
          lines={base.revenue}
          onChange={(revenue) => setBase({ ...base, revenue })}
        />
        <PeopleSection
          lines={base.people}
          onChange={(people) => setBase({ ...base, people })}
        />
        <OverheadsSection
          lines={base.overheads}
          onChange={(overheads) => setBase({ ...base, overheads })}
        />
      </div>

      {/* Right — sticky summary */}
      <div className="w-80 flex-shrink-0 hidden lg:block">
        <div className="sticky top-6 space-y-4">
          <PLSummary pl={basePL} />
          <WaterfallChart pl={basePL} />
        </div>
      </div>
    </div>
  );
}

// ── Scenarios Tab ────────────────────────────────────────────

function ScenariosTab({
  scenarios,
  activeScenarioId,
  basePL,
  base,
  scenarioPL,
  activeScenario,
  onSelect,
  onDelete,
  onUpdate,
}: {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  basePL: PLResult;
  base: ModellerData;
  scenarioPL: PLResult | null;
  activeScenario: Scenario | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (data: ModellerData) => void;
}) {
  if (scenarios.length === 0) return <EmptyScenarios />;

  return (
    <div className="flex gap-4">
      {/* Left — scenario list */}
      <div className="w-52 flex-shrink-0 space-y-2">
        {scenarios.map((s) => (
          <ScenarioCard
            key={s.id}
            id={s.id}
            name={s.name}
            type={s.type as ScenarioType}
            data={s.data}
            basePL={basePL}
            isActive={s.id === activeScenarioId}
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
      </div>

      {/* Right — editor + impact */}
      {activeScenario && scenarioPL && (
        <div className="flex-1 flex gap-4 min-w-0">
          <div className="flex-1 space-y-4 min-w-0">
            <RevenueSection
              lines={activeScenario.data.revenue}
              onChange={(revenue) =>
                onUpdate({ ...activeScenario.data, revenue })
              }
              baseLines={base.revenue}
            />
            <PeopleSection
              lines={activeScenario.data.people}
              onChange={(people) =>
                onUpdate({ ...activeScenario.data, people })
              }
              baseLines={base.people}
            />
            <OverheadsSection
              lines={activeScenario.data.overheads}
              onChange={(overheads) =>
                onUpdate({ ...activeScenario.data, overheads })
              }
              baseLines={base.overheads}
            />
          </div>
          <div className="w-72 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6">
              <ImpactPanel basePL={basePL} scenarioPL={scenarioPL} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Compare Tab ──────────────────────────────────────────────

function CompareTab({
  basePL,
  scenarios,
}: {
  basePL: PLResult;
  scenarios: Scenario[];
}) {
  if (scenarios.length === 0) return <EmptyScenarios />;
  return <CompareTable basePL={basePL} scenarios={scenarios} />;
}
