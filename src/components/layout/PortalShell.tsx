"use client";

import { useState, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { FrameworkSidebar } from "@/components/layout/FrameworkSidebar";
import { ProgressProvider } from "@/context/ProgressContext";
import { ProjectProvider, useProjectContext } from "@/context/ProjectContext";
import { ActivityPing } from "@/components/portal/ActivityPing";
import { ViewAsBanner } from "@/components/portal/ViewAsBanner";
import { NotesPanel } from "@/components/portal/NotesPanel";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { usePortalClient } from "@/hooks/usePortalClient";

interface PortalShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

/* ── Stale banners ─────────────────────────────────────────── */

function StaleBanner() {
  const { staleness, project } = useProjectContext();

  if (staleness === "stalled") {
    return (
      <div className="bg-amber-500/10 border-b-2 border-amber-500/30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5">⏸</span>
          <div>
            <p className="font-semibold text-amber-800 text-sm">
              This project is currently on hold
            </p>
            <p className="text-amber-700 text-sm mt-0.5">
              Your consultant has been notified and will be in touch soon. Your progress is safe — pick up where you left off any time.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (staleness === "at_risk") {
    const consultantEmail =
      (project?.assignedTo as unknown as { email?: string })?.email ?? "";
    return (
      <div className="bg-red-500/10 border-b-2 border-red-500/30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">
              Your engagement needs attention
            </p>
            <p className="text-red-700 text-sm mt-0.5">
              Your consultant has been notified. Please get in touch to discuss next steps.
            </p>
          </div>
          {consultantEmail && (
            <a
              href={`mailto:${consultantEmail}`}
              className="flex-shrink-0 text-sm font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
            >
              Contact us →
            </a>
          )}
        </div>
      </div>
    );
  }

  return null;
}

/* ── Terminated full-page end state ────────────────────────── */

function TerminatedEndState({ project, clientId }: { project: { assignedTo?: unknown } | null; clientId: string | null }) {
  const consultantEmail =
    (project?.assignedTo as unknown as { email?: string })?.email ?? "";

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "#F9FAFB" }}>
      <div className="text-center max-w-md">
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#C9A84C", fontFamily: "Georgia, serif", letterSpacing: "2px" }}
        >
          FULL FUNNEL
        </h1>
        <p className="text-xs text-slate-400 mb-10">Growth Strategy Framework</p>

        <h2 className="text-xl font-semibold text-slate-900 mb-3">
          This engagement has concluded
        </h2>
        <p className="text-sm text-slate-500 leading-relaxed mb-6">
          Thank you for working with Full Funnel Works. Your completed work and all your responses are preserved below and available to download.
        </p>
        {consultantEmail && (
          <p className="text-sm text-slate-500 mb-8">
            If you have any questions, reach out:{" "}
            <a href={`mailto:${consultantEmail}`} className="text-brand-blue underline">
              {consultantEmail}
            </a>
          </p>
        )}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/portal/overview"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-white"
            style={{ background: "#0F1F3D" }}
          >
            View completed work →
          </a>
          {clientId && (
            <a
              href={`/api/reports/${clientId}?includeNotes=false`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium text-slate-700 bg-white ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
              download
            >
              ⬇ Download your report
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Inner shell that can consume ProjectContext ───────────── */

function PortalShellInner({
  children,
  userName,
  userEmail,
}: PortalShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const toggleNotes = useCallback(() => setNotesOpen((v) => !v), []);
  const closeNotes = useCallback(() => setNotesOpen(false), []);
  const { staleness, project, readOnly } = useProjectContext();
  const { clientId, isViewAs } = usePortalClient();

  // Terminated — full-page end state, no sidebar
  if (staleness === "terminated") {
    return <TerminatedEndState project={project} clientId={clientId} />;
  }

  return (
    <div className="antialiased" style={{ backgroundColor: "#F9FAFB" }}>
      <ViewAsBanner onToggleNotes={toggleNotes} notesOpen={notesOpen} />
      <TopBar
        userName={userName}
        userEmail={userEmail}
        role="portal"
        onMenuToggle={toggleSidebar}
        menuOpen={sidebarOpen}
      />
      <FrameworkSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
        isViewAs={isViewAs}
      />
      <StaleBanner />
      <SessionExpiryWarning />
      {clientId && (
        <NotesPanel open={notesOpen} onClose={closeNotes} clientId={clientId} />
      )}
      <main
        className="pt-20 md:ml-64 min-h-screen px-4 pb-4 md:px-6 md:pb-6"
        style={
          staleness === "stalled"
            ? { opacity: 0.75, filter: "saturate(0.7)" }
            : undefined
        }
      >
        {readOnly && (
          <div className="fixed top-16 right-0 z-50 bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-bl-lg shadow">
            This engagement is concluded — read only
          </div>
        )}
        {children}
      </main>
    </div>
  );
}

export function PortalShell({ children, userName, userEmail }: PortalShellProps) {
  return (
    <ProjectProvider>
      <ProgressProvider>
        <ActivityPing />
        <PortalShellInner userName={userName} userEmail={userEmail}>
          {children}
        </PortalShellInner>
      </ProgressProvider>
    </ProjectProvider>
  );
}
