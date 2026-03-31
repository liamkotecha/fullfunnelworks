/**
 * FrameworkSidebar — client-only sidebar with the Growth Strategy Framework nav tree.
 * Proper /portal/[section]/[sub] links. Live progress. No admin stats.
 */
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, memo, Suspense } from "react";
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
  Calculator,
  Check,
  ChevronRight,
  UserPlus,
  TrendingUp,
  ClipboardCheck,
  Lock,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FieldStatus } from "@/lib/framework-nav";
import { useProgress } from "@/context/ProgressContext";
import { useProjectContext } from "@/context/ProjectContext";
import type { ModuleId } from "@/types";

// ── Nav structure — proper hrefs ─────────────────────────────

interface NavChild {
  id: string;
  label: string;
  href: string;
  badge?: string;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavChild[];
}

const FRAMEWORK_NAV: NavSection[] = [
  {
    id: "overview",
    label: "Overview",
    icon: <LayoutDashboard className="w-[18px] h-[18px]" />,
    href: "/portal/overview",
  },
  {
    id: "assessment",
    label: "Assessment",
    icon: <Search className="w-[18px] h-[18px]" />,
    children: [
      { id: "checklist", label: "Assessment Checklist", href: "/portal/assessment/checklist" },
      { id: "swot", label: "SWOT Analysis", href: "/portal/assessment/swot" },
      { id: "most", label: "MOST Analysis", href: "/portal/assessment/most" },
      { id: "gap", label: "Gap Analysis", href: "/portal/assessment/gap" },
      { id: "leadership", label: "Leadership Questions", href: "/portal/assessment/leadership" },
    ],
  },
  {
    id: "people",
    label: "People",
    icon: <Users className="w-[18px] h-[18px]" />,
    children: [
      { id: "team", label: "Team Members", href: "/portal/people/team" },
      { id: "structure", label: "Company Structure", href: "/portal/people/structure" },
      { id: "challenges", label: "Challenges & Strategy", href: "/portal/people/challenges" },
      { id: "methodology", label: "Team Capability Tracker", href: "/portal/people/methodology" },
    ],
  },
  {
    id: "product",
    label: "Product",
    icon: <Target className="w-[18px] h-[18px]" />,
    children: [
      { id: "challenges", label: "Product Challenges", href: "/portal/product/challenges" },
      { id: "outcomes", label: "Outcome Mapper", href: "/portal/product/outcomes" },
    ],
  },
  {
    id: "process",
    label: "Process",
    icon: <Settings className="w-[18px] h-[18px]" />,
    children: [
      { id: "checklist", label: "Process Checklist", href: "/portal/process/checklist" },
      { id: "methodology", label: "Sales Methodology", href: "/portal/process/methodology" },
      { id: "builder", label: "Sales Process Builder", href: "/portal/process/builder" },
    ],
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: <MapPin className="w-[18px] h-[18px]" />,
    href: "/portal/roadmap",
  },
  {
    id: "kpis",
    label: "KPIs",
    icon: <BarChart3 className="w-[18px] h-[18px]" />,
    href: "/portal/kpis",
  },
  {
    id: "gtm",
    label: "GTM Playbook",
    icon: <Map className="w-[18px] h-[18px]" />,
    children: [
      { id: "market", label: "Market Intelligence", href: "/portal/gtm/market" },
      { id: "competition", label: "Competition", href: "/portal/gtm/competition" },
    ],
  },
  {
    id: "revenue_execution",
    label: "Revenue Execution",
    icon: <TrendingUp className="w-[18px] h-[18px]" />,
    children: [
      { id: "methodology", label: "2.1 Sales Methodology", href: "/portal/revenue-execution/methodology" },
      { id: "adoption", label: "2.2 Adoption Programme", href: "/portal/revenue-execution/adoption" },
      { id: "ownership", label: "2.3 Leadership Ownership", href: "/portal/revenue-execution/ownership" },
      { id: "crm", label: "2.4 CRM Integration", href: "/portal/revenue-execution/crm" },
      { id: "campaigns", label: "2.5 Campaign Performance", href: "/portal/revenue-execution/campaigns" },
      { id: "scorecard", label: "2.6 Balanced Scorecard", href: "/portal/revenue-execution/scorecard" },
      { id: "qbr", label: "2.7 Quarterly Review", href: "/portal/revenue-execution/qbr" },
      { id: "people-cap", label: "2.8 People & Capability", href: "/portal/revenue-execution/people-cap" },
    ],
  },
  {
    id: "execution_planning",
    label: "Execution Planning",
    icon: <ClipboardCheck className="w-[18px] h-[18px]" />,
    children: [
      { id: "priorities", label: "3.1 Priority Setting", href: "/portal/execution-planning/priorities" },
      { id: "ninety-day", label: "3.2 90-Day Action Plans", href: "/portal/execution-planning/ninety-day" },
      { id: "accountability", label: "3.3 Accountability", href: "/portal/execution-planning/accountability" },
      { id: "risk", label: "3.4 Risk & Dependencies", href: "/portal/execution-planning/risk" },
      { id: "governance", label: "3.5 Governance", href: "/portal/execution-planning/governance" },
      { id: "kpi-dashboard", label: "3.6 KPI Dashboard", href: "/portal/execution-planning/kpi-dashboard" },
      { id: "reset", label: "3.7 Quarterly Reset", href: "/portal/execution-planning/reset" },
    ],
  },
  {
    id: "tools",
    label: "Tools",
    icon: <Calculator className="w-[18px] h-[18px]" />,
    children: [
      { id: "modeller", label: "Financial Modeller", href: "/portal/modeller", badge: "PRO" },
      { id: "hiring-plan", label: "Hiring Plan", href: "/portal/modeller/hiring", badge: "PRO" },
    ],
  },
  {
    id: "invoices",
    label: "Invoices",
    icon: <Receipt className="w-[18px] h-[18px]" />,
    href: "/portal/invoices",
  },
];

// ── Status dot ───────────────────────────────────────────────

function StatusDot({ status }: { status: FieldStatus }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300",
        status === "complete" && "bg-brand-green",
        status === "in_progress" && "bg-amber-400",
        status === "not_started" && "bg-white/30"
      )}
    />
  );
}

// ── Pulsing status dot for top-level items ───────────────────

function TopLevelStatusDot({ status }: { status: FieldStatus }) {
  if (status === "complete") {
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-2 h-2 rounded-full bg-brand-green flex-shrink-0"
      />
    );
  }
  if (status === "in_progress") {
    return (
      <span className="relative flex-shrink-0 w-2 h-2">
        <motion.span
          className="absolute inset-0 rounded-full bg-amber-400/40"
          animate={{ scale: [1, 1.9, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="absolute inset-0 rounded-full bg-amber-400" />
      </span>
    );
  }
  return <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />;
}

// ── Mini progress bar ────────────────────────────────────────

function MiniProgress({ percent, status }: { percent: number; status: FieldStatus }) {
  return (
    <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
      <motion.div
        className={cn(
          "h-full rounded-full",
          status === "complete" && "bg-brand-green",
          status === "in_progress" && "bg-amber-400",
          status === "not_started" && "bg-white/20"
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// ── Nav Item (leaf) ──────────────────────────────────────────

const NavItem = memo(function NavItem({
  label,
  href,
  isActive,
  progress = 0,
  status = "not_started",
  badge,
  locked = false,
  onClick,
}: {
  label: string;
  href: string;
  isActive: boolean;
  progress?: number;
  status?: FieldStatus;
  badge?: string;
  locked?: boolean;
  onClick?: () => void;
}) {
  // Locked child: visible but not navigable
  if (locked) {
    return (
      <div
        title="Ask your consultant to unlock this module"
        className="flex items-center gap-2 py-1.5 px-2 rounded-md text-sm opacity-40 cursor-not-allowed pointer-events-none"
      >
        <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />
        <span className="flex-1 min-w-0 text-white/50">{label}</span>
        <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />
      </div>
    );
  }

  return (
    <Link
      href={href}
      onClick={onClick}
      title={label}
      data-nav-active={isActive ? "true" : undefined}
      className={cn(
        "flex items-center gap-2 py-1.5 px-2 rounded-md text-sm transition-all duration-150 group relative",
        isActive
          ? "bg-white/15 text-white"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      )}
    >
      {!badge && <StatusDot status={status} />}
      <span className="flex-1 min-w-0">{label}</span>
      {badge && (
        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 leading-none">
          {badge}
        </span>
      )}
      {!badge && (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <MiniProgress percent={progress} status={status} />
        {status === "complete" ? (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.3 }}
          >
            <Check className="w-3.5 h-3.5 text-brand-green" />
          </motion.div>
        ) : (
          <span className="text-xs text-white/40 w-7 text-right tabular-nums">
            {progress}%
          </span>
        )}
      </div>
      )}
    </Link>
  );
});

// ── Section Group (collapsible parent) ───────────────────────

const SectionGroup = memo(function SectionGroup({
  section,
  isActive,
  activePathname,
  progress = 0,
  status = "not_started",
  locked = false,
  isOpen,
  onToggle,
  onChildClick,
  getChildProgress,
  isChildLocked,
}: {
  section: NavSection;
  isActive: boolean;
  activePathname: string;
  progress?: number;
  status?: FieldStatus;
  locked?: boolean;
  isOpen: boolean;
  onToggle: (id: string) => void;
  onChildClick?: () => void;
  getChildProgress?: (sectionId: string, childId: string) => { percent: number; status: FieldStatus };
  isChildLocked?: (sectionId: string, childId: string) => boolean;
}) {

  // If flat section (no children), render as direct link
  if (!section.children || section.children.length === 0) {
    // Locked flat section: visible but not navigable
    if (locked) {
      return (
        <div
          title="Ask your consultant to unlock this module"
          className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed pointer-events-none"
        >
          <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
            {section.icon}
          </span>
          <span className="flex-1 min-w-0 text-white/50">{section.label}</span>
          <Lock className="w-3 h-3 text-white/30 flex-shrink-0" />
        </div>
      );
    }

    return (
      <Link
        href={section.href || "#"}
        onClick={onChildClick}
        title={section.label}
        className={cn(
          "flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium transition-all duration-150 group relative",
          isActive
            ? "bg-white/15 text-white"
            : "text-white/80 hover:bg-white/10 hover:text-white"
        )}
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {section.icon}
        </span>
        <span className="flex-1 min-w-0">{section.label}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {section.id !== "overview" && <MiniProgress percent={progress} status={status} />}
          {status === "complete" && section.id !== "overview" ? (
            <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.3 }}>
              <Check className="w-3.5 h-3.5 text-brand-green" />
            </motion.div>
          ) : section.id !== "overview" ? (
            <span className="text-xs text-white/40 w-7 text-right tabular-nums">{progress}%</span>
          ) : null}
        </div>
      </Link>
    );
  }

  // Has children — collapsible group
  const anyChildActive = section.children.some(
    (c) => activePathname === c.href || activePathname.startsWith(c.href + "/")
  );

  // Locked collapsible section: show Lock icon, non-interactive
  if (locked) {
    return (
      <div
        title="Ask your consultant to unlock this module"
        className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium opacity-40 cursor-not-allowed"
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {section.icon}
        </span>
        <span className="flex-1 min-w-0 text-white/50">{section.label}</span>
        <Lock className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => onToggle(section.id)}
        className="flex items-center gap-2.5 py-2 px-2 rounded-lg text-sm font-medium w-full text-left transition-all duration-150 text-white/80 hover:bg-white/10 hover:text-white"
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
          {section.icon}
        </span>
        <span className="flex-1 min-w-0">{section.label}</span>
        {section.id !== "tools" && (
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <TopLevelStatusDot status={status} />
            <span className={cn(
              "text-xs tabular-nums w-7 text-right",
              status === "complete" && "text-brand-green",
              status === "in_progress" && "text-amber-400",
              status === "not_started" && "text-white/40"
            )}>{progress}%</span>
          </div>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}
          className="ml-0.5 flex-shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="ml-7 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
              {section.children.map((child) => {
                const childActive =
                  activePathname === child.href ||
                  activePathname.startsWith(child.href + "/");
                const cp = getChildProgress?.(section.id, child.id) ?? { percent: 0, status: "not_started" as FieldStatus };
                const childLocked = isChildLocked?.(section.id, child.id) ?? false;
                return (
                  <NavItem
                    key={child.id}
                    label={child.label}
                    href={child.href}
                    isActive={childActive}
                    progress={cp.percent}
                    status={cp.status}
                    badge={childLocked ? undefined : child.badge}
                    locked={childLocked}
                    onClick={onChildClick}
                  />
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ── Inner (uses hooks) ───────────────────────────────────────

function FrameworkSidebarInner({
  open = true,
  onClose,
  isViewAs = false,
}: {
  open?: boolean;
  onClose?: () => void;
  isViewAs?: boolean;
}) {
  const pathname = usePathname();
  const { progress: progressData, refreshAll } = useProgress();
  const { activeModules, lockedByInvoice, loaded: modulesLoaded } = useProjectContext();

  // Map section/child IDs to ModuleId for locking
  const isSectionLocked = useCallback(
    (sectionId: string): boolean => {
      // Don't lock anything while still loading
      if (!modulesLoaded) return false;
      // Overview and invoices are never locked
      if (sectionId === "overview" || sectionId === "invoices") return false;
      // Tools section itself is not locked (children are checked individually)
      if (sectionId === "tools") return false;
      // Locked if not in activeModules OR locked by unpaid milestone invoice
      if (!activeModules.includes(sectionId as ModuleId)) return true;
      if (lockedByInvoice.includes(sectionId as ModuleId)) return true;
      return false;
    },
    [activeModules, lockedByInvoice, modulesLoaded]
  );

  const isChildLocked = useCallback(
    (sectionId: string, childId: string): boolean => {
      if (!modulesLoaded) return false;
      if (sectionId === "tools") {
        // "modeller" child maps to "modeller" module, "hiring-plan" maps to "hiring" module
        const moduleMap: Record<string, ModuleId> = {
          modeller: "modeller",
          "hiring-plan": "hiring",
        };
        const moduleId = moduleMap[childId];
        if (moduleId) {
          if (!activeModules.includes(moduleId)) return true;
          if (lockedByInvoice.includes(moduleId)) return true;
        }
        return false;
      }
      // For non-tools sections, children inherit parent lock state
      return isSectionLocked(sectionId);
    },
    [activeModules, lockedByInvoice, modulesLoaded, isSectionLocked]
  );

  // Fallback: keep sidebar progress in sync even if a save event is missed
  // (e.g. fast navigation during debounced autosave).
  useEffect(() => {
    void refreshAll();
  }, [pathname, refreshAll]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshAll();
    }, 10000);
    return () => clearInterval(id);
  }, [refreshAll]);

  // Derive which group is active from the current path
  const activeGroup = pathname.split("/")[2] ?? null;

  // Accordion state — only one group open at a time
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);

  // When pathname changes, auto-open the matching group
  useEffect(() => {
    setOpenGroup(activeGroup);
  }, [activeGroup]);

  const toggleGroup = useCallback(
    (groupId: string) => {
      setOpenGroup((prev) => (prev === groupId ? null : groupId));
    },
    []
  );

  // Auto-scroll active child into view
  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.querySelector('[data-nav-active="true"]');
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [pathname]);

  // Compute child progress from context
  const getChildProgress = useCallback(
    (sectionId: string, childId: string): { percent: number; status: FieldStatus } => {
      const key = `${sectionId}-${childId}`;
      const p = progressData[key];
      if (!p || p.totalCount === 0) return { percent: 0, status: "not_started" };
      const pct = Math.round((p.answeredCount / p.totalCount) * 100);
      return {
        percent: pct,
        status: pct >= 100 ? "complete" : pct > 0 ? "in_progress" : "not_started",
      };
    },
    [progressData]
  );

  // Compute section-level progress (average of children, or flat lookup)
  const sectionProgressMap = useMemo(() => {
    const map: Record<string, { percent: number; status: FieldStatus }> = {};
    for (const section of FRAMEWORK_NAV) {
      if (!section.children || section.children.length === 0) {
        // Flat sections store progress under "{sectionId}-{sectionId}"
        const key = `${section.id}-${section.id}`;
        const p = progressData[key];
        if (p && p.totalCount > 0) {
          const pct = Math.round((p.answeredCount / p.totalCount) * 100);
          map[section.id] = {
            percent: pct,
            status: pct >= 100 ? "complete" : pct > 0 ? "in_progress" : "not_started",
          };
        } else {
          map[section.id] = { percent: 0, status: "not_started" };
        }
        continue;
      }
      const childPcts = section.children.map(
        (c) => getChildProgress(section.id, c.id).percent
      );
      const avg =
        childPcts.length > 0
          ? Math.round(childPcts.reduce((a, b) => a + b, 0) / childPcts.length)
          : 0;
      map[section.id] = {
        percent: avg,
        status: avg >= 100 ? "complete" : avg > 0 ? "in_progress" : "not_started",
      };
    }
    return map;
  }, [getChildProgress, progressData]);

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

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 w-64 h-screen",
          "transition-transform duration-300 ease-in-out",
          "md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#141414" }}
        aria-label="Framework navigation"
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

        {/* Nav tree */}
        <div
          className="flex flex-col overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-white/10"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <nav className={cn("space-y-1 flex-1 transition-opacity duration-200", !modulesLoaded && "opacity-0")}>
            {FRAMEWORK_NAV.filter((section) => !(isViewAs && section.id === "invoices")).map((section) => {
              const isActive =
                section.href
                  ? pathname === section.href || pathname.startsWith(section.href + "/")
                  : section.children?.some(
                      (c) =>
                        pathname === c.href ||
                        pathname.startsWith(c.href + "/")
                    ) ?? false;

              const sp = sectionProgressMap[section.id] ?? { percent: 0, status: "not_started" as FieldStatus };

              return (
                <SectionGroup
                  key={section.id}
                  section={section}
                  isActive={!section.children && isActive}
                  activePathname={pathname}
                  progress={sp.percent}
                  status={sp.status}
                  locked={isSectionLocked(section.id)}
                  isOpen={openGroup === section.id}
                  onToggle={toggleGroup}
                  onChildClick={onClose}
                  getChildProgress={getChildProgress}
                  isChildLocked={isChildLocked}
                />
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

// ── Export with Suspense boundary ────────────────────────────

interface FrameworkSidebarProps {
  open?: boolean;
  onClose?: () => void;
  isViewAs?: boolean;
}

export function FrameworkSidebar(props: FrameworkSidebarProps) {
  return (
    <Suspense fallback={null}>
      <FrameworkSidebarInner {...props} />
    </Suspense>
  );
}
