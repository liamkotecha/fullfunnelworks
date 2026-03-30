"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { User, Bell, Lock, CreditCard, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    label: "Profile",
    href: "/consultant/settings?tab=profile",
    tab: "profile",
    icon: User,
    exactPath: true,
  },
  {
    label: "Notifications",
    href: "/consultant/settings?tab=notifications",
    tab: "notifications",
    icon: Bell,
    exactPath: true,
  },
  {
    label: "Security",
    href: "/consultant/settings?tab=security",
    tab: "security",
    icon: Lock,
    exactPath: true,
  },
  {
    label: "Payouts",
    href: "/consultant/settings?tab=payouts",
    tab: "payouts",
    icon: CreditCard,
    exactPath: true,
  },
  {
    label: "Lead Forms",
    href: "/consultant/settings/forms",
    tab: null,
    icon: FileText,
    exactPath: false,
  },
  {
    label: "Danger Zone",
    href: "/consultant/settings?tab=danger",
    tab: "danger",
    icon: AlertTriangle,
    exactPath: true,
    danger: true,
  },
];

function SettingsNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "profile";
  const isFormsPage = pathname === "/consultant/settings/forms";

  function isActive(item: typeof NAV_ITEMS[0]) {
    if (!item.exactPath) return isFormsPage;
    if (isFormsPage) return false;
    return item.tab === currentTab || (item.tab === "profile" && !searchParams.get("tab"));
  }

  return (
    <nav className="w-44 flex-shrink-0 space-y-0.5 sticky top-6">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item);
        const Icon = item.icon;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-slate-100 text-slate-900"
                : item.danger
                ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
            )}
          >
            <Icon className={cn("w-4 h-4 flex-shrink-0", active ? "text-slate-700" : item.danger ? "text-red-400" : "text-slate-400")} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile, notifications and security</p>
      </div>

      <div className="flex gap-8 items-start">
        {/* ── Sidebar nav ───────────────────────────────────── */}
        <Suspense fallback={<div className="w-44 flex-shrink-0" />}>
          <SettingsNav />
        </Suspense>

        {/* ── Page content ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
