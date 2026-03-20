/**
 * NotesPanel — slide-in panel from the right showing consultant notes.
 * Only visible in view-as mode when opened.
 * Reads current pathname to determine which section/sub is active.
 * Fetches GET /api/notes/[clientId] on open.
 * Renders notes for all fields, allows inline editing.
 */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Pencil, Trash2, Plus, Loader2, StickyNote } from "lucide-react";
import type { ConsultantNoteDTO } from "@/types";

interface NotesPanelProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

function NoteItem({
  note,
  clientId,
  onUpdate,
  onDelete,
}: {
  note: ConsultantNoteDTO;
  clientId: string;
  onUpdate: (fieldId: string, text: string) => void;
  onDelete: (fieldId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.note);
  const [saving, setSaving] = useState(false);

  const save = useCallback(async () => {
    if (!draft.trim() || draft.trim() === note.note) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/notes/${clientId}/${note.fieldId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: draft.trim() }),
      });
      onUpdate(note.fieldId, draft.trim());
      setEditing(false);
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, [clientId, note.fieldId, note.note, draft, onUpdate]);

  const handleDelete = useCallback(async () => {
    setSaving(true);
    try {
      await fetch(`/api/notes/${clientId}/${note.fieldId}`, { method: "DELETE" });
      onDelete(note.fieldId);
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, [clientId, note.fieldId, onDelete]);

  return (
    <div className="border-b border-white/10 pb-3 mb-3 last:border-0">
      <p className="text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1">
        {note.fieldId}
      </p>
      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="w-full text-xs text-white bg-white/5 border border-white/10 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 resize-none"
            autoFocus
          />
          <div className="flex gap-2 mt-1 items-center">
            <button
              onClick={save}
              disabled={saving || !draft.trim()}
              className="text-[10px] text-amber-400 hover:text-amber-300 font-semibold disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => {
                setDraft(note.note);
                setEditing(false);
              }}
              className="text-[10px] text-white/50 hover:text-white/70 font-medium"
            >
              Cancel
            </button>
            {saving && <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />}
          </div>
        </>
      ) : (
        <>
          <p className="text-xs text-white/80 leading-relaxed whitespace-pre-wrap">{note.note}</p>
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => setEditing(true)}
              className="text-[10px] text-white/40 hover:text-amber-400 font-medium flex items-center gap-0.5"
            >
              <Pencil className="w-2.5 h-2.5" /> Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="text-[10px] text-white/40 hover:text-red-400 font-medium flex items-center gap-0.5"
            >
              <Trash2 className="w-2.5 h-2.5" /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export function NotesPanel({ open, onClose, clientId }: NotesPanelProps) {
  const [notes, setNotes] = useState<ConsultantNoteDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    fetch(`/api/notes/${clientId}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [open, clientId]);

  const handleUpdate = useCallback((fieldId: string, text: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.fieldId === fieldId ? { ...n, note: text } : n))
    );
  }, []);

  const handleDelete = useCallback((fieldId: string) => {
    setNotes((prev) => prev.filter((n) => n.fieldId !== fieldId));
  }, []);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: 320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-0 right-0 bottom-0 z-[55] w-80 overflow-y-auto shadow-2xl"
          style={{ background: "#141414" }}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-white/10" style={{ background: "#141414" }}>
            <div className="flex items-center gap-2">
              <StickyNote className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-semibold text-white">Consultant Notes</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-white/30" />
              </div>
            ) : notes.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-8">
                No notes yet for this client.
              </p>
            ) : (
              notes.map((note) => (
                <NoteItem
                  key={note.fieldId}
                  note={note}
                  clientId={clientId}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
