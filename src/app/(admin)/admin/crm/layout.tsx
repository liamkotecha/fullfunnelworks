/**
 * CRM layout — wraps all /admin/crm/* sub-pages.
 * Renders a sub-nav tab bar: Pipeline | All Prospects | Setup
 */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { label: "Pipeline",       href: "/admin/crm/pipeline" },
  { label: "All Prospects",  href: "/admin/crm/prospects" },
  { label: "Workload",       href: "/admin/crm/workload" },
  { label: "Setup",          href: "/admin/crm/setup" },
] as const;

export default function CRMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5 mb-6 w-fit">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href ||
            pathname.startsWith(tab.href + "/");
          return (
            <button
              key={tab.label}
              onClick={() => router.push(tab.href)}
              className="relative px-4 py-2 rounded-md text-sm font-semibold transition-colors z-10"
              style={{ color: isActive ? "rgba(255,255,255,1)" : "rgba(255,255,255,0.55)" }}
            >
              {isActive && (
                <motion.div
                  layoutId="crm-tab-pill"
                  className="absolute inset-0 bg-white/15 rounded-md"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ zIndex: -1 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}
