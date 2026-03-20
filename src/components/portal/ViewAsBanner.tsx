/**
 * ViewAsBanner — renders a persistent top banner when view-as mode is active.
 * Fetches GET /api/me/client and checks isViewAs flag.
 * No-op when view-as is not active.
 */
"use client";

import { useEffect, useState, useCallback } from "react";
import { Eye, X, StickyNote } from "lucide-react";

interface ViewAsState {
  isViewAs: boolean;
  businessName: string;
  contactName?: string;
}

export function ViewAsBanner({
  onToggleNotes,
  notesOpen,
}: {
  onToggleNotes?: () => void;
  notesOpen?: boolean;
}) {
  const [state, setState] = useState<ViewAsState | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/client")
      .then((r) => r.json())
      .then((d) => {
        if (d.isViewAs) {
          setState({
            isViewAs: true,
            businessName: d.viewingAs?.businessName ?? d.businessName ?? "",
            contactName: d.viewingAs?.contactName,
          });
          setClientId(d.clientId);
        }
      })
      .catch(() => {});
  }, []);

  const handleExit = useCallback(async () => {
    try {
      await fetch("/api/admin/view-as", { method: "DELETE" });
      // Hard redirect back to admin — use clientId if we have it
      if (clientId) {
        window.location.href = `/admin/clients/${clientId}`;
      } else {
        window.location.href = "/admin/clients";
      }
    } catch {
      window.location.href = "/admin/clients";
    }
  }, [clientId]);

  if (!state?.isViewAs) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-4 px-4 py-2.5 text-sm text-white shadow-lg"
      style={{ background: "#0F1F3D" }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="w-4 h-4 flex-shrink-0 text-white/70" />
        <span className="font-medium truncate">
          Viewing portal as:{" "}
          <strong>{state.businessName}</strong>
          {state.contactName ? ` (${state.contactName})` : ""}
        </span>
        <span className="text-white/50 text-xs hidden sm:inline">
          — Your actions are not saved.
        </span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {onToggleNotes && (
          <button
            onClick={onToggleNotes}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors bg-white/10 hover:bg-white/20"
          >
            <StickyNote className="w-3.5 h-3.5" />
            {notesOpen ? "Close notes" : "Open notes"}
          </button>
        )}
        <button
          onClick={handleExit}
          className="flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors bg-white/10 hover:bg-white/20"
        >
          <X className="w-3.5 h-3.5" />
          Exit view-as
        </button>
      </div>
    </div>
  );
}
