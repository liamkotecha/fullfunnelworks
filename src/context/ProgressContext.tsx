/**
 * ProgressContext — global progress state for the portal.
 * Sidebar and pages both read from this context.
 * AutosaveField updates it after every successful save.
 */
"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface SubSectionProgress {
  answeredCount: number;
  totalCount: number;
  lastSavedAt: string | null;
}

interface ProgressContextValue {
  clientId: string | null;
  /** Keyed by sub-section ID, e.g. "assessment-swot" */
  progress: Record<string, SubSectionProgress>;
  /** True once the first server fetch has completed */
  loaded: boolean;
  /** Update a single sub-section after a successful autosave */
  updateSubSection: (
    subSectionId: string,
    data: { answeredCount: number; totalCount: number; lastSavedAt: string }
  ) => void;
  /** Re-fetch all progress from the server */
  refreshAll: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue>({
  clientId: null,
  progress: {},
  loaded: false,
  updateSubSection: () => {},
  refreshAll: async () => {},
});

export function useProgress() {
  return useContext(ProgressContext);
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [clientId, setClientId] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, SubSectionProgress>>(
    {}
  );
  const [loaded, setLoaded] = useState(false);

  // Fetch client ID on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me/client");
        if (!res.ok) return;
        const json = await res.json();
        setClientId(json.clientId);
      } catch {
        /* silent */
      }
    })();
  }, []);

  // Fetch all progress when clientId is known
  const refreshAll = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) return;
      const json = await res.json();
      if (json.subSectionProgress) {
        setProgress(json.subSectionProgress);
      }
    } catch {
      /* silent */
    } finally {
      setLoaded(true);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId) refreshAll();
  }, [clientId, refreshAll]);

  const updateSubSection = useCallback(
    (
      subSectionId: string,
      data: { answeredCount: number; totalCount: number; lastSavedAt: string }
    ) => {
      setProgress((prev) => ({ ...prev, [subSectionId]: data }));
    },
    []
  );

  return (
    <ProgressContext.Provider
      value={{ clientId, progress, loaded, updateSubSection, refreshAll }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
