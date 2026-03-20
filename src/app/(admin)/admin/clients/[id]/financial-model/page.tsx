/**
 * /admin/clients/[id]/financial-model — read-only view of client's P&L.
 * Shows base P&L summary and compare table for all scenarios.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, Calculator, Info } from "lucide-react";
import { calcPL } from "@/lib/modeller/calc";
import type { ModellerData, PLResult } from "@/lib/modeller/calc";
import { PLSummary } from "@/components/modeller/PLSummary";
import { WaterfallChart } from "@/components/modeller/WaterfallChart";
import { KPIStrip } from "@/components/modeller/KPIStrip";
import { CompareTable } from "@/components/modeller/CompareTable";
import { RevenueSection } from "@/components/modeller/RevenueSection";
import { PeopleSection } from "@/components/modeller/PeopleSection";
import { OverheadsSection } from "@/components/modeller/OverheadsSection";

interface Scenario {
  id: string;
  name: string;
  type: string;
  data: ModellerData;
}

export default function AdminFinancialModelPage() {
  const { id } = useParams<{ id: string }>();
  const [base, setBase] = useState<ModellerData | null>(null);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/modeller/base`).then((r) => r.json()),
      fetch(`/api/modeller/scenarios`).then((r) => r.json()),
    ])
      .then(([baseData, scenariosData]) => {
        if (baseData.revenue) {
          setBase({
            revenue: baseData.revenue,
            people: baseData.people,
            overheads: baseData.overheads,
          });
        }
        if (Array.isArray(scenariosData)) {
          setScenarios(scenariosData);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!base) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-4">
          <Calculator className="w-5 h-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">No financial model</p>
        <p className="text-xs text-slate-400">
          This client hasn&apos;t created a financial model yet.
        </p>
      </div>
    );
  }

  const basePL = calcPL(base);

  return (
    <div className="space-y-6">
      {/* Read-only notice */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
        <Info className="w-4 h-4 flex-shrink-0" />
        <span>Read-only view. Edit access is available in the client&apos;s portal.</span>
      </div>

      {/* KPI strip */}
      <KPIStrip pl={basePL} />

      {/* Base model */}
      <div className="flex gap-6">
        <div className="flex-1 space-y-4 min-w-0">
          <RevenueSection lines={base.revenue} onChange={() => {}} readOnly />
          <PeopleSection lines={base.people} onChange={() => {}} readOnly />
          <OverheadsSection lines={base.overheads} onChange={() => {}} readOnly />
        </div>
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <div className="sticky top-6 space-y-4">
            <PLSummary pl={basePL} />
            <WaterfallChart pl={basePL} />
          </div>
        </div>
      </div>

      {/* Scenarios comparison */}
      {scenarios.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-900">Scenario Comparison</h3>
          <CompareTable basePL={basePL} scenarios={scenarios} />
        </div>
      )}
    </div>
  );
}
