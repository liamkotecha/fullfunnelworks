/**
 * useActiveModules — fetches the active modules for the current client's project.
 * Used by FrameworkSidebar to determine which items are locked vs accessible.
 *
 * Strategy:
 * 1. Fetch GET /api/me/client to get clientId
 * 2. Fetch GET /api/projects?clientId=[id] to get projects
 * 3. Return activeModules from the most recent in_progress project
 * 4. If no active project found, return ["assessment"] as safe default
 * 5. Cache result — re-fetch only on mount and explicit refresh
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { ModuleId } from "@/types";

const DEFAULT_MODULES: ModuleId[] = ["assessment"];

export interface UseActiveModulesResult {
  activeModules: ModuleId[];
  lockedByInvoice: ModuleId[];
  projectId: string | null;
  loaded: boolean;
  refresh: () => Promise<void>;
}

export function useActiveModules(): UseActiveModulesResult {
  const [activeModules, setActiveModules] = useState<ModuleId[]>(DEFAULT_MODULES);
  const [lockedByInvoice, setLockedByInvoice] = useState<ModuleId[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      // 1. Get clientId
      const clientRes = await fetch("/api/me/client");
      if (!clientRes.ok) {
        setLoaded(true);
        return;
      }
      const { clientId } = await clientRes.json();
      if (!clientId) {
        setLoaded(true);
        return;
      }

      // 2. Get projects for this client
      const projRes = await fetch(`/api/projects?clientId=${clientId}`);
      if (!projRes.ok) {
        setLoaded(true);
        return;
      }
      const { data: projects } = await projRes.json();

      // 3. Find the most recent in_progress project
      const activeProject = (projects ?? []).find(
        (p: { status: string }) => p.status === "in_progress"
      );

      if (activeProject) {
        setProjectId(activeProject.id ?? String(activeProject._id));
        setActiveModules(
          activeProject.activeModules?.length > 0
            ? activeProject.activeModules
            : DEFAULT_MODULES
        );
      } else {
        // Fallback: try first project regardless of status
        const firstProject = projects?.[0];
        if (firstProject) {
          setProjectId(firstProject.id ?? String(firstProject._id));
          setActiveModules(
            firstProject.activeModules?.length > 0
              ? firstProject.activeModules
              : DEFAULT_MODULES
          );
        } else {
          setProjectId(null);
          setActiveModules(DEFAULT_MODULES);
        }
      }

      // 4. Fetch client invoices and check for milestone locks
      try {
        const invoiceRes = await fetch("/api/invoices/my");
        if (invoiceRes.ok) {
          const { data: invoices } = await invoiceRes.json();
          const now = new Date();
          const locked: ModuleId[] = [];

          for (const inv of invoices ?? []) {
            if (
              inv.paymentModel === "milestone" &&
              inv.moduleId &&
              inv.status !== "paid" &&
              inv.status !== "void" &&
              inv.gracePeriodEndsAt &&
              new Date(inv.gracePeriodEndsAt) <= now
            ) {
              if (!locked.includes(inv.moduleId as ModuleId)) {
                locked.push(inv.moduleId as ModuleId);
              }
            }
          }

          setLockedByInvoice(locked);
        }
      } catch {
        // Silent fail on invoice check
      }
    } catch {
      // Silent fail — use defaults
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { activeModules, lockedByInvoice, projectId, loaded, refresh };
}
