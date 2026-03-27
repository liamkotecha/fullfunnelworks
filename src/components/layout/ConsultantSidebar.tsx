/**
 * ConsultantSidebar — navigation for the /consultant workspace.
 * Consultants see their own clients, projects, invoices, pipeline, and settings.
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Settings,
  KanbanSquare,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Counts {
  clients: number;
  blockedProjects: number;
  activeProspects: number;
}

interface ConsultantSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

export function ConsultantSidebar({ open = true, onClose }: ConsultantSidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({ clients: 0, blockedProjects: 0, activeProspects: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/projects").then((r) => r.json()),
      fetch("/api/prospects?stage=mql,sql,discovery,proposal,negotiating").then((r) => r.json()),
    ])
      .then(([c, p, pr]) => {
        const allClients: { status: string }[] = (c as { data?: { status: string }[] }).data ?? [];
        const allProjects: { status: string }[] = (p as { data?: { status: string }[] }).data ?? [];
        setCounts({
          clients: allClients.length,
          blockedProjects: allProjects.filter((x) => x.status === "blocked").length,
          activeProspects: (pr as { total?: number } | undefined)?.total ?? 0,
        });
      })
      .catch(() => {});
  }, []);

  type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge: { label: string; className: string } | null;
  };

  const NAV_MAIN: NavItem[] = [
    { href: "/consultant/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    {
      href: "/consultant/clients",
      label: "My Clients",
      icon: Users,
      badge: counts.clients > 0 ? { label: String(counts.clients), className: "bg-white/20 text-white/80" } : null,
    },
    {
      href: "/consultant/projects",
      label: "Projects",
      icon: FolderKanban,
      badge:
        counts.blockedProjects > 0
          ? { label: String(counts.blockedProjects), className: "bg-red-500/80 text-white" }
          : null,
    },
    {
      href: "/consultant/invoices",
      label: "Invoices",
      icon: Receipt,
      badge: null,
    },
    {
      href: "/consultant/crm/pipeline",
      label: "Pipeline",
      icon: KanbanSquare,
      badge:
        counts.activeProspects > 0
          ? { label: String(counts.activeProspects), className: "bg-white/20 text-white/80" }
          : null,
    },
  ];

  const NAV_BOTTOM: NavItem[] = [
    { href: "/consultant/settings", label: "Settings", icon: Settings, badge: null },
  ];

  const renderItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative",
            isActive
              ? "bg-white/15 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          )}
        >
          <item.icon
            className={cn(
              "w-[1.1rem] h-[1.1rem] flex-shrink-0 transition-colors",
              isActive ? "text-white" : "text-white/60 group-hover:text-white"
            )}
          />
          <span className="flex-1">{item.label}</span>
          {item.badge && (
            <span
              className={cn(
                "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-semibold tabular-nums",
                item.badge.className
              )}
            >
              {item.badge.label}
            </span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar panel */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen flex flex-col",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Consultant navigation"
      >
        {/* Logo */}
        <div className="flex items-center px-4 h-16 border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo_blue_650.webp"
            alt="Full Funnel"
            width={140}
            height={40}
            className="object-contain h-9 w-auto"
            priority
          />
        </div>

        {/* Nav */}
        <div className="flex flex-col flex-1 overflow-y-auto py-4 px-3">
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            My Workspace
          </p>

          <ul className="space-y-0.5 flex-1">
            {NAV_MAIN.map(renderItem)}
          </ul>

          {/* Divider */}
          <div className="my-3 border-t border-white/10" />

          <ul className="space-y-0.5">
            {NAV_BOTTOM.map(renderItem)}
          </ul>
        </div>
      </aside>
    </>
  );
}
