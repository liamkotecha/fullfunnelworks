/**
 * Synthesis View — consultant reviews all team member answers side by side
 * and writes the official synthesis for each assessment question.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Input";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useToast } from "@/components/notifications/ToastContext";
import { cn } from "@/lib/utils";

interface Answer {
  userId: string;
  name: string;
  role: string;
  value: unknown;
}

interface SynthesisQuestion {
  fieldId: string;
  question: string;
  subSection: string;
  group: string | null;
  type: string;
  answers: Answer[];
  divergence: number;
  existingSynthesis: unknown;
  synthesisSource: string | null;
}

interface TeamInfo {
  teamMode: boolean;
  members: Array<{ userId: string; name: string; isComplete: boolean }>;
  allSubmitted: boolean;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const fadeUp = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

function divergenceLabel(d: number): { text: string; color: string; variant: "success" | "warning" | "error" } {
  if (d <= 0.2) return { text: "Strong consensus", color: "bg-emerald-500", variant: "success" };
  if (d <= 0.5) return { text: "Some variation", color: "bg-amber-500", variant: "warning" };
  return { text: "High divergence", color: "bg-red-500", variant: "error" };
}

export default function SynthesisPage() {
  const { id } = useParams<{ id: string }>();
  const { success, error: toastError } = useToast();

  const [questions, setQuestions] = useState<SynthesisQuestion[]>([]);
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [synthValues, setSynthValues] = useState<Record<string, string>>({});
  const [savingField, setSavingField] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [synthRes, teamRes] = await Promise.all([
        fetch(`/api/responses/${id}/synthesis`),
        fetch(`/api/team/${id}`),
      ]);
      const synthData = await synthRes.json();
      const teamData = await teamRes.json();
      setQuestions(synthData.questions ?? []);
      setTeamInfo(teamData);

      // Pre-populate synthesis values
      const vals: Record<string, string> = {};
      for (const q of synthData.questions ?? []) {
        if (q.existingSynthesis != null) {
          vals[q.fieldId] = String(q.existingSynthesis);
        }
      }
      setSynthValues(vals);
    } catch {
      toastError("Failed to load synthesis data");
    } finally {
      setLoading(false);
    }
  }, [id, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const saveSynthesis = async (fieldId: string, value: string, source: "consultant" | "consensus" = "consultant") => {
    setSavingField(fieldId);
    try {
      const res = await fetch(`/api/responses/${id}/synthesis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ fieldId, value, source }]),
      });
      if (!res.ok) throw new Error("Failed to save");
      // Update local state
      setQuestions((prev) =>
        prev.map((q) =>
          q.fieldId === fieldId ? { ...q, existingSynthesis: value, synthesisSource: source } : q
        )
      );
    } catch {
      toastError("Failed to save synthesis");
    } finally {
      setSavingField(null);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    try {
      // Save all unsaved entries first
      const unsaved = questions.filter(
        (q) => synthValues[q.fieldId] && !q.existingSynthesis
      );
      if (unsaved.length > 0) {
        const body = unsaved.map((q) => ({
          fieldId: q.fieldId,
          value: synthValues[q.fieldId],
          source: "consultant" as const,
        }));
        const res = await fetch(`/api/responses/${id}/synthesis`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to save");
      }
      success("Synthesis complete", "Canonical responses have been saved.");
      fetchData();
    } catch {
      toastError("Failed to complete synthesis");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard lines={3} />
        <SkeletonCard lines={5} />
        <SkeletonCard lines={5} />
      </div>
    );
  }

  const submittedCount = teamInfo?.members?.filter((m) => m.isComplete).length ?? 0;
  const totalMembers = teamInfo?.members?.length ?? 0;
  const synthesisedCount = questions.filter((q) => q.existingSynthesis != null).length;
  const totalQuestions = questions.length;
  const allSynthesised = synthesisedCount >= totalQuestions && totalQuestions > 0;

  // Group by sub-section
  const grouped: Record<string, SynthesisQuestion[]> = {};
  for (const q of questions) {
    const key = q.subSection;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  }

  const SUB_SECTION_LABELS: Record<string, string> = {
    checklist: "Assessment Checklist",
    swot: "SWOT Analysis",
    most: "MOST Analysis",
    gap: "Gap Analysis",
    leadership: "Leadership Questions",
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6 max-w-4xl">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-xl font-bold text-slate-900">Assessment Synthesis</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review all team member responses and write the official synthesis.
        </p>
      </motion.div>

      {/* Status */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        <Badge variant={submittedCount === totalMembers ? "success" : "warning"} dot>
          {submittedCount} of {totalMembers} members submitted
        </Badge>
        <Badge variant={allSynthesised ? "success" : "info"} dot>
          Synthesis: {synthesisedCount} / {totalQuestions} fields
        </Badge>
      </motion.div>

      {/* Questions by sub-section */}
      {Object.entries(grouped).map(([subSection, qs]) => (
        <motion.div key={subSection} variants={fadeUp} className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
            {SUB_SECTION_LABELS[subSection] ?? subSection}
          </h2>

          {qs.map((q) => {
            const div = divergenceLabel(q.divergence);
            const currentValue = synthValues[q.fieldId] ?? "";
            const isSaving = savingField === q.fieldId;

            return (
              <div
                key={q.fieldId}
                className="card border border-slate-100 space-y-4"
              >
                {/* Question header + divergence */}
                <div className="flex items-start justify-between gap-4">
                  <p className="text-sm font-medium text-slate-900 leading-relaxed">
                    {q.question}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-20 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", div.color)}
                        style={{ width: `${Math.round(q.divergence * 100)}%` }}
                      />
                    </div>
                    <Badge variant={div.variant}>{div.text}</Badge>
                  </div>
                </div>

                {/* Team answers */}
                <div className="space-y-2">
                  {q.answers.map((a) => (
                    <div
                      key={a.userId}
                      className="flex gap-3 p-3 rounded-lg bg-slate-50 text-sm"
                    >
                      <div className="w-7 h-7 rounded-full bg-[#141414] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {a.name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-700">{a.name}</span>
                          {a.role && (
                            <span className="text-xs text-slate-400">({a.role})</span>
                          )}
                        </div>
                        <p className="text-slate-600 whitespace-pre-wrap">
                          {a.value != null && String(a.value).trim()
                            ? String(a.value)
                            : "—"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (a.value != null) {
                            setSynthValues((prev) => ({ ...prev, [q.fieldId]: String(a.value) }));
                          }
                        }}
                        className="text-xs text-slate-400 hover:text-slate-600 font-medium flex-shrink-0 transition-colors"
                        title={`Use ${a.name}'s answer`}
                      >
                        Use
                      </button>
                    </div>
                  ))}
                </div>

                {/* Synthesis textarea */}
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Synthesis
                  </p>
                  <Textarea
                    value={currentValue}
                    onChange={(e) =>
                      setSynthValues((prev) => ({ ...prev, [q.fieldId]: e.target.value }))
                    }
                    onBlur={() => {
                      if (currentValue.trim()) {
                        saveSynthesis(q.fieldId, currentValue);
                      }
                    }}
                    placeholder="Write the official synthesised answer..."
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      {q.answers.map((a) => (
                        <button
                          key={a.userId}
                          onClick={() => {
                            if (a.value != null) {
                              const val = String(a.value);
                              setSynthValues((prev) => ({ ...prev, [q.fieldId]: val }));
                              saveSynthesis(q.fieldId, val);
                            }
                          }}
                          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                        >
                          Use {a.name.split(" ")[0]}&apos;s
                        </button>
                      ))}
                    </div>
                    {isSaving ? (
                      <span className="text-xs text-slate-400">Saving...</span>
                    ) : q.existingSynthesis != null ? (
                      <span className="text-xs text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      ))}

      {/* Complete synthesis */}
      {totalQuestions > 0 && (
        <motion.div variants={fadeUp} className="flex justify-end pt-4 pb-8">
          <Button
            onClick={handleComplete}
            isLoading={completing}
            disabled={!allSynthesised}
            variant={allSynthesised ? "primary" : "secondary"}
            leftIcon={allSynthesised ? <CheckCircle2 className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
          >
            {allSynthesised
              ? "Complete Synthesis"
              : `${totalQuestions - synthesisedCount} fields remaining`}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
