"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, CheckCircle, Clock, Plus, X, TrendingUp, ClipboardCheck, RotateCcw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Select, Textarea, Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ProjectDTO, PROJECT_STATUS_META, ProjectStatus } from "@/types";
import { detectMisalignments, ModuleKey, MisalignmentWarning } from "@/lib/module-dependencies";

// ── Helpers ───────────────────────────────────────────────────

type SubProgressMap = Record<string, { answeredCount: number; totalCount: number }>;

function keyToModule(key: string): ModuleKey | null {
  if (key.startsWith("assessment")) return "assessment";
  if (key.startsWith("people")) return "people";
  if (key.startsWith("product")) return "product";
  if (key.startsWith("process")) return "process";
  if (key.startsWith("gtm")) return "gtm";
  if (key.startsWith("revenue_execution")) return "revenue_execution";
  if (key.startsWith("execution_planning")) return "execution_planning";
  if (key.startsWith("roadmap")) return "roadmap";
  if (key.startsWith("kpis")) return "kpis";
  return null;
}

function computeModuleCompletions(subProgress: SubProgressMap): Partial<Record<ModuleKey, number>> {
  const groups: Partial<Record<ModuleKey, number[]>> = {};
  for (const [key, val] of Object.entries(subProgress)) {
    if (val.totalCount === 0) continue;
    const mod = keyToModule(key);
    if (!mod) continue;
    const pct = Math.round((val.answeredCount / val.totalCount) * 100);
    if (!groups[mod]) groups[mod] = [];
    groups[mod]!.push(pct);
  }
  const result: Partial<Record<ModuleKey, number>> = {};
  for (const [mod, pcts] of Object.entries(groups) as [ModuleKey, number[]][]) {
    result[mod] = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
  }
  return result;
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [project, setProject] = useState<ProjectDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockModal, setBlockModal] = useState(false);
  const [resolveModal, setResolveModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);
  const [milestoneModal, setMilestoneModal] = useState(false);
  const [resetModal, setResetModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [newStatus, setNewStatus] = useState<ProjectStatus>("in_progress");
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "" });
  const [saving, setSaving] = useState(false);
  const [misalignments, setMisalignments] = useState<MisalignmentWarning[]>([]);

  const load = () => {
    fetch(`/api/projects/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const p = d.data ?? null;
        setProject(p);
        if (p) {
          setNewStatus(p.status);
          // Fetch client progress for misalignment detection
          const clientId = typeof p.clientId === "object" ? p.clientId._id : p.clientId;
          fetch(`/api/responses/${clientId}`)
            .then((r) => r.json())
            .then((resp) => {
              const subProgress: SubProgressMap = resp.subSectionProgress ?? {};
              const completions = computeModuleCompletions(subProgress);
              setMisalignments(detectMisalignments(completions));
            })
            .catch(() => {});
        }
        setLoading(false);
      });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [id]);

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}/reset`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Responses cleared", "All framework answers have been reset.");
      setResetModal(false);
      setMisalignments([]);
      load();
    } catch (e) {
      toastError("Reset failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleRaiseBlock = async () => {
    if (!blockReason) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "raiseBlock", reason: blockReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Block raised", "Notification sent to the team.");
      setBlockModal(false);
      setBlockReason("");
      load();
    } catch (e) {
      toastError("Failed to raise block", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleResolveBlock = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resolveBlock" }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Block resolved", "Project is back on track.");
      setResolveModal(false);
      load();
    } catch (e) {
      toastError("Failed to resolve block", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Status updated");
      setStatusModal(false);
      load();
    } catch (e) {
      toastError("Failed to update", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SkeletonCard lines={5} />
      <SkeletonCard lines={3} />
    </div>
  );

  if (!project) return (
    <div className="max-w-3xl mx-auto text-center py-20">
      <p className="text-slate-500">Project not found.</p>
      <Button variant="secondary" className="mt-4" onClick={() => router.push("/admin/projects")}>
        Back to projects
      </Button>
    </div>
  );

  const meta = PROJECT_STATUS_META[project.status];
  const openBlocks = project.blocks?.filter((b) => !b.resolvedAt) ?? [];
  const isBlocked = project.status === "blocked";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/projects")}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </button>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {isBlocked && <AlertTriangle className="w-5 h-5 text-red-500" />}
              <h1 className="text-xl font-bold text-slate-900">{project.title}</h1>
            </div>
            {project.description && (
              <p className="text-sm text-slate-500">{project.description}</p>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="secondary" onClick={() => setStatusModal(true)}>
              Change Status
            </Button>
            {isBlocked ? (
              <Button size="sm" variant="secondary" onClick={() => setResolveModal(true)}>
                Resolve Block
              </Button>
            ) : (
              <Button size="sm" variant="danger" leftIcon={<AlertTriangle className="w-3.5 h-3.5" />} onClick={() => setBlockModal(true)}>
                Raise Block
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => setResetModal(true)}
            >
              Reset Demo
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Status</p>
            <Badge variant={meta.badge as Parameters<typeof Badge>[0]["variant"]}>{meta.label}</Badge>
          </div>
          {project.dueDate && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Due date</p>
              <p className="font-medium text-slate-900">{formatDate(project.dueDate)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Last updated</p>
            <p className="font-medium text-slate-900">{formatDateTime(project.updatedAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* Blocks */}
      {openBlocks.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          <h2 className="font-semibold text-slate-900 text-sm uppercase tracking-wide">Open Blocks</h2>
          {openBlocks.map((b, i) => (
            <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-700">{b.reason}</p>
                <p className="text-xs text-red-400 mt-0.5">Raised {formatDateTime(b.raisedAt)}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Module misalignment warnings */}
      {misalignments.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <h2 className="font-semibold text-slate-900">Module Alignment</h2>
          </div>
          <p className="text-xs text-slate-500">
            These modules are significantly ahead of their prerequisites. The client may be skipping foundational work.
          </p>
          <div className="space-y-2">
            {misalignments.map((w, i) => (
              <div
                key={i}
                className={`rounded-lg border px-4 py-3 flex items-start gap-3 ${
                  w.severity === "critical"
                    ? "bg-red-50 border-red-200"
                    : "bg-amber-50 border-amber-200"
                }`}
              >
                <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                  w.severity === "critical" ? "text-red-500" : "text-amber-500"
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${w.severity === "critical" ? "text-red-800" : "text-amber-800"}`}>
                    {w.moduleLabel} ({w.modulePercent}%) — {w.blockedByLabel} only {w.blockedByPercent}%
                  </p>
                  <p className={`text-xs mt-0.5 ${w.severity === "critical" ? "text-red-600" : "text-amber-600"}`}>
                    {w.moduleLabel} is {w.modulePercent - w.blockedByPercent} points ahead of its prerequisite. Consider pausing until {w.blockedByLabel} catches up.
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wide flex-shrink-0 px-1.5 py-0.5 rounded ${
                  w.severity === "critical"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}>
                  {w.severity}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Milestones */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Milestones</h2>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setMilestoneModal(true)}
          >
            Add
          </Button>
        </div>

        {!project.milestones || project.milestones.length === 0 ? (
          <p className="text-sm text-slate-400 py-4 text-center">No milestones yet.</p>
        ) : (
          <div className="space-y-2">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-slate-100">
                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${m.completedAt ? "bg-emerald-100" : "bg-gray-100"}`}>
                  {m.completedAt ? (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${m.completedAt ? "line-through text-slate-400" : "text-slate-900"}`}>
                    {m.title}
                  </p>
                  {m.dueDate && (
                    <p className="text-xs text-slate-400">Due {formatDate(m.dueDate)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Consultant Framework Sections */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card space-y-4">
        <h2 className="font-semibold text-slate-900">Consultant Framework</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href={`/admin/projects/${id}/revenue-execution`}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors group"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">Revenue Execution</p>
              <p className="text-xs text-slate-500">S2 — Methodology, CRM, Scorecard</p>
            </div>
          </Link>
          <Link
            href={`/admin/projects/${id}/execution-planning`}
            className="flex items-center gap-3 rounded-lg border border-slate-200 p-4 hover:border-slate-300 transition-colors group"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ClipboardCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 group-hover:text-brand-blue transition-colors">Execution Planning</p>
              <p className="text-xs text-slate-500">S3 — 90-Day Plans, Governance</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Block Modal */}
      <Modal
        isOpen={blockModal}
        onClose={() => setBlockModal(false)}
        title="Raise a Block"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setBlockModal(false)}>Cancel</Button>
            <Button variant="danger" isLoading={saving} onClick={handleRaiseBlock} disabled={!blockReason}>
              Raise Block
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="What is blocking this project?"
            value={blockReason}
            onChange={(e) => setBlockReason(e.target.value)}
            placeholder="Describe the block in detail..."
            rows={4}
          />
          <p className="text-xs text-slate-400">
            A notification email will be sent to the assigned team members.
          </p>
        </div>
      </Modal>

      {/* Resolve Block Confirm */}
      <ConfirmModal
        isOpen={resolveModal}
        onClose={() => setResolveModal(false)}
        onConfirm={handleResolveBlock}
        title="Resolve Block"
        message="Mark this block as resolved and set the project back to In Progress?"
        confirmLabel="Resolve Block"
        variant="primary"
      />

      {/* Reset Demo Confirm */}
      <ConfirmModal
        isOpen={resetModal}
        onClose={() => setResetModal(false)}
        onConfirm={handleReset}
        title="Reset All Responses"
        message="This will permanently clear all framework answers for this client. Use this for demo and testing only. This cannot be undone."
        confirmLabel="Reset Responses"
        variant="danger"
      />

      {/* Status Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => setStatusModal(false)}
        title="Update Status"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setStatusModal(false)}>Cancel</Button>
            <Button isLoading={saving} onClick={handleUpdateStatus}>Save</Button>
          </div>
        }
      >
        <Select
          label="Project status"
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as ProjectStatus)}
          options={[
            { value: "not_started", label: "Not started" },
            { value: "in_progress", label: "In progress" },
            { value: "blocked", label: "Blocked" },
            { value: "completed", label: "Completed" },
          ]}
        />
      </Modal>

      {/* Add Milestone Modal */}
      <Modal
        isOpen={milestoneModal}
        onClose={() => setMilestoneModal(false)}
        title="Add Milestone"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setMilestoneModal(false)}>Cancel</Button>
            <Button isLoading={saving} disabled={!newMilestone.title} onClick={async () => {
              setSaving(true);
              try {
                const res = await fetch(`/api/projects/${id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    addMilestone: { title: newMilestone.title, dueDate: newMilestone.dueDate || undefined },
                  }),
                });
                if (!res.ok) throw new Error((await res.json()).error);
                success("Milestone added");
                setMilestoneModal(false);
                setNewMilestone({ title: "", dueDate: "" });
                load();
              } catch (e) { toastError("Failed", (e as Error).message); }
              finally { setSaving(false); }
            }}>Add</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Milestone title"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone((m) => ({ ...m, title: e.target.value }))}
            placeholder="e.g. Strategy deck complete"
          />
          <Input
            label="Due date (optional)"
            type="date"
            value={newMilestone.dueDate}
            onChange={(e) => setNewMilestone((m) => ({ ...m, dueDate: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  );
}
