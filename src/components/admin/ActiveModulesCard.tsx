/**
 * ActiveModulesCard — toggle pills for managing which portal modules
 * are unlocked for a given client's active project.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Users,
  Target,
  Settings,
  MapPin,
  BarChart3,
  Map,
  Calculator,
  UserPlus,
  Loader2,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications/ToastContext";
import type { ModuleId, ProjectDTO } from "@/types";
import { MODULE_META } from "@/types";

const ICON_MAP: Record<string, React.ReactNode> = {
  Search:     <Search className="w-3.5 h-3.5" />,
  Users:      <Users className="w-3.5 h-3.5" />,
  Target:     <Target className="w-3.5 h-3.5" />,
  Settings:   <Settings className="w-3.5 h-3.5" />,
  MapPin:     <MapPin className="w-3.5 h-3.5" />,
  BarChart3:  <BarChart3 className="w-3.5 h-3.5" />,
  Map:        <Map className="w-3.5 h-3.5" />,
  Calculator: <Calculator className="w-3.5 h-3.5" />,
  UserPlus:   <UserPlus className="w-3.5 h-3.5" />,
};

const ALL_MODULES = Object.keys(MODULE_META) as ModuleId[];

interface ActiveModulesCardProps {
  clientId: string;
  projects: ProjectDTO[];
}

export function ActiveModulesCard({ clientId, projects }: ActiveModulesCardProps) {
  const { success, error: toastError } = useToast();
  const [activeModules, setActiveModules] = useState<ModuleId[]>([]);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Find the primary project (first in_progress, or first overall)
  const project =
    projects.find((p) => p.status === "in_progress") ?? projects[0] ?? null;

  // Seed from project's activeModules
  useEffect(() => {
    if (project?.activeModules) {
      setActiveModules(project.activeModules as ModuleId[]);
    } else {
      setActiveModules(["assessment"]);
    }
    setLoaded(true);
  }, [project]);

  const toggle = useCallback(
    async (moduleId: ModuleId) => {
      if (!project) return;

      const isActive = activeModules.includes(moduleId);
      // Assessment cannot be turned off
      if (moduleId === "assessment" && isActive) return;

      const next = isActive
        ? activeModules.filter((m) => m !== moduleId)
        : [...activeModules, moduleId];

      setActiveModules(next);
      setSaving(true);

      try {
        const res = await fetch(`/api/projects/${project.id}/modules`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activeModules: next }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to update modules");
        }
        success("Modules updated", `${next.length} of ${ALL_MODULES.length} modules active`);
      } catch (e) {
        // Revert on failure
        setActiveModules(activeModules);
        toastError("Update failed", (e as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [project, activeModules, success, toastError]
  );

  if (!project) {
    return (
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-4">Active Modules</h2>
        <div className="text-center py-8 space-y-2">
          <Lock className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-sm text-slate-400">
            Create a project first to manage modules.
          </p>
        </div>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div className="card">
        <h2 className="font-semibold text-slate-900 mb-4">Active Modules</h2>
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-semibold text-slate-900">Active Modules</h2>
        <span className="text-xs text-slate-400">
          {activeModules.length} / {ALL_MODULES.length} active
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Toggle modules to control what the client sees in their portal sidebar.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {ALL_MODULES.map((moduleId) => {
          const meta = MODULE_META[moduleId];
          const isActive = activeModules.includes(moduleId);
          const isAssessment = moduleId === "assessment";

          return (
            <motion.button
              key={moduleId}
              whileTap={{ scale: 0.97 }}
              onClick={() => toggle(moduleId)}
              disabled={saving || isAssessment}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all duration-150 w-full",
                isActive
                  ? "bg-[#141414] text-white border-[#141414] shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                isAssessment && "opacity-70 cursor-default",
                saving && "pointer-events-none"
              )}
              title={isAssessment ? "Assessment is always active" : meta.description}
            >
              <span
                className={cn(
                  "w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 transition-colors",
                  isActive ? "bg-white/15" : "bg-slate-100"
                )}
              >
                {ICON_MAP[meta.icon]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-tight truncate">{meta.label}</p>
                <p
                  className={cn(
                    "text-[10px] leading-tight truncate mt-0.5",
                    isActive ? "text-white/50" : "text-slate-400"
                  )}
                >
                  {meta.description}
                </p>
              </div>
              <span className="flex-shrink-0">
                {isActive ? (
                  <Unlock className="w-3.5 h-3.5 text-brand-green" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-300" />
                )}
              </span>
            </motion.button>
          );
        })}
      </div>

      {saving && (
        <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-400">
          <Loader2 className="w-3 h-3 animate-spin" />
          Saving…
        </div>
      )}
    </div>
  );
}
