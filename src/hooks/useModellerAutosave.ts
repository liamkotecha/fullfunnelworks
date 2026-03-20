/**
 * useModellerAutosave — debounced PUT of whole document.
 * Same debounce pattern as AutosaveField (1500 ms), but sends the entire
 * ModellerData blob instead of a single field.
 */
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ModellerData } from "@/lib/modeller/calc";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useModellerAutosave(
  data: ModellerData | null,
  endpoint: string,
  enabled = true
) {
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  const isFirst = useRef(true);

  // Keep ref in sync
  latestData.current = data;

  const flush = useCallback(async () => {
    if (!latestData.current) return;
    setStatus("saving");
    try {
      const res = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(latestData.current),
      });
      if (!res.ok) throw new Error(res.statusText);
      setStatus("saved");
      setSavedAt(new Date());
    } catch {
      setStatus("error");
    }
  }, [endpoint]);

  useEffect(() => {
    if (!enabled || !data) return;
    // Skip the first render (initial load)
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 1500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [data, enabled, flush]);

  return { status, savedAt, flush };
}
