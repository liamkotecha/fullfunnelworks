/**
 * ConsultantShell — page shell for /consultant routes.
 * Handles view-as-consultant impersonation banner inline so it can
 * properly shift the fixed TopBar and sidebar down.
 */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ConsultantSidebar } from "@/components/layout/ConsultantSidebar";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { Eye, X, StickyNote, Loader2, Check } from "lucide-react";
import { useToast } from "@/components/notifications/ToastContext";

const BANNER_H = 40; // px — height of the impersonation banner

interface ConsultantShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function ConsultantShell({ children, userName, userEmail }: ConsultantShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewAs, setViewAs] = useState<{ name: string; id: string } | null>(null);
  const [exiting, setExiting] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const router = useRouter();
  const { error: toastError, success } = useToast();

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Detect view-as mode from cookies (name is non-httpOnly, ID via status endpoint)
  useEffect(() => {
    const cookies = Object.fromEntries(
      document.cookie.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    const name = cookies["view-as-consultant-name"];
    if (!name) return;
    fetch("/api/admin/view-as-consultant/status")
      .then((r) => r.json())
      .then((d) => { if (d.consultantId) setViewAs({ name, id: d.consultantId }); })
      .catch(() => {});
  }, []);

  const handleExit = useCallback(async () => {
    setExiting(true);
    await fetch("/api/admin/view-as-consultant", { method: "DELETE" });
    // Hard navigation required — crossing (consultant) → (admin) layout boundary
    window.location.href = viewAs?.id ? `/admin/consultants/${viewAs.id}` : "/admin/consultants";
  }, [viewAs]);

  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim() || !viewAs) return;
    setSavingNote(true);
    try {
      const res = await fetch(`/api/admin/consultants/${viewAs.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: noteText.trim() }),
      });
      if (!res.ok) throw new Error();
      setNoteText("");
      setNoteOpen(false);
      success("Note saved", "Admin note added to consultant profile");
    } catch {
      toastError("Failed to save note", "Please try again");
    } finally {
      setSavingNote(false);
    }
  }, [noteText, viewAs, success, toastError]);

  const topOffset = viewAs ? BANNER_H : 0;
  const displayName = viewAs?.name ?? userName;

  return (
    <div className="antialiased" style={{ backgroundColor: "#F9FAFB" }}>
      {/* ── Impersonation banner ── fixed at very top, above TopBar */}
      {viewAs && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-indigo-600 text-white flex items-center gap-3 px-4"
          style={{ height: BANNER_H }}
        >
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-xs">
            Viewing workspace as <strong>{viewAs.name}</strong>
            <span className="text-indigo-300"> — changes you make are real</span>
          </span>

          {/* Quick note */}
          <button
            onClick={() => setNoteOpen((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-indigo-500 hover:bg-indigo-400 transition-colors"
          >
            <StickyNote className="w-3 h-3" />
            Note
          </button>

          {/* Exit */}
          <button
            onClick={handleExit}
            disabled={exiting}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            {exiting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Exit
          </button>
        </div>
      )}

      {/* Quick note popover */}
      {viewAs && noteOpen && (
        <div
          className="fixed z-[61] bg-white border border-slate-200 rounded-xl shadow-xl p-4 w-80"
          style={{ top: BANNER_H + 8, right: 16 }}
        >
          <p className="text-xs font-semibold text-slate-700 mb-2">
            Add admin note for {viewAs.name}
          </p>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="What did you observe or discuss?"
            rows={3}
            autoFocus
            className="w-full text-sm px-3 py-2 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400"
          />
          <div className="flex gap-2 mt-2">
            <button
              disabled={savingNote || !noteText.trim()}
              onClick={handleSaveNote}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors"
            >
              {savingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save note
            </button>
            <button
              onClick={() => { setNoteOpen(false); setNoteText(""); }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <TopBar
        userName={displayName}
        userEmail={userEmail}
        onMenuToggle={toggleSidebar}
        menuOpen={sidebarOpen}
        role="consultant"
        topOffset={topOffset}
      />
      <ConsultantSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        userName={displayName}
        topOffset={topOffset}
      />
      <SessionExpiryWarning />
      <main
        className="md:ml-64 min-h-screen px-4 pb-4 md:px-6 md:pb-6"
        style={{ paddingTop: 64 + topOffset }}
      >
        {children}
      </main>
    </div>
  );
}
