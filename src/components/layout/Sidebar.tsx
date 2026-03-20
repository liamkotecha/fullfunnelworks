"use client";

import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Search,
  Users,
  Target,
  Settings,
  MapPin,
  BarChart3,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FRAMEWORK_NAV,
  buildProgressMap,
  progressToStatus,
  type FieldStatus,
} from "@/lib/framework-nav";

// NOTE: SidebarNavItem module was never created. This entire component is unused
// (replaced by FrameworkSidebar). Keeping stub types so the file compiles.
type SidebarSectionProps = {
  label: string; icon: React.ReactNode; progress: number; status: FieldStatus;
  isCollapsed: boolean; href?: string; isActive?: boolean; onClick?: () => void;
  children?: React.ReactNode;
};
function SidebarSection(props: SidebarSectionProps) { return null; }
type SidebarNavItemProps = {
  label: string; href: string; progress: number; status: FieldStatus;
  isActive: boolean; isCollapsed: boolean; onClick?: () => void;
};
function SidebarNavItem(props: SidebarNavItemProps) { return null; }

// ── Icon map ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="w-4.5 h-4.5" />,
  Search: <Search className="w-4.5 h-4.5" />,
  Users: <Users className="w-4.5 h-4.5" />,
  Target: <Target className="w-4.5 h-4.5" />,
  Settings: <Settings className="w-4.5 h-4.5" />,
  MapPin: <MapPin className="w-4.5 h-4.5" />,
  BarChart3: <BarChart3 className="w-4.5 h-4.5" />,
  Map: <Map className="w-4.5 h-4.5" />,
};

// ── Types ────────────────────────────────────────────────────

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  clientId?: string;
}

type ProgressMap = Record<
  string,
  { answered: number; total: number; percent: number; status: FieldStatus }
>;

// ── Inner component that uses useSearchParams ────────────────

function SidebarInner({ open = true, onClose, clientId }: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine active sub from URL
  const activeSection = searchParams.get("section") || "";
  const activeSub = searchParams.get("sub") || "";
  const activeTab = searchParams.get("tab") || "";

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!clientId) return;
    try {
      const res = await fetch(`/api/responses/${clientId}`);
      if (!res.ok) return;
      const data = await res.json();
      const responses = data.responses || {};
      const map = buildProgressMap(responses);
      setProgressMap(map);
    } catch {
      // silently fail — progress just shows 0
    }
  }, [clientId]);

  useEffect(() => {
    fetchProgress();
    // Re-fetch progress every 10s for live updates
    const interval = setInterval(fetchProgress, 10000);
    return () => clearInterval(interval);
  }, [fetchProgress]);

  // Listen for custom progress update events (fired by AutosaveField)
  useEffect(() => {
    const handler = () => fetchProgress();
    window.addEventListener("progress-updated", handler);
    return () => window.removeEventListener("progress-updated", handler);
  }, [fetchProgress]);

  // Build href with clientId
  function buildHref(template: string): string {
    return template.replace("CLIENT_ID", clientId || "");
  }

  function isItemActive(sectionId: string, subId?: string): boolean {
    if (sectionId === "overview") {
      return pathname === "/portal/overview";
    }
    if (sectionId === "gtm") {
      if (!subId) return pathname === "/portal/gtm";
      if (subId === "gtm-marketplace") return activeTab === "marketplace" || (!activeTab && pathname === "/portal/gtm");
      if (subId === "gtm-competition") return activeTab === "competition";
    }
    if (subId) {
      const subShort = subId.split("-").slice(1).join("-");
      return activeSection === sectionId && activeSub === subShort;
    }
    return pathname.includes(sectionId);
  }

  const getProgress = (id: string) =>
    progressMap[id] || { answered: 0, total: 0, percent: 0, status: "not_started" as FieldStatus };

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
          "fixed top-0 left-0 z-40 h-screen",
          "transition-all duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
          isCollapsed ? "w-16" : "w-64"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Sidebar navigation"
      >
        {/* Logo area */}
        <div className="flex items-center px-4 h-16 border-b border-white/10 flex-shrink-0">
          <Image
            src="/logo_blue_650.webp"
            alt="Full Funnel"
            width={140}
            height={40}
            className={cn("object-contain h-9 w-auto", isCollapsed && "hidden")}
            priority
          />
          {isCollapsed && (
            <Image
              src="/logo_blue_650.webp"
              alt="Full Funnel"
              width={32}
              height={32}
              className="object-contain h-7 w-auto mx-auto"
              priority
            />
          )}
        </div>

        {/* Nav tree */}
        <div
          className="flex flex-col overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-white/10"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <nav className="space-y-1 flex-1">
            {FRAMEWORK_NAV.map((section) => {
              const sp = getProgress(section.id);

              // Flat section (no children)
              if (section.children.length === 0) {
                return (
                  <SidebarSection
                    key={section.id}
                    label={section.label}
                    icon={ICON_MAP[section.icon] || <LayoutDashboard className="w-4.5 h-4.5" />}
                    progress={sp.percent}
                    status={sp.status}
                    isCollapsed={isCollapsed}
                    href={buildHref(section.href || "#")}
                    isActive={isItemActive(section.id)}
                    onClick={onClose}
                  />
                );
              }

              // Section with children
              return (
                <SidebarSection
                  key={section.id}
                  label={section.label}
                  icon={ICON_MAP[section.icon] || <LayoutDashboard className="w-4.5 h-4.5" />}
                  progress={sp.percent}
                  status={sp.status}
                  isCollapsed={isCollapsed}
                >
                  {section.children.map((child) => {
                    const cp = getProgress(child.id);
                    return (
                      <SidebarNavItem
                        key={child.id}
                        label={child.label}
                        href={buildHref(child.href)}
                        progress={cp.percent}
                        status={cp.status}
                        isActive={isItemActive(section.id, child.id)}
                        isCollapsed={isCollapsed}
                        onClick={onClose}
                      />
                    );
                  })}
                </SidebarSection>
              );
            })}
          </nav>

          {/* Collapse toggle — desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center justify-center mt-4 py-2 text-white/40 hover:text-white/70 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.svg
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </motion.svg>
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Exported wrapper with Suspense ───────────────────────────

export function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <SidebarInner {...props} />
    </Suspense>
  );
}
