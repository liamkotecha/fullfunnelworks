"use client";

import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/notifications/ToastContext";
import { ToasterDisplay } from "@/components/notifications/ToasterDisplay";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
        <ToasterDisplay />
      </ToastProvider>
    </SessionProvider>
  );
}
