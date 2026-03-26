/**
 * AutosaveField — wraps any input/textarea with debounced save logic.
 * Saves individual field values via PATCH /api/responses/[clientId]/[section]/[sub]
 * Flushes unsaved changes on unmount (e.g. when navigating between paginated questions).
 * Updates global ProgressContext on save success.
 */
"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useProgress } from "@/context/ProgressContext";
import { trackEvent } from "@/lib/analytics";

interface AutosaveFieldProps {
  fieldId: string;
  clientId: string;
  section: string;
  sub: string;
  initialValue?: string;
  /** Override debounce for this field (ms). Use 0 for immediate save. */
  debounceMs?: number;
  /** When true, field is read-only — no autosave, muted appearance */
  readOnly?: boolean;
  onSaveSuccess?: (result: { answeredCount: number; totalCount: number; lastSavedAt: string }) => void;
  onSaveError?: (error: string) => void;
  children: (props: {
    value: string;
    onChange: (val: string) => void;
    isSaving: boolean;
    isSaved: boolean;
    hasError: boolean;
    retry: () => void;
    readOnly: boolean;
  }) => React.ReactNode;
}

const DEBOUNCE_MS = 1500;

export function AutosaveField({
  fieldId,
  clientId,
  section,
  sub,
  initialValue = "",
  debounceMs,
  readOnly: readOnlyProp,
  onSaveSuccess,
  onSaveError,
  children,
}: AutosaveFieldProps) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasError, setHasError] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedValue = useRef(initialValue);
  const valueRef = useRef(initialValue);
  const { updateSubSection } = useProgress();

  // Sync from server-loaded data only when there is no pending local change.
  // If the user has already typed (valueRef !== lastSaved), skip — otherwise
  // resetting lastSavedValue would cause the debounced save to no-op.
  useEffect(() => {
    if (valueRef.current === lastSavedValue.current) {
      setValue(initialValue);
      valueRef.current = initialValue;
      lastSavedValue.current = initialValue;
    }
  }, [initialValue]);

  const doSave = useCallback(
    async (val: string) => {
      if (val === lastSavedValue.current) return;

      setIsSaving(true);
      setHasError(false);
      setIsSaved(false);

      try {
        const res = await fetch(`/api/responses/${clientId}/${section}/${sub}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, value: val }),
          keepalive: true,
        });

        if (!res.ok) {
          throw new Error(
            res.status >= 500
              ? "Couldn't save — server error, please try again"
              : res.status === 401 || res.status === 403
              ? "Couldn't save — your session may have expired, please refresh"
              : "Couldn't save — please check your connection and try again"
          );
        }

        const result = await res.json();
        lastSavedValue.current = val;
        setIsSaving(false);
        setIsSaved(true);
        onSaveSuccess?.(result);
        updateSubSection(`${section}-${sub}`, result);

        // Fire GA4 section_completed event when subsection hits 100%
        if (result.justCompleted) {
          trackEvent("section_completed", { section, sub_section: sub });
        }

        // Clear "Saved" indicator after 2s
        if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
        savedTimerRef.current = setTimeout(() => setIsSaved(false), 4000);
      } catch (err) {
        setIsSaving(false);
        setHasError(true);
        onSaveError?.(err instanceof Error ? err.message : "Save failed");
      }
    },
    [fieldId, clientId, section, sub, onSaveSuccess, onSaveError, updateSubSection]
  );

  const onChange = useCallback(
    (val: string) => {
      // Read-only mode: no changes allowed
      if (readOnlyProp) return;

      setValue(val);
      valueRef.current = val;
      setIsSaved(false);
      setHasError(false);

      if (timerRef.current) clearTimeout(timerRef.current);

      const ms = debounceMs ?? DEBOUNCE_MS;
      if (ms <= 0) {
        void doSave(val);
        return;
      }

      timerRef.current = setTimeout(() => doSave(val), ms);
    },
    [debounceMs, doSave, readOnlyProp]
  );

  const retry = useCallback(() => {
    doSave(value);
  }, [doSave, value]);

  // Keep a ref to updateSubSection so the cleanup closure always has the latest
  const updateRef = useRef(updateSubSection);
  useEffect(() => { updateRef.current = updateSubSection; }, [updateSubSection]);

  // Flush unsaved changes on unmount — save AND update sidebar progress
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

      if (valueRef.current !== lastSavedValue.current) {
        fetch(`/api/responses/${clientId}/${section}/${sub}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fieldId, value: valueRef.current }),
          keepalive: true,
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((result) => {
            if (result) {
              // Update ProgressContext so sidebar reflects the change immediately
              updateRef.current(`${section}-${sub}`, result);
            }
          })
          .catch(() => {});
      }
    };
    // These props are stable for a given instance — safe to reference in cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children({ value, onChange, isSaving, isSaved, hasError, retry, readOnly: !!readOnlyProp })}</>;
}
