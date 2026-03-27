/**
 * /admin/questions — Framework Question Editor
 * View, edit, reorder, add, and deactivate questions across all framework sections.
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Loader2,
  RotateCcw,
  FileQuestion,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications/ToastContext";
import { ConfirmModal } from "@/components/ui/Modal";

// ── Types ────────────────────────────────────────────────────

interface Question {
  _id: string;
  fieldId: string;
  section: string;
  subSection: string;
  group?: string;
  question: string;
  subPrompt?: string;
  label?: string;
  type: string;
  placeholder?: string;
  weightFieldId?: string;
  order: number;
  active: boolean;
  metadata?: Record<string, unknown>;
  updatedAt?: string;
}

interface Stats {
  total: number;
  active: number;
  sections: string[];
}

// ── Section / subSection labels for filter pills ─────────────

const SECTION_LABELS: Record<string, string> = {
  assessment: "Assessment",
  people: "People",
  product: "Product",
  process: "Process",
  roadmap: "Roadmap",
  kpis: "KPIs",
  gtm: "GTM Playbook",
};

const SUBSECTION_LABELS: Record<string, string> = {
  checklist: "Checklist",
  swot: "SWOT Analysis",
  most: "MOST Analysis",
  gap: "Gap Analysis",
  leadership: "Leadership",
  challenges: "Challenges",
  methodology: "Methodology",
  outcomes: "Outcomes",
  builder: "Process Builder",
  roadmap: "Roadmap",
  kpis: "KPIs",
  market: "Market Intelligence",
  competition: "Competition",
};

// ── Main Page ────────────────────────────────────────────────

export default function AdminQuestionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as { role?: string })?.role !== "admin") router.replace("/admin/dashboard");
  }, [session, status, router]);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Filters
  const [sectionFilter, setSectionFilter] = useState("all");
  const [subSectionFilter, setSubSectionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editSubPrompt, setEditSubPrompt] = useState("");

  // Add new question
  const [showAdd, setShowAdd] = useState(false);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { error: toastError, success: toastSuccess } = useToast();

  // ── Fetch ────────────────────────────────────────────────

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sectionFilter !== "all") params.set("section", sectionFilter);
      if (subSectionFilter !== "all") params.set("subSection", subSectionFilter);
      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions ?? []);
      setStats(data.stats ?? null);
    } catch (e) {
      toastError("Couldn't load questions", (e as Error).message ?? "Please refresh the page");
    } finally {
      setLoading(false);
    }
  }, [sectionFilter, subSectionFilter, toastError]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Derived ──────────────────────────────────────────────

  const subSections = Array.from(new Set(questions.map((q) => q.subSection)));

  const filtered = questions.filter((q) => {
    if (!showInactive && !q.active) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        q.question.toLowerCase().includes(s) ||
        q.fieldId.toLowerCase().includes(s) ||
        (q.subPrompt?.toLowerCase().includes(s) ?? false)
      );
    }
    return true;
  });

  // Group filtered questions by section → subSection → group
  const grouped: Record<string, Question[]> = {};
  for (const q of filtered) {
    const key = `${q.section}/${q.subSection}${q.group ? `/${q.group}` : ""}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(q);
  }
  // Sort each group by order
  for (const key of Object.keys(grouped)) {
    grouped[key].sort((a, b) => a.order - b.order);
  }

  // ── Actions ──────────────────────────────────────────────

  const startEdit = (q: Question) => {
    setEditingId(q._id);
    setEditText(q.question);
    setEditSubPrompt(q.subPrompt ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
    setEditSubPrompt("");
  };

  const saveEdit = async (id: string) => {
    setSaving(id);
    try {
      const body: Record<string, unknown> = { question: editText };
      if (editSubPrompt) body.subPrompt = editSubPrompt;
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setQuestions((prev) =>
          prev.map((q) => (q._id === id ? { ...q, ...data.question } : q))
        );
        cancelEdit();
        toastSuccess("Question saved");
      } else {
        toastError("Save failed", "The question couldn't be updated");
      }
    } catch (e) {
      toastError("Save failed", (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const toggleActive = async (q: Question) => {
    setSaving(q._id);
    try {
      const res = await fetch(`/api/admin/questions/${q._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !q.active }),
      });
      if (res.ok) {
        setQuestions((prev) =>
          prev.map((item) =>
            item._id === q._id ? { ...item, active: !item.active } : item
          )
        );
        toastSuccess(q.active ? "Question deactivated" : "Question activated");
      } else {
        toastError("Update failed", "Couldn't change question visibility");
      }
    } catch (e) {
      toastError("Update failed", (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const moveQuestion = async (q: Question, direction: "up" | "down") => {
    const groupKey = `${q.section}/${q.subSection}${q.group ? `/${q.group}` : ""}`;
    const group = grouped[groupKey];
    if (!group) return;

    const idx = group.findIndex((item) => item._id === q._id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= group.length) return;

    const other = group[swapIdx];
    const newOrder = other.order;
    const otherNewOrder = q.order;

    setSaving(q._id);
    try {
      await fetch("/api/admin/questions/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: q._id, order: newOrder },
            { id: other._id, order: otherNewOrder },
          ],
        }),
      });
      setQuestions((prev) =>
        prev.map((item) => {
          if (item._id === q._id) return { ...item, order: newOrder };
          if (item._id === other._id) return { ...item, order: otherNewOrder };
          return item;
        })
      );
    } catch (e) {
      toastError("Reorder failed", (e as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeleteId(null);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
        toastSuccess("Question deleted");
      } else {
        toastError("Delete failed", "The question couldn't be deleted");
      }
    } catch (e) {
      toastError("Delete failed", (e as Error).message);
    }
  };

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Framework Questions</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Edit question text, reorder, or add new questions. Changes appear in the client portal immediately.
          </p>
        </div>
        {stats && (
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 tabular-nums">
              {stats.active} active / {stats.total} total
            </span>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Question
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Section filter */}
        <select
          value={sectionFilter}
          onChange={(e) => {
            setSectionFilter(e.target.value);
            setSubSectionFilter("all");
          }}
          className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
        >
          <option value="all">All Sections</option>
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        {/* Sub-section filter */}
        {sectionFilter !== "all" && (
          <select
            value={subSectionFilter}
            onChange={(e) => setSubSectionFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
          >
            <option value="all">All Sub-sections</option>
            {subSections.map((key) => (
              <option key={key} value={key}>
                {SUBSECTION_LABELS[key] ?? key}
              </option>
            ))}
          </select>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
          />
        </div>

        {/* Show inactive toggle */}
        <button
          onClick={() => setShowInactive(!showInactive)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors border",
            showInactive
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
          )}
        >
          {showInactive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {showInactive ? "Showing inactive" : "Show inactive"}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20">
          <FileQuestion className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No questions found</p>
          <p className="text-sm text-slate-400 mt-1">
            {questions.length === 0
              ? "Run the seed script to populate questions from the framework."
              : "Try adjusting your filters."}
          </p>
          {questions.length === 0 && (
            <code className="block mt-3 text-xs bg-slate-50 text-slate-600 px-3 py-2 rounded-lg max-w-xs mx-auto">
              npx tsx scripts/seed-questions.ts
            </code>
          )}
          {questions.length > 0 && (
            <button
              onClick={() => { setSectionFilter("all"); setSubSectionFilter("all"); setSearch(""); setShowInactive(false); }}
              className="mt-4 text-sm font-medium text-slate-500 underline underline-offset-2 hover:text-slate-800 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Questions by group */}
      {!loading && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([groupKey, groupQuestions]) => {
            const [section, subSection, group] = groupKey.split("/");
            return (
              <div key={groupKey}>
                {/* Group header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    {SECTION_LABELS[section] ?? section}
                  </span>
                  <span className="text-xs text-slate-300">›</span>
                  <span className="text-xs font-semibold text-slate-500">
                    {SUBSECTION_LABELS[subSection] ?? subSection}
                  </span>
                  {group && (
                    <>
                      <span className="text-xs text-slate-300">›</span>
                      <span className="text-xs text-slate-500 capitalize">{group}</span>
                    </>
                  )}
                  <span className="text-xs text-slate-300 ml-auto tabular-nums">
                    {groupQuestions.length} question{groupQuestions.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Question rows */}
                <div className="rounded-lg ring-1 ring-slate-200 bg-white shadow-sm overflow-hidden divide-y divide-slate-100">
                  {groupQuestions.map((q, idx) => (
                    <QuestionRow
                      key={q._id}
                      q={q}
                      isEditing={editingId === q._id}
                      isSaving={saving === q._id}
                      editText={editText}
                      editSubPrompt={editSubPrompt}
                      setEditText={setEditText}
                      setEditSubPrompt={setEditSubPrompt}
                      onStartEdit={() => startEdit(q)}
                      onCancelEdit={cancelEdit}
                      onSaveEdit={() => saveEdit(q._id)}
                      onToggleActive={() => toggleActive(q)}
                      onMoveUp={idx > 0 ? () => moveQuestion(q, "up") : undefined}
                      onMoveDown={idx < groupQuestions.length - 1 ? () => moveQuestion(q, "down") : undefined}
                      onDelete={() => setDeleteId(q._id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAdd && (
          <AddQuestionModal
            onClose={() => setShowAdd(false)}
            onCreated={(q) => {
              setQuestions((prev) => [...prev, q]);
              setShowAdd(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) handleDelete(deleteId); }}
        title="Delete question?"
        message="This question will be permanently removed from the framework. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

// ── Question Row ─────────────────────────────────────────────

function QuestionRow({
  q,
  isEditing,
  isSaving,
  editText,
  editSubPrompt,
  setEditText,
  setEditSubPrompt,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleActive,
  onMoveUp,
  onMoveDown,
  onDelete,
}: {
  q: Question;
  isEditing: boolean;
  isSaving: boolean;
  editText: string;
  editSubPrompt: string;
  setEditText: (v: string) => void;
  setEditSubPrompt: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onToggleActive: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [isEditing]);

  return (
    <div
      className={cn(
        "px-4 py-3 transition-colors",
        !q.active && "opacity-50 bg-slate-50",
        isEditing && "bg-slate-50"
      )}
    >
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            ref={textareaRef}
            value={editText}
            onChange={(e) => {
              setEditText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = e.target.scrollHeight + "px";
            }}
            className="w-full text-sm text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
            rows={2}
          />
          {(q.subPrompt || editSubPrompt) && (
            <textarea
              value={editSubPrompt}
              onChange={(e) => setEditSubPrompt(e.target.value)}
              placeholder="Sub-prompt (optional)"
              className="w-full text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400 outline-none"
              rows={2}
            />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onSaveEdit}
              disabled={isSaving || !editText.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand-green text-white text-xs font-semibold hover:bg-brand-green/90 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button
              onClick={onCancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
            >
              <X className="w-3 h-3" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          {/* Order + type badge */}
          <div className="flex flex-col items-center gap-0.5 flex-shrink-0 pt-0.5">
            {onMoveUp && (
              <button onClick={onMoveUp} disabled={isSaving} className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
                <ArrowUp className="w-3 h-3" />
              </button>
            )}
            <span className="text-xs text-slate-300 tabular-nums font-mono">{q.order}</span>
            {onMoveDown && (
              <button onClick={onMoveDown} disabled={isSaving} className="p-0.5 text-slate-300 hover:text-slate-500 transition-colors">
                <ArrowDown className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-900 leading-relaxed">{q.question}</p>
            {q.subPrompt && (
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{q.subPrompt}</p>
            )}
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
                <Hash className="w-3 h-3" />
                {q.fieldId}
              </span>
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                q.type === "textarea" && "bg-blue-50 text-blue-600",
                q.type === "text" && "bg-emerald-50 text-emerald-600",
                q.type === "checkbox" && "bg-amber-50 text-amber-600",
                q.type === "slider" && "bg-purple-50 text-purple-600",
                q.type === "select" && "bg-indigo-50 text-indigo-600"
              )}>
                {q.type}
              </span>
              {q.weightFieldId && (
                <span className="text-xs text-slate-300">weighted</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={onStartEdit}
              className="p-1.5 rounded-md text-slate-400 hover:text-brand-blue hover:bg-brand-blue/10 transition-colors"
              title="Edit question"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onToggleActive}
              disabled={isSaving}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                q.active
                  ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
                  : "text-slate-400 hover:text-brand-green hover:bg-brand-green/10"
              )}
              title={q.active ? "Deactivate" : "Reactivate"}
            >
              {q.active ? <EyeOff className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="Delete question"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Add Question Modal ───────────────────────────────────────

function AddQuestionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (q: Question) => void;
}) {
  const [fieldId, setFieldId] = useState("");
  const [section, setSection] = useState("assessment");
  const [subSection, setSubSection] = useState("swot");
  const [group, setGroup] = useState("");
  const [question, setQuestion] = useState("");
  const [type, setType] = useState<string>("textarea");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!fieldId.trim() || !question.trim()) {
      setError("Field ID and question text are required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldId: fieldId.trim(),
          section,
          subSection,
          group: group.trim() || undefined,
          question: question.trim(),
          type,
          order: 999, // Will be at the end
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create");
        return;
      }
      const data = await res.json();
      onCreated(data.question);
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg shadow-xl ring-1 ring-slate-200 w-full max-w-lg p-6"
      >
        <h2 className="text-lg font-bold text-slate-900 mb-4">Add New Question</h2>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                {Object.entries(SECTION_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Sub-section</label>
              <input
                value={subSection}
                onChange={(e) => setSubSection(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
                placeholder="e.g. swot, checklist"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Field ID</label>
              <input
                value={fieldId}
                onChange={(e) => setFieldId(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono"
                placeholder="e.g. swot-s6"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                <option value="textarea">Textarea</option>
                <option value="text">Text</option>
                <option value="checkbox">Checkbox</option>
                <option value="slider">Slider</option>
                <option value="select">Select</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Group (optional)</label>
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2"
              placeholder="e.g. strengths, phase-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 mb-1 block">Question Text</label>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-y"
              rows={3}
              placeholder="Enter the question or label text"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-[#1a1a1a] disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Question
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
