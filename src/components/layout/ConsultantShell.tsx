/**
 * ConsultantShell — page shell for /consultant routes.
 * ConsultantSidebar + TopBar + main content.
 */
"use client";

import { useState, useCallback } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { ConsultantSidebar } from "@/components/layout/ConsultantSidebar";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";

interface ConsultantShellProps {
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
}

export function ConsultantShell({ children, userName, userEmail }: ConsultantShellProps) {
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
      <ConsultantSidebar open={sidebarOpen} onClose={closeSidebar} />
      <SessionExpiryWarning />
      <main className="pt-20 md:ml-64 min-h-screen px-4 pb-4 md:px-6 md:pb-6">
        {children}
      </main>
    </div>
  );
}
