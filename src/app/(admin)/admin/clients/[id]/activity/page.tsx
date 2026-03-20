/**
 * Admin: Client Activity Feed — /admin/clients/[id]/activity
 * Timeline of events derived from projects and framework response timestamps.
 */
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  FolderKanban,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Activity,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";

/* ── types ──────────────────────────────────────────────────── */
type EventKind =
  | "client_created"
  | "project_created"
  | "project_blocked"
  | "project_completed"
  | "response_saved"
  | "onboarding_complete";

interface TimelineEvent {
  id: string;
  kind: EventKind;
  title: string;
  subtitle?: string;
  ts: Date;
}

/* ── event config ───────────────────────────────────────────── */
const EVENT_ICON: Record<EventKind, { icon: React.ReactNode; bg: string }> = {
  client_created:      { icon: <UserPlus className="w-3.5 h-3.5 text-white" />,       bg: "bg-[#141414]" },
  project_created:     { icon: <FolderKanban className="w-3.5 h-3.5 text-white" />,   bg: "bg-slate-700" },
  project_blocked:     { icon: <AlertTriangle className="w-3.5 h-3.5 text-white" />,  bg: "bg-red-500" },
  project_completed:   { icon: <CheckCircle2 className="w-3.5 h-3.5 text-white" />,   bg: "bg-emerald-500" },
  response_saved:      { icon: <FileText className="w-3.5 h-3.5 text-white" />,       bg: "bg-[rgb(108,194,255)] !text-[#141414]" },
  onboarding_complete: { icon: <Activity className="w-3.5 h-3.5 text-white" />,       bg: "bg-amber-400" },
};

/* ── skeleton ───────────────────────────────────────────────── */
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("bg-slate-200/60 rounded animate-pulse", className)} />;
}

/* ── page ───────────────────────────────────────────────────── */
export default function ClientActivityPage() {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/projects?clientId=${id}`).then((r) => r.json()),
      fetch(`/api/responses/${id}`).then((r) => r.json()),
    ])
      .then(([clientRes, projectsRes, responsesRes]) => {
        const client = clientRes.data;
        const projects: Array<{
          id: string;
          title: string;
          status: string;
          createdAt: string;
          updatedAt: string;
        }> = projectsRes.data ?? [];
        const subSectionProgress: Record<
          string,
          { answeredCount: number; lastSavedAt?: string }
        > = responsesRes.subSectionProgress ?? {};

        const evts: TimelineEvent[] = [];

        /* Client created */
        if (client?.createdAt) {
          evts.push({
            id: "client-created",
            kind: "client_created",
            title: "Client account created",
            subtitle: client.email ?? undefined,
            ts: new Date(client.createdAt),
          });
        }

        /* Onboarding complete */
        if (client?.onboardingCompletedAt) {
          evts.push({
            id: "onboarding-complete",
            kind: "onboarding_complete",
            title: "Onboarding completed",
            ts: new Date(client.onboardingCompletedAt),
          });
        }

        /* Projects */
        projects.forEach((p) => {
          evts.push({
            id: `proj-created-${p.id}`,
            kind: "project_created",
            title: `Project created: ${p.title}`,
            ts: new Date(p.createdAt),
          });
          if (p.status === "blocked") {
            evts.push({
              id: `proj-blocked-${p.id}`,
              kind: "project_blocked",
              title: `Project blocked: ${p.title}`,
              ts: new Date(p.updatedAt),
            });
          }
          if (p.status === "completed") {
            evts.push({
              id: `proj-completed-${p.id}`,
              kind: "project_completed",
              title: `Project completed: ${p.title}`,
              ts: new Date(p.updatedAt),
            });
          }
        });

        /* Response section saves */
        Object.entries(subSectionProgress).forEach(([subId, prog]) => {
          if (prog.lastSavedAt && prog.answeredCount > 0) {
            evts.push({
              id: `resp-${subId}`,
              kind: "response_saved",
              title: `Framework response saved`,
              subtitle: subId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
              ts: new Date(prog.lastSavedAt),
            });
          }
        });

        /* Sort descending */
        evts.sort((a, b) => b.ts.getTime() - a.ts.getTime());

        setEvents(evts);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-2 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-5 h-5 text-slate-400" />
        </div>
        <h3 className="text-sm font-medium text-slate-900 mb-1">No activity yet</h3>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          Activity will appear here as the client progresses through the framework.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg ring-1 ring-black/[0.06] p-6">
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[15px] top-8 bottom-0 w-px bg-slate-100" />

        <div className="space-y-6">
          {events.map((evt, i) => {
            const cfg = EVENT_ICON[evt.kind];
            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="flex gap-4 relative"
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10",
                    cfg.bg
                  )}
                >
                  {cfg.icon}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p className="text-sm font-medium text-slate-800 leading-snug">
                    {evt.title}
                  </p>
                  {evt.subtitle && (
                    <p className="text-xs text-slate-400 mt-0.5">{evt.subtitle}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400 tabular-nums">
                      {formatDistanceToNow(evt.ts, { addSuffix: true })}
                    </span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-300 tabular-nums">
                      {format(evt.ts, "d MMM yyyy, HH:mm")}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
