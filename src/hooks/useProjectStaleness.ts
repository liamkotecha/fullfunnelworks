/**
 * useProjectStaleness — fetches the current client's active project staleness.
 * Used by portal layout to determine which state treatment to render.
 *
 * Returns:
 * - staleness: StalenessStatus | null
 * - projectId: string | null
 * - project: ProjectDTO | null
 * - loaded: boolean
 *
 * Strategy:
 * 1. GET /api/me/client → clientId
 * 2. GET /api/projects?clientId=[id] → find most recent non-terminated project
 * 3. Return its staleness
 *
 * Cached for the session — does not re-fetch on every page navigation.
 * Uses module-level cache since this does not need React state persistence.
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { StalenessStatus, ProjectDTO } from "@/types";

// Module-level session cache
let cachedResult: {
  staleness: StalenessStatus | null;
  projectId: string | null;
  project: ProjectDTO | null;
} | null = null;

export interface UseProjectStalenessResult {
  staleness: StalenessStatus | null;
  projectId: string | null;
  project: ProjectDTO | null;
  loaded: boolean;
}

export function useProjectStaleness(): UseProjectStalenessResult {
  const [staleness, setStaleness] = useState<StalenessStatus | null>(
    cachedResult?.staleness ?? null
  );
  const [projectId, setProjectId] = useState<string | null>(
    cachedResult?.projectId ?? null
  );
  const [project, setProject] = useState<ProjectDTO | null>(
    cachedResult?.project ?? null
  );
  const [loaded, setLoaded] = useState(!!cachedResult);

  const fetch_ = useCallback(async () => {
    if (cachedResult) {
      setStaleness(cachedResult.staleness);
      setProjectId(cachedResult.projectId);
      setProject(cachedResult.project);
      setLoaded(true);
      return;
    }

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
      if (!projects || projects.length === 0) {
        setLoaded(true);
        return;
      }

      // 3. Find the most recent non-terminated project (prefer in_progress)
      const activeProject =
        (projects as ProjectDTO[]).find(
          (p) => p.status === "in_progress" && p.staleness !== "terminated"
        ) ??
        (projects as ProjectDTO[]).find((p) => p.staleness !== "terminated") ??
        (projects as ProjectDTO[])[0];

      const result = {
        staleness: activeProject.staleness ?? null,
        projectId: activeProject.id ?? String(activeProject._id),
        project: activeProject,
      };

      // Cache for session
      cachedResult = result;
      setStaleness(result.staleness);
      setProjectId(result.projectId);
      setProject(result.project);
    } catch {
      // Silent fail
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { staleness, projectId, project, loaded };
}
