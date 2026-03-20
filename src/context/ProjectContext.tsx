"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { useProjectStaleness } from "@/hooks/useProjectStaleness";
import { useActiveModules } from "@/hooks/useActiveModules";
import type { StalenessStatus, ModuleId, ProjectDTO } from "@/types";

interface ProjectContextValue {
  projectId: string | null;
  staleness: StalenessStatus | null;
  readOnly: boolean;
  activeModules: ModuleId[];
  lockedByInvoice: ModuleId[];
  project: ProjectDTO | null;
  loaded: boolean;
  refreshModules: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue>({
  projectId: null,
  staleness: null,
  readOnly: false,
  activeModules: ["assessment"],
  lockedByInvoice: [],
  project: null,
  loaded: false,
  refreshModules: async () => {},
});

export function useProjectContext(): ProjectContextValue {
  return useContext(ProjectContext);
}

export function ProjectProvider({ children }: { children: ReactNode }) {
  const {
    staleness,
    projectId: stalenessProjectId,
    project,
    loaded: stalenessLoaded,
  } = useProjectStaleness();

  const {
    activeModules,
    lockedByInvoice,
    projectId: modulesProjectId,
    loaded: modulesLoaded,
    refresh: refreshModules,
  } = useActiveModules();

  const value = useMemo<ProjectContextValue>(
    () => ({
      projectId: stalenessProjectId ?? modulesProjectId,
      staleness,
      readOnly: staleness === "terminated",
      activeModules,
      lockedByInvoice,
      project,
      loaded: stalenessLoaded && modulesLoaded,
      refreshModules,
    }),
    [
      stalenessProjectId,
      modulesProjectId,
      staleness,
      activeModules,
      lockedByInvoice,
      project,
      stalenessLoaded,
      modulesLoaded,
      refreshModules,
    ]
  );

  return (
    <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>
  );
}
