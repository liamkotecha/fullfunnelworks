/**
 * PortalSearch — Cmd+K / Ctrl+K search for the client portal.
 * Searches framework sections, pages and quick actions — no API calls,
 * everything is client-side from a static list derived from the sidebar nav.
 */
"use client";

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Target,
  Users,
  Settings,
  MapPin,
  BarChart3,
  Map,
  FileText,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePortalClient } from "@/hooks/usePortalClient";

interface SearchItem {
  label: string;
  href: string;
  section: string;
  keywords: string[];
  icon: React.ReactNode;
  /** null = always visible; string = only show when this moduleId is active */
  moduleId: string | null;
}

const SEARCH_ITEMS: SearchItem[] = [
  // Overview — always visible
  { label: "Overview", href: "/portal/overview", section: "Navigation", keywords: ["home", "dashboard", "summary", "progress"], icon: <LayoutDashboard className="w-3.5 h-3.5" />, moduleId: null },
  // Intake — always visible
  { label: "Intake Form", href: "/portal/intake", section: "Navigation", keywords: ["intake", "onboarding", "form", "questionnaire"], icon: <FileText className="w-3.5 h-3.5" />, moduleId: null },
  // Assessment
  { label: "Assessment Checklist", href: "/portal/assessment/checklist", section: "Assessment", keywords: ["checklist", "audit", "review"], icon: <ClipboardList className="w-3.5 h-3.5" />, moduleId: "assessment" },
  { label: "SWOT Analysis", href: "/portal/assessment/swot", section: "Assessment", keywords: ["strengths", "weaknesses", "opportunities", "threats", "swot"], icon: <Search className="w-3.5 h-3.5" />, moduleId: "assessment" },
  { label: "MOST Analysis", href: "/portal/assessment/most", section: "Assessment", keywords: ["mission", "objectives", "strategy", "tactics", "most"], icon: <Search className="w-3.5 h-3.5" />, moduleId: "assessment" },
  { label: "Gap Analysis", href: "/portal/assessment/gap", section: "Assessment", keywords: ["gap", "current", "desired", "analysis"], icon: <Search className="w-3.5 h-3.5" />, moduleId: "assessment" },
  { label: "Leadership Questions", href: "/portal/assessment/leadership", section: "Assessment", keywords: ["leadership", "questions", "management"], icon: <Search className="w-3.5 h-3.5" />, moduleId: "assessment" },
  // People
  { label: "Team Members", href: "/portal/people/team", section: "People", keywords: ["team", "members", "staff", "employees"], icon: <Users className="w-3.5 h-3.5" />, moduleId: "people" },
  { label: "Company Structure", href: "/portal/people/structure", section: "People", keywords: ["structure", "org", "organisation", "hierarchy"], icon: <Users className="w-3.5 h-3.5" />, moduleId: "people" },
  { label: "Challenges & Strategy", href: "/portal/people/challenges", section: "People", keywords: ["challenges", "strategy", "people", "hr"], icon: <Users className="w-3.5 h-3.5" />, moduleId: "people" },
  { label: "Team Capability Tracker", href: "/portal/people/methodology", section: "People", keywords: ["capability", "tracker", "skills", "training"], icon: <Users className="w-3.5 h-3.5" />, moduleId: "people" },
  // Product
  { label: "Product Challenges", href: "/portal/product/challenges", section: "Product", keywords: ["product", "challenges", "issues"], icon: <Target className="w-3.5 h-3.5" />, moduleId: "product" },
  { label: "Outcome Mapper", href: "/portal/product/outcomes", section: "Product", keywords: ["outcome", "mapper", "results", "product"], icon: <Target className="w-3.5 h-3.5" />, moduleId: "product" },
  // Process
  { label: "Process Checklist", href: "/portal/process/checklist", section: "Process", keywords: ["process", "checklist", "workflow"], icon: <Settings className="w-3.5 h-3.5" />, moduleId: "process" },
  { label: "Sales Methodology", href: "/portal/process/methodology", section: "Process", keywords: ["sales", "methodology", "approach"], icon: <Settings className="w-3.5 h-3.5" />, moduleId: "process" },
  { label: "Sales Process Builder", href: "/portal/process/builder", section: "Process", keywords: ["builder", "sales", "process", "pipeline"], icon: <Settings className="w-3.5 h-3.5" />, moduleId: "process" },
  // Roadmap
  { label: "Roadmap", href: "/portal/roadmap", section: "Roadmap", keywords: ["roadmap", "plan", "timeline", "milestones"], icon: <MapPin className="w-3.5 h-3.5" />, moduleId: "roadmap" },
  // KPIs
  { label: "KPIs", href: "/portal/kpis", section: "KPIs", keywords: ["kpis", "metrics", "performance", "indicators"], icon: <BarChart3 className="w-3.5 h-3.5" />, moduleId: "kpis" },
  // GTM
  { label: "Market Intelligence", href: "/portal/gtm/market", section: "GTM Playbook", keywords: ["market", "intelligence", "research", "gtm"], icon: <Map className="w-3.5 h-3.5" />, moduleId: "gtm" },
  { label: "Competition", href: "/portal/gtm/competition", section: "GTM Playbook", keywords: ["competition", "competitors", "competitive", "gtm"], icon: <Map className="w-3.5 h-3.5" />, moduleId: "gtm" },
];

export function PortalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { activeModules, loading: modulesLoading } = usePortalClient();

  /* Only show items for active modules (or items that are always visible) */
  const availableItems = useMemo(() => {
    if (modulesLoading) return SEARCH_ITEMS; // show all while loading to avoid flicker
    return SEARCH_ITEMS.filter(
      (item) => item.moduleId === null || activeModules.includes(item.moduleId)
    );
  }, [activeModules, modulesLoading]);

  /* Keyboard shortcut */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* Focus + reset when opened */
  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  /* Filtered results */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableItems;
    return availableItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.section.toLowerCase().includes(q) ||
        item.keywords.some((kw) => kw.includes(q))
    );
  }, [query, availableItems]);

  const navigate = useCallback(
    (item: SearchItem) => {
      setOpen(false);
      router.push(item.href);
    },
    [router]
  );

  /* Arrow key navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setActive((v) => Math.min(v + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActive((v) => Math.max(v - 1, 0)); }
      if (e.key === "Enter" && results[active]) navigate(results[active]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, results, active, navigate]);

  /* Group results by section for display */
  const grouped = useMemo(() => {
    const map: Record<string, SearchItem[]> = {};
    for (const item of results) {
      if (!map[item.section]) map[item.section] = [];
      map[item.section].push(item);
    }
    return Object.entries(map);
  }, [results]);

  /* Flat index for active tracking */
  const flatResults = results;

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-3 w-72 lg:w-96 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/[0.15] border border-white/[0.12] transition-colors group"
      >
        <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-left text-sm text-slate-400">
          Search sections…
        </span>
        <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/[0.15] text-[11px] font-mono text-slate-400 leading-none">
          <span className="text-[13px] leading-none">⌘</span>K
        </kbd>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="portal-search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              key="portal-search-dialog"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            >
              <div className="w-full max-w-xl pointer-events-auto">

              <div className="bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl ring-1 ring-white/[0.08]">

                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.08]">
                  <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setActive(0); }}
                    placeholder="Search sections…"
                    className="flex-1 bg-transparent text-[15px] text-white placeholder:text-slate-500 outline-none"
                  />
                  {query ? (
                    <button onClick={() => setQuery("")} className="text-slate-500 hover:text-slate-300 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded bg-white/10 border border-white/[0.1] text-[10px] font-mono text-slate-500">
                      ESC
                    </kbd>
                  )}
                </div>

                {/* Results */}
                <div className="max-h-80 overflow-y-auto py-2">
                  {flatResults.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-sm text-slate-400">No results for <span className="text-white">&ldquo;{query}&rdquo;</span></p>
                    </div>
                  ) : (
                    <div>
                      {grouped.map(([section, items]) => (
                        <div key={section}>
                          <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                            {section}
                          </p>
                          {items.map((item) => {
                            const flatIdx = flatResults.indexOf(item);
                            return (
                              <button
                                key={item.href}
                                onClick={() => navigate(item)}
                                onMouseEnter={() => setActive(flatIdx)}
                                className={cn(
                                  "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                  flatIdx === active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                                )}
                              >
                                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 ring-1 ring-white/[0.08] text-slate-400">
                                  {item.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-white truncate">{item.label}</p>
                                </div>
                                <ArrowRight className={cn(
                                  "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                                  flatIdx === active ? "text-slate-300" : "text-slate-600"
                                )} />
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/[0.06] px-4 py-2.5 flex items-center gap-4">
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">↑↓</kbd> navigate
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">↵</kbd> open
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <kbd className="font-mono bg-white/10 px-1 py-0.5 rounded text-slate-400">esc</kbd> close
                  </span>
                </div>
              </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
