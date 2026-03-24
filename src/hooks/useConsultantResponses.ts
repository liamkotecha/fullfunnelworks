"use client";

import { useEffect, useState } from "react";

interface UseConsultantResponsesReturn {
  responses: Record<string, unknown>;
  loading: boolean;
  updatedAt: string | null;
}

export function useConsultantResponses(
  section: string,
  sub: string
): UseConsultantResponsesReturn {
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/me/consultant-responses/${section}/${sub}`)
      .then((r) => r.json())
      .then((d) => {
        setResponses(d.responses ?? {});
        setUpdatedAt(d.updatedAt ?? null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [section, sub]);

  return { responses, loading, updatedAt };
}
