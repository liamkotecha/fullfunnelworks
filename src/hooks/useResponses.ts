/**
 * useResponses — loads all saved responses for a client.
 * Used by portal section pages to hydrate field values and track progress.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useProgress } from "@/context/ProgressContext";

interface ResponsesData {
  responses: Record<string, unknown>;
  subSectionProgress: Record<string, { answeredCount: number; totalCount: number; lastSavedAt: string }>;
  lastActiveSub: string;
  overallProgress: number;
}

interface UseResponsesReturn {
  responses: Record<string, unknown>;
  subSectionProgress: Record<string, { answeredCount: number; totalCount: number; lastSavedAt: string }>;
  loading: boolean;
  /** True once the first real fetch (with a valid clientId) has completed */
  hasFetched: boolean;
  error: string | null;
  refetch: () => void;
  /** Update a single response locally (optimistic) */
  setLocalResponse: (fieldId: string, value: unknown) => void;
  /** Update sub-section progress locally after save */
  setLocalProgress: (subSectionId: string, data: { answeredCount: number; totalCount: number; lastSavedAt: string }) => void;
}

export function useResponses(clientId: string | null): UseResponsesReturn {
  const { updateSubSection } = useProgress();
  const [data, setData] = useState<ResponsesData>({
    responses: {},
    subSectionProgress: {},
    lastActiveSub: "",
    overallProgress: 0,
  });
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    if (!clientId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) throw new Error("Failed to load responses");
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, [clientId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  const setLocalResponse = useCallback((fieldId: string, value: unknown) => {
    setData((prev) => ({
      ...prev,
      responses: { ...prev.responses, [fieldId]: value },
    }));
  }, []);

  const setLocalProgress = useCallback(
    (subSectionId: string, progress: { answeredCount: number; totalCount: number; lastSavedAt: string }) => {
      setData((prev) => ({
        ...prev,
        subSectionProgress: { ...prev.subSectionProgress, [subSectionId]: progress },
      }));
      // Also push to ProgressContext so the sidebar updates immediately
      updateSubSection(subSectionId, progress);
    },
    [updateSubSection]
  );

  return {
    responses: data.responses,
    subSectionProgress: data.subSectionProgress,
    loading,
    hasFetched,
    error,
    refetch: fetch_,
    setLocalResponse,
    setLocalProgress,
  };
}
