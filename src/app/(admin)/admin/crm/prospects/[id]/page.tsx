/**
 * Prospect Detail — full profile with stage management, activity timeline,
 * notes, tasks, deal value editor, and conversion flow.
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronDown,
  Send,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  ArrowRight,
  UserPlus,
  Loader2,
  Trash2,
  ExternalLink,
  Plus,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate, formatDateTime } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type {
  ProspectDTO,
  ProspectStage,
  ActivityLogEntryDTO,
  ProspectTaskDTO,
} from "@/types";
import { PROSPECT_STAGE_META } from "@/types";

const STAGES: ProspectStage[] = ["mql", "sql", "discovery", "proposal", "negotiating", "won", "lost"];

const STAGE_COLORS: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  green: "bg-emerald-500",
  gray: "bg-slate-400",
};

interface Consultant {
  _id: string;
  name: string;
}

/* ── Activity icon ────────────────────────────────────────── */
function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "stage_change":
      return <ArrowRight className="w-3.5 h-3.5 text-blue-500" />;
    case "note":
      return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
    case "assignment":
      return <UserPlus className="w-3.5 h-3.5 text-indigo-500" />;
    default:
      return <Circle className="w-3.5 h-3.5 text-slate-400" />;
  }
}

export default function ProspectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [prospect, setProspect] = useState<ProspectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [sendingNote, setSendingNote] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [converting, setConverting] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [lostReason, setLostReason] = useState("");
  const [markingLost, setMarkingLost] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [editingDeal, setEditingDeal] = useState(false);
  const [dealInput, setDealInput] = useState("");
  const hasFetched = useRef(false);

  const fetchProspect = useCallback(async () => {
    try {
      const res = await fetch(`/api/prospects/${id}`);
      const json = await res.json();
      if (res.ok) setProspect(json.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchProspect();
    fetch("/api/admin/users?role=admin,consultant")
      .then((r) => r.json())
      .then((d) => setConsultants(d.data ?? []))
      .catch(() => {});
  }, [fetchProspect]);

  /* ── Patch helper ───────────────────────────────────── */
  const patchProspect = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (res.ok) setProspect(json.data);
    return res.ok;
  };

  /* ── Stage change ───────────────────────────────────── */
  const handleStageChange = async (stage: ProspectStage) => {
    if (stage === "lost") {
      setShowLostModal(true);
      return;
    }
    await patchProspect({ stage });
  };

  const handleMarkLost = async () => {
    if (!lostReason.trim()) return;
    setMarkingLost(true);
    await patchProspect({ stage: "lost", lostReason: lostReason.trim() });
    setMarkingLost(false);
    setShowLostModal(false);
    setLostReason("");
  };

  /* ── Add note ───────────────────────────────────────── */
  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSendingNote(true);
    await patchProspect({ addNote: note.trim() });
    setNote("");
    setSendingNote(false);
  };

  /* ── Add task ───────────────────────────────────────── */
  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    setAddingTask(true);
    await patchProspect({
      addTask: {
        title: taskTitle.trim(),
        dueDate: taskDue || undefined,
      },
    });
    setTaskTitle("");
    setTaskDue("");
    setAddingTask(false);
  };

  /* ── Complete task ──────────────────────────────────── */
  const handleCompleteTask = async (taskId: string) => {
    await patchProspect({ completeTask: taskId });
  };

  /* ── Assign consultant ──────────────────────────────── */
  const handleAssign = async (consultantId: string) => {
    await patchProspect({
      assignedConsultant: consultantId || null,
    });
  };

  /* ── Deal value ─────────────────────────────────────── */
  const handleDealSave = async () => {
    const pence = Math.round(parseFloat(dealInput || "0") * 100);
    await patchProspect({ dealValue: pence || 0 });
    setEditingDeal(false);
  };

  /* ── Convert to client ──────────────────────────────── */
  const handleConvert = async () => {
    setConverting(true);
    try {
      const res = await fetch(`/api/prospects/${id}/convert`, { method: "POST" });
      const json = await res.json();
      if (res.ok && json.clientId) {
        router.push(`/admin/clients/${json.clientId}`);
      }
    } catch {
      // silent
    } finally {
      setConverting(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────── */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      router.push("/admin/crm/prospects");
    } catch {
      // silent
    } finally {
      setDeleting(false);
    }
  };

  /* ── Loading ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!prospect) {
    return (
      <div className="text-center py-32">
        <p className="text-slate-500">Prospect not found.</p>
        <Link href="/admin/crm/prospects" className="text-sm text-brand-blue mt-2 inline-block">
          Back to prospects
        </Link>
      </div>
    );
  }

  const meta = PROSPECT_STAGE_META[prospect.stage];
  const activities = [...(prospect.activityLog ?? [])].reverse();
  const pendingTasks = (prospect.tasks ?? []).filter((t) => !t.completedAt);
  const completedTasks = (prospect.tasks ?? []).filter((t) => t.completedAt);

  return (
    <div>
      {/* ── Back + title bar ─────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/admin/crm/pipeline"
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 truncate">
            {prospect.businessName}
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {prospect.contactName} &middot; {prospect.contactEmail}
            {prospect.phone && <> &middot; {prospect.phone}</>}
          </p>
        </div>
        <LeadScoreBadge score={prospect.leadScore} variant="full" />
      </div>

      {/* ── Two-column layout ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stage selector */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Pipeline Stage</h3>
            <div className="flex flex-wrap gap-2">
              {STAGES.map((s) => {
                const sm = PROSPECT_STAGE_META[s];
                const isActive = prospect.stage === s;
                return (
                  <button
                    key={s}
                    onClick={() => handleStageChange(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border",
                      isActive
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        STAGE_COLORS[sm.colour] ?? "bg-slate-400"
                      )}
                    />
                    {sm.label}
                  </button>
                );
              })}
            </div>
            {prospect.stage === "lost" && prospect.lostReason && (
              <p className="text-xs text-red-500 mt-2">
                Lost reason: {prospect.lostReason}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {prospect.daysInStage} day{prospect.daysInStage !== 1 ? "s" : ""} in {meta.label}
            </p>
          </div>

          {/* Add note */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Add Note</h3>
            <div className="flex gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Type a note…"
                rows={2}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy resize-none transition-all"
              />
              <Button
                onClick={handleAddNote}
                disabled={!note.trim() || sendingNote}
                isLoading={sendingNote}
                className="self-end"
              >
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity</h3>
            {activities.length === 0 ? (
              <p className="text-sm text-slate-400">No activity yet.</p>
            ) : (
              <div className="space-y-0">
                {activities.map((entry, i) => (
                  <div key={entry._id} className="flex gap-3 relative">
                    {/* Connector line */}
                    {i < activities.length - 1 && (
                      <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-100" />
                    )}
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0 z-10">
                      <ActivityIcon type={entry.type} />
                    </div>
                    {/* Content */}
                    <div className="pb-4 min-w-0">
                      <p className="text-sm text-slate-700">{entry.message}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {entry.createdBy?.name && (
                          <span className="font-medium text-slate-500">{entry.createdBy.name} &middot; </span>
                        )}
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN (1/3) ─────────────────────────── */}
        <div className="space-y-6">
          {/* Details card */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Details</h3>

            {/* Deal value */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Deal Value
              </label>
              {editingDeal ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-slate-500">£</span>
                  <input
                    type="number"
                    value={dealInput}
                    onChange={(e) => setDealInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleDealSave}>Save</Button>
                </div>
              ) : (
                <p
                  className="text-sm text-slate-700 mt-1 cursor-pointer hover:text-slate-900"
                  onClick={() => {
                    setDealInput(prospect.dealValue ? String(prospect.dealValue / 100) : "");
                    setEditingDeal(true);
                  }}
                >
                  {prospect.dealValue ? formatPence(prospect.dealValue) : "Not set — click to add"}
                </p>
              )}
            </div>

            {/* Assigned consultant */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Assigned to
              </label>
              <select
                value={prospect.assignedConsultant?.id ?? ""}
                onChange={(e) => handleAssign(e.target.value)}
                className="w-full mt-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                <option value="">Unassigned</option>
                {consultants.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Source */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Source
              </label>
              <p className="text-sm text-slate-700 mt-1 capitalize">
                {prospect.source.replace(/_/g, " ")}
              </p>
            </div>

            {/* GA4 Tracking */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                GA4 tracking
              </label>
              {prospect.gaClientId ? (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  Client ID captured
                </p>
              ) : (
                <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />
                  No client ID
                </p>
              )}
            </div>

            {/* Company info */}
            {prospect.companySize && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Company Size
                </label>
                <p className="text-sm text-slate-700 mt-1">{prospect.companySize}</p>
              </div>
            )}
            {prospect.revenueRange && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Revenue Range
                </label>
                <p className="text-sm text-slate-700 mt-1">{prospect.revenueRange}</p>
              </div>
            )}
            {prospect.primaryChallenge && (
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Primary Challenge
                </label>
                <p className="text-sm text-slate-700 mt-1">{prospect.primaryChallenge}</p>
              </div>
            )}

            {/* Created */}
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </label>
              <p className="text-sm text-slate-700 mt-1">{formatDate(prospect.createdAt)}</p>
            </div>
          </div>

          {/* Tasks card */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Tasks</h3>

            {/* Add task form */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="New task…"
                onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy transition-all"
              />
              <Button
                size="sm"
                onClick={handleAddTask}
                disabled={!taskTitle.trim() || addingTask}
                isLoading={addingTask}
              >
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Task due date */}
            {taskTitle.trim() && (
              <div className="mb-4">
                <input
                  type="date"
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600"
                />
              </div>
            )}

            {/* Pending tasks */}
            {pendingTasks.length > 0 && (
              <div className="space-y-2">
                {pendingTasks.map((t) => (
                  <div key={t._id} className="flex items-start gap-2 group">
                    <button
                      onClick={() => handleCompleteTask(t._id)}
                      className="mt-0.5 text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-700">{t.title}</p>
                      {t.dueDate && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Due {formatDate(t.dueDate)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  Completed
                </p>
                {completedTasks.map((t) => (
                  <div key={t._id} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-slate-400 line-through">{t.title}</p>
                  </div>
                ))}
              </div>
            )}

            {pendingTasks.length === 0 && completedTasks.length === 0 && (
              <p className="text-xs text-slate-400">No tasks yet.</p>
            )}
          </div>

          {/* Actions card */}
          <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-900">Actions</h3>

            {/* Convert button — only for won stage, not yet converted */}
            {prospect.stage === "won" && !prospect.convertedAt && (
              <Button
                onClick={handleConvert}
                isLoading={converting}
                className="w-full"
              >
                <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
                Convert to client
              </Button>
            )}

            {prospect.convertedAt && prospect.clientId && (
              <Link href={`/admin/clients/${prospect.clientId}`}>
                <Button variant="secondary" className="w-full">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View client record
                </Button>
              </Link>
            )}

            <Button
              variant="danger"
              onClick={() => setShowDeleteModal(true)}
              className="w-full"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete prospect
            </Button>
          </div>
        </div>
      </div>

      {/* ── Lost reason modal ────────────────────────────── */}
      {showLostModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy/40 backdrop-blur-sm" onClick={() => setShowLostModal(false)} />
          <div className="relative w-full max-w-sm bg-white rounded-lg shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mark as Lost</h3>
            <p className="text-sm text-slate-500 mb-4">Please provide a reason for losing this prospect.</p>
            <textarea
              value={lostReason}
              onChange={(e) => setLostReason(e.target.value)}
              placeholder="Reason (required)"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 mb-4"
            />
            <div className="flex items-center gap-2 justify-end">
              <Button variant="secondary" onClick={() => setShowLostModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleMarkLost}
                disabled={!lostReason.trim()}
                isLoading={markingLost}
              >
                Mark as lost
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ─────────────────────────────────── */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete prospect"
        description="This will permanently delete this prospect and all their data. This cannot be undone."
        confirmLabel="Delete"
        confirmVariant="danger"
        isLoading={deleting}
      />
    </div>
  );
}
