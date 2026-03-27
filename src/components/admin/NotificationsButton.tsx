/**
 * NotificationsButton — bell icon + slide-down panel showing
 * blocked projects and recent client activity.
 * Embedded in the admin TopBar.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, AlertTriangle, CheckCircle2, Users, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "blocked" | "client_added" | "completed" | "active";
  title: string;
  subtitle: string;
  href: string;
  ts: Date;
  read: boolean;
}

const TYPE_CONFIG = {
  blocked:      { icon: AlertTriangle,  bg: "bg-red-100",     icon_cls: "text-red-500" },
  client_added: { icon: Users,           bg: "bg-slate-100",   icon_cls: "text-slate-500" },
  completed:    { icon: CheckCircle2,    bg: "bg-emerald-100", icon_cls: "text-emerald-600" },
  active:       { icon: Bell,            bg: "bg-amber-100",   icon_cls: "text-amber-600" },
};

export function NotificationsButton({
  open,
  onToggle,
  onClose,
  role = "admin",
}: {
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  role?: "admin" | "consultant";
}) {
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [read, setRead] = useState<Set<string>>(new Set());
  const base = role === "consultant" ? "/consultant" : "/admin";

  useEffect(() => {
    /* Derive notifications from projects and clients */
    Promise.all([
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/clients").then((r) => r.json()),
    ])
      .then(([projectsRes, clientsRes]) => {
        const projects: Array<{
          id: string; title: string; status: string;
          clientId: string | { businessName?: string };
          createdAt: string; updatedAt: string;
        }> = projectsRes.data ?? [];

        const clients: Array<{
          id: string; businessName: string; status: string; createdAt: string;
        }> = clientsRes.data ?? [];

        const derived: Notification[] = [];

        projects.forEach((p) => {
          const clientName =
            typeof p.clientId === "object"
              ? (p.clientId.businessName ?? "Client")
              : "Client";

          if (p.status === "blocked") {
            derived.push({
              id: `blocked-${p.id}`,
              type: "blocked",
              title: `${p.title} is blocked`,
              subtitle: clientName,
              href: `${base}/projects/${p.id}`,
              ts: new Date(p.updatedAt),
              read: false,
            });
          }
        });

        /* Recent client adds (last 7 days) */
        const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
        clients.forEach((c) => {
          if (new Date(c.createdAt).getTime() > cutoff) {
            derived.push({
              id: `client-${c.id}`,
              type: "client_added",
              title: `New client: ${c.businessName}`,
              subtitle: c.status === "invited" ? "Invite sent" : c.status,
              href: `${base}/clients/${c.id}`,
              ts: new Date(c.createdAt),
              read: false,
            });
          }
        });

        derived.sort((a, b) => b.ts.getTime() - a.ts.getTime());
        setNotifs(derived.slice(0, 10));
      })
      .catch(() => {});
  }, []);

  const unread = notifs.filter((n) => !read.has(n.id)).length;

  const markAllRead = () => setRead(new Set(notifs.map((n) => n.id)));

  const handleClick = (n: Notification) => {
    setRead((prev) => new Set([...prev, n.id]));
    onClose();
    router.push(n.href);
  };

  return (
    <>
      {/* Bell button */}
      <button
        type="button"
        onClick={onToggle}
        className="relative p-2 mr-1 text-white rounded-lg hover:bg-white/10 transition-colors"
      >
        <span className="sr-only">View notifications</span>
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#141414]" />
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
            className="absolute right-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-black/[0.08] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unread > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {unread}
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Items */}
            <div className="max-h-72 overflow-y-auto py-1.5">
              {notifs.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">
                  No notifications
                </p>
              ) : (
                notifs.map((n) => {
                  const cfg = TYPE_CONFIG[n.type];
                  const Icon = cfg.icon;
                  const isRead = read.has(n.id);
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50",
                        !isRead && "bg-slate-50/60"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5", cfg.bg)}>
                        <Icon className={cn("w-4 h-4", cfg.icon_cls)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm leading-snug", isRead ? "text-slate-500 font-normal" : "text-slate-800 font-medium")}>
                          {n.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.subtitle}</p>
                        <p className="text-[10px] text-slate-300 mt-1 tabular-nums">
                          {formatDistanceToNow(n.ts, { addSuffix: true })}
                        </p>
                      </div>
                      {!isRead && (
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-100 px-4 py-2.5">
              <button
                onClick={() => { onClose(); router.push("/admin/projects"); }}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                View all projects
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
