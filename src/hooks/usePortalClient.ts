/**
 * usePortalClient — fetches the clientId for the logged-in user.
 * Used by all portal section pages to pass clientId to AutosaveField.
 */
"use client";

import { useEffect, useState, useCallback } from "react";

interface PortalClientData {
  clientId: string;
  businessName: string;
  status: string;
  plan: string;
}

interface UsePortalClientReturn {
  clientId: string | null;
  businessName: string | null;
  plan: string;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function usePortalClient(): UsePortalClientReturn {
  const [data, setData] = useState<PortalClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/me/client");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to load client" }));
        throw new Error(err.error || "Failed to load client");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return {
    clientId: data?.clientId ?? null,
    businessName: data?.businessName ?? null,
    plan: data?.plan ?? "standard",
    loading,
    error,
    refetch: fetch_,
  };
}
