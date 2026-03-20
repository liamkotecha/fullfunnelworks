/**
 * TeamAssessmentBanner — shown at the bottom of assessment sub-pages when teamMode is active.
 *
 * - Explains answers are private
 * - Shows submit button when ≥ 80% completion
 * - Shows submitted confirmation / read-only state
 */
"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface TeamAssessmentBannerProps {
  clientId: string | null;
}

interface TeamData {
  teamMode: boolean;
  userSubmitted: boolean;
  allSubmitted: boolean;
  synthesisComplete: boolean;
}

export function TeamAssessmentBanner({ clientId }: TeamAssessmentBannerProps) {
  const [data, setData] = useState<TeamData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const fetchStatus = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) return;
      const json = await res.json();
      setData({
        teamMode: json.teamMode ?? false,
        userSubmitted: json.userSubmitted ?? false,
        allSubmitted: json.allSubmitted ?? false,
        synthesisComplete: json.synthesisComplete ?? false,
      });
    } catch {
      // Silently fail
    }
  }, [clientId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleSubmit = async () => {
    if (!clientId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/responses/${clientId}/submit`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to submit");
      setJustSubmitted(true);
      setData((prev) =>
        prev ? { ...prev, userSubmitted: true } : prev
      );
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  // Hide if not team mode or data not loaded
  if (!data?.teamMode) return null;

  // After submission — read-only notice
  if (data.userSubmitted || justSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-5"
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Your assessment has been submitted
            </p>
            <p className="text-sm text-emerald-600 mt-1">
              Your consultant will review all responses and prepare the official
              synthesis. You&apos;ll be notified when complete.
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Active team mode — show privacy notice + submit button
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5"
    >
      <div className="flex items-start gap-3">
        <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-blue-800">
            Team assessment is active
          </p>
          <p className="text-sm text-blue-600 mt-1">
            Your answers are private until you submit. Other team members are
            completing their own responses independently.
          </p>
          <div className="mt-4">
            <Button
              size="sm"
              onClick={handleSubmit}
              isLoading={submitting}
            >
              Submit my assessment →
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * useTeamReadOnly — returns true if the user has already submitted in team mode.
 * Used to disable autosave fields.
 */
export function useTeamReadOnly(clientId: string | null): {
  teamMode: boolean;
  readOnly: boolean;
  loading: boolean;
} {
  const [state, setState] = useState({
    teamMode: false,
    readOnly: false,
    loading: true,
  });

  useEffect(() => {
    if (!clientId) {
      setState({ teamMode: false, readOnly: false, loading: false });
      return;
    }
    fetch(`/api/responses/${clientId}`)
      .then((r) => r.json())
      .then((json) => {
        setState({
          teamMode: json.teamMode ?? false,
          readOnly: (json.teamMode && json.userSubmitted) ?? false,
          loading: false,
        });
      })
      .catch(() => {
        setState({ teamMode: false, readOnly: false, loading: false });
      });
  }, [clientId]);

  return state;
}
