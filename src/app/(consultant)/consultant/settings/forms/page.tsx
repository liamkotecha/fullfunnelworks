"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, ExternalLink, Copy, Check, GripVertical,
  ToggleLeft, ToggleRight, ChevronDown, ChevronUp, Loader2, Save,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import { cn } from "@/lib/utils";

type FieldType = "text" | "email" | "phone" | "textarea" | "select";

interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

interface LeadFormSummary {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  submissionCount: number;
  primaryColor: string;
  fields: FormField[];
  successMessage: string;
  redirectUrl?: string;
}

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };
const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "textarea", label: "Long text" },
  { value: "select", label: "Dropdown" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1.5 rounded hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-700"
      title="Copy"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-brand-green" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <GripVertical className="w-4 h-4 text-slate-300 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium text-slate-900 truncate">{field.label || "Untitled field"}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-medium">
          {FIELD_TYPES.find((t) => t.value === field.type)?.label ?? field.type}
        </span>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden border-t border-slate-100"
          >
            <div className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Label"
                  value={field.label}
                  onChange={(e) => onChange({ ...field, label: e.target.value })}
                  placeholder="Field label"
                />
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Type</label>
                  <select
                    value={field.type}
                    onChange={(e) => onChange({ ...field, type: e.target.value as FieldType })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {FIELD_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="Placeholder"
                value={field.placeholder}
                onChange={(e) => onChange({ ...field, placeholder: e.target.value })}
                placeholder="Helper text shown inside the field"
              />

              {field.type === "select" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Options <span className="text-slate-400">(one per line)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={field.options.join("\n")}
                    onChange={(e) => onChange({ ...field, options: e.target.value.split("\n") })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 resize-none"
                    placeholder={"Option 1\nOption 2\nOption 3"}
                  />
                </div>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onChange({ ...field, required: e.target.checked })}
                  className="rounded border-slate-300 text-slate-900 focus:ring-0"
                />
                <span className="text-sm text-slate-700">Required field</span>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FormEditor({
  form,
  onSaved,
  onDeleted,
}: {
  form: LeadFormSummary;
  onSaved: (updated: LeadFormSummary) => void;
  onDeleted: (id: string) => void;
}) {
  const { success, error: toastError } = useToast();
  const [draft, setDraft] = useState<LeadFormSummary>({ ...form, fields: form.fields.map((f) => ({ ...f, options: f.options ?? [] })) });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const formUrl = `${origin}/forms/${draft.id}`;
  const iframeSnippet = `<iframe src="${formUrl}" width="100%" height="600" frameborder="0" style="border:none;" title="${draft.name}"></iframe>`;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/consultant/forms/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          active: draft.active,
          primaryColor: draft.primaryColor,
          fields: draft.fields,
          successMessage: draft.successMessage,
          redirectUrl: draft.redirectUrl,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      const updated = await res.json() as LeadFormSummary;
      onSaved({ ...draft, ...updated, id: draft.id });
      success("Form saved", "Your changes have been published.");
    } catch (e) {
      toastError("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      const res = await fetch(`/api/consultant/forms/${draft.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      onDeleted(draft.id);
      success("Form deleted", "The form has been removed.");
    } catch (e) {
      toastError("Delete failed", (e as Error).message);
      setDeleting(false);
    }
  };

  const addField = () => {
    setDraft((d) => ({
      ...d,
      fields: [...d.fields, { id: uid(), type: "text", label: "", placeholder: "", required: false, options: [] }],
    }));
  };

  return (
    <div className="card space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            className="text-lg font-bold text-slate-900 border-0 border-b border-transparent hover:border-slate-200 focus:border-slate-400 focus:outline-none bg-transparent w-full pb-0.5 transition-colors"
            placeholder="Form name"
          />
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            <span className="truncate">{formUrl}</span>
            <CopyButton text={formUrl} />
            <a href={formUrl} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setDraft((d) => ({ ...d, active: !d.active }))}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            {draft.active
              ? <ToggleRight className="w-5 h-5 text-brand-green" />
              : <ToggleLeft className="w-5 h-5 text-slate-300" />}
            {draft.active ? "Active" : "Inactive"}
          </button>
        </div>
      </div>

      {/* Submissions badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">{draft.submissionCount} submission{draft.submissionCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Fields */}
      <div>
        <p className="text-sm font-semibold text-slate-700 mb-2">Fields</p>
        <div className="space-y-2">
          {draft.fields.map((field, idx) => (
            <FieldEditor
              key={field.id}
              field={field}
              onChange={(updated) =>
                setDraft((d) => ({ ...d, fields: d.fields.map((f, i) => (i === idx ? updated : f)) }))
              }
              onDelete={() =>
                setDraft((d) => ({ ...d, fields: d.fields.filter((_, i) => i !== idx) }))
              }
            />
          ))}
          <button
            type="button"
            onClick={addField}
            className="w-full py-2 rounded-lg border-2 border-dashed border-slate-200 text-sm text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add field
          </button>
        </div>
      </div>

      {/* After submit */}
      <div className="space-y-3 pt-1 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-700">After submission</p>
        <Input
          label="Success message"
          value={draft.successMessage}
          onChange={(e) => setDraft((d) => ({ ...d, successMessage: e.target.value }))}
          placeholder="Thanks! We'll be in touch soon."
        />
        <Input
          label="Redirect URL (optional — overrides success message)"
          value={draft.redirectUrl ?? ""}
          onChange={(e) => setDraft((d) => ({ ...d, redirectUrl: e.target.value }))}
          placeholder="https://yoursite.com/thank-you"
        />
      </div>

      {/* Embed snippet */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <p className="text-sm font-semibold text-slate-700">Embed on your website</p>
        <div className="relative">
          <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-500 overflow-x-auto whitespace-pre-wrap break-all">
            {iframeSnippet}
          </pre>
          <div className="absolute top-2 right-2">
            <CopyButton text={iframeSnippet} />
          </div>
        </div>
        <p className="text-xs text-slate-400">
          Paste this snippet anywhere on your website. The form will render inline and submit directly into your pipeline.
        </p>
      </div>

      {/* Colour */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <p className="text-sm font-medium text-slate-700">Brand colour</p>
        <input
          type="color"
          value={draft.primaryColor}
          onChange={(e) => setDraft((d) => ({ ...d, primaryColor: e.target.value }))}
          className="w-8 h-8 rounded cursor-pointer border border-slate-200"
          title="Pick brand colour"
        />
        <span className="text-xs text-slate-400">{draft.primaryColor}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className={cn(
            "text-xs flex items-center gap-1.5 transition-colors",
            confirmDelete ? "text-red-600 font-semibold" : "text-slate-400 hover:text-red-400"
          )}
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          {confirmDelete ? "Click again to confirm delete" : "Delete form"}
        </button>
        {confirmDelete && !deleting && (
          <button type="button" onClick={() => setConfirmDelete(false)} className="text-xs text-slate-400 hover:text-slate-600">
            Cancel
          </button>
        )}
        <Button onClick={handleSave} isLoading={saving} leftIcon={saving ? undefined : <Save className="w-3.5 h-3.5" />}>
          Save form
        </Button>
      </div>
    </div>
  );
}

export default function FormsPage() {
  const { success, error: toastError } = useToast();
  const [forms, setForms] = useState<LeadFormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetch("/api/consultant/forms")
      .then((r) => r.json())
      .then((d) => { setForms(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/consultant/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      const { id, slug } = await res.json() as { id: string; slug: string };
      // Fetch the full form
      const full = await fetch(`/api/consultant/forms/${id}`).then((r) => r.json()) as LeadFormSummary;
      setForms((prev) => [{ ...full, id, slug }, ...prev]);
      setNewName("");
      setShowCreate(false);
      success("Form created", "Start customising your fields below.");
    } catch (e) {
      toastError("Create failed", (e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6">
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Lead Forms</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Embed forms on your website — submissions go straight into your pipeline
          </p>
        </div>
        <Button
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setShowCreate((v) => !v)}
        >
          New form
        </Button>
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card overflow-hidden"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Input
                  label="Form name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Website contact form"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); }}
                  autoFocus
                />
              </div>
              <Button onClick={handleCreate} isLoading={creating}>Create</Button>
              <Button variant="ghost" onClick={() => { setShowCreate(false); setNewName(""); }}>Cancel</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="card h-40 animate-pulse bg-slate-50" />)}
        </div>
      ) : forms.length === 0 ? (
        <motion.div variants={fadeUp} className="card text-center py-12">
          <p className="text-slate-400 text-sm mb-4">No forms yet. Create one to get started.</p>
          <Button leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowCreate(true)}>
            Create your first form
          </Button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {forms.map((form) => (
            <motion.div key={form.id} variants={fadeUp}>
              <FormEditor
                form={form}
                onSaved={(updated) => setForms((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))}
                onDeleted={(id) => setForms((prev) => prev.filter((f) => f.id !== id))}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
