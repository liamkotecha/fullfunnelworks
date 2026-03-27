/**
 * Client detail layout — wraps all /consultant/clients/[id]/* sub-pages.
 * Renders a breadcrumb and persistent tab bar so the user can switch
 * between Overview, Responses, KPIs, Roadmap, and Activity.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview",        suffix: "" },
  { label: "Responses",       suffix: "/responses" },
  { label: "KPIs",            suffix: "/kpis" },
  { label: "Roadmap",         suffix: "/roadmap" },
  { label: "Financial Model", suffix: "/financial-model" },
  { label: "Hiring Plan",     suffix: "/hiring-plan" },
  { label: "Invoices",        suffix: "/invoices" },
  { label: "Activity",        suffix: "/activity" },
] as const;

type Tab = { label: string; suffix: string };

export default function ClientDetailLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const pathname = usePathname();
  const router = useRouter();
  const [clientName, setClientName] = useState<string>("");
  const [teamMode, setTeamMode] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/team/${id}`).then((r) => r.json()),
    ]).then(([d, t]) => {
      setClientName(d.data?.businessName ?? "Client");
      setTeamMode(t.teamMode ?? false);
    }).catch(() => {});
  }, [id]);

  const base = `/consultant/clients/${id}`;

  const tabs: Tab[] = [
    ...TABS,
    ...(teamMode ? [{ label: "Synthesis", suffix: "/synthesis" }] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/consultant/clients")}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-5 mt-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All clients
      </button>

      {/* Client name + View As */}
      {clientName && (
        <div className="flex items-center gap-3 mb-4">
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-sans font-bold text-2xl text-slate-900"
          >
            {clientName}
          </motion.h1>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/admin/view-as", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ clientId: id }),
                });
                if (res.ok) {
                  window.location.href = "/portal/overview";
                }
              } catch {}
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            View as client
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 mb-6 w-fit">
        {tabs.map((tab) => {
          const href = base + tab.suffix;
          const isActive = tab.suffix === ""
            ? pathname === base || pathname === base + "/"
            : pathname.startsWith(href);
          return (
            <button
              key={tab.label}
              onClick={() => router.push(href)}
              className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
              style={{ color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="client-tab-pill"
                  className="absolute inset-0 bg-white/15 rounded-md"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
