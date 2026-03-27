/**
 * AdminSidebar — role-aware navigation.
 * Admin sees full platform nav (clients, projects, pipeline, consultants, questions, invoices).
 * Consultant sees lean workspace nav (their clients, invoices, settings).
 */
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Settings,
  FileQuestion,
  Receipt,
  UserCog,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
  role?: UserRole;
}

export function AdminSidebar({ open = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  type NavItem = {
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
    badge: { label: string; className: string } | null;
  };

  // ── Admin navigation (full platform)
  const ADMIN_NAV: NavItem[] = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { href: "/admin/consultants", label: "Consultants", icon: UserCog, badge: null },
    { href: "/admin/plans", label: "Plans", icon: CreditCard, badge: null },
    { href: "/admin/questions", label: "Questions", icon: FileQuestion, badge: null },
    { href: "/admin/invoices", label: "Billing", icon: Receipt, badge: null },
  ];

  const NAV_MAIN = ADMIN_NAV;

  const NAV_BOTTOM: NavItem[] = [
    { href: "/admin/settings", label: "Settings", icon: Settings, badge: null },
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
        aria-label="Admin navigation"
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
          {/* Role label */}
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
            Platform
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

