/**
 * useQuestions — fetches framework questions from the DB for a given section/subSection.
 * Falls back to concept-map data if DB is empty (not yet seeded).
 */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";

export interface FrameworkQuestion {
  _id: string;
  fieldId: string;
  group?: string;
  question: string;
  subPrompt?: string;
  label?: string;
  type: "textarea" | "text" | "checkbox" | "slider" | "select";
  placeholder?: string;
  weightFieldId?: string;
  order: number;
  metadata?: Record<string, unknown>;
}

interface UseQuestionsResult {
  questions: FrameworkQuestion[];
  loading: boolean;
  error: string | null;
  /** Group questions by their group field */
  grouped: Record<string, FrameworkQuestion[]>;
  refresh: () => Promise<void>;
}

export function useQuestions(section: string, subSection: string): UseQuestionsResult {
  const [questions, setQuestions] = useState<FrameworkQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/questions?section=${section}&subSection=${subSection}`);
      if (!res.ok) throw new Error(`Failed to fetch questions: ${res.status}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [section, subSection]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Group by the `group` field (memoized to avoid re-computing on every render)
  const grouped = useMemo(
    () =>
      questions.reduce<Record<string, FrameworkQuestion[]>>((acc, q) => {
        const key = q.group ?? "_ungrouped";
        if (!acc[key]) acc[key] = [];
        acc[key].push(q);
        return acc;
      }, {}),
    [questions]
  );

  return { questions, loading, error, grouped, refresh: fetchQuestions };
}
