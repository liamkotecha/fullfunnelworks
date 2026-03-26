/**
 * AdminShell — page shell for admin routes.
 * AdminSidebar (Dashboard/Clients/Projects/Settings) + TopBar + main content.
 * NO framework nav tree.
 */
"use client";

import { useState, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

interface AdminShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function AdminShell({ children, userName, userEmail }: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="antialiased" style={{ backgroundColor: "#F9FAFB" }}>
      <TopBar
        userName={userName}
        userEmail={userEmail}
        onMenuToggle={toggleSidebar}
        menuOpen={sidebarOpen}
      />
      <AdminSidebar
        open={sidebarOpen}
        onClose={closeSidebar}
      />
      <SessionExpiryWarning />
      <main className="pt-20 md:ml-64 min-h-screen px-4 pb-4 md:px-6 md:pb-6">
        {children}
      </main>
    </div>
  );
}
