/**
 * ActivityPing — fires a silent activity ping on every portal page mount.
 * 1. GET /api/me/client → clientId
 * 2. GET /api/projects?clientId=[id] → find first in_progress project
 * 3. POST /api/projects/[projectId]/activity
 * Renders nothing (null). Fires once per page load, silent fail on error.
 */
"use client";

import { useEffect } from "react";

export function ActivityPing() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // 1. Get clientId
        const clientRes = await fetch("/api/me/client");
        if (!clientRes.ok || cancelled) return;
        const { clientId } = await clientRes.json();
        if (!clientId || cancelled) return;

        // 2. Get projects
        const projRes = await fetch(`/api/projects?clientId=${clientId}`);
        if (!projRes.ok || cancelled) return;
        const { data: projects } = await projRes.json();
        if (cancelled) return;

        // 3. Find first in_progress project
        const activeProject = (projects ?? []).find(
          (p: { status: string }) => p.status === "in_progress"
        );
        if (!activeProject) return;

        const projectId = activeProject.id ?? String(activeProject._id);

        // 4. Ping activity
        await fetch(`/api/projects/${projectId}/activity`, { method: "POST" });
      } catch {
        // Silent fail — no error thrown to UI
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
