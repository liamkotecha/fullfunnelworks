/**
 * QuadrantTabs — tab navigation for SWOT and MOST analysis.
 * Each tab shows its own field count and status colour.
 */
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface QuadrantTab {
  id: string;
  label: string;
  answeredCount: number;
  totalCount: number;
}

interface QuadrantTabsProps {
  tabs: QuadrantTab[];
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  /** Renders the content for the currently active tab */
  children: (activeTabId: string) => React.ReactNode;
  className?: string;
}

export function QuadrantTabs({
  tabs,
  activeTabId,
  onChange,
  children,
  className,
}: QuadrantTabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const [direction, setDirection] = useState(0);

  const active = activeTabId ?? internalActive;

  const handleTabChange = useCallback(
    (tabId: string) => {
      const currentIdx = tabs.findIndex((t) => t.id === active);
      const nextIdx = tabs.findIndex((t) => t.id === tabId);
      setDirection(nextIdx > currentIdx ? 1 : -1);
      setInternalActive(tabId);
      onChange?.(tabId);
    },
    [active, onChange, tabs]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const idx = tabs.findIndex((t) => t.id === active);
      if (e.key === "ArrowRight" && idx < tabs.length - 1) {
        e.preventDefault();
        handleTabChange(tabs[idx + 1].id);
      }
      if (e.key === "ArrowLeft" && idx > 0) {
        e.preventDefault();
        handleTabChange(tabs[idx - 1].id);
      }
    },
    [active, handleTabChange, tabs]
  );

  return (
    <div className={className}>
      {/* Tab bar */}
      <div
        role="tablist"
        className="flex border-b border-slate-200"
        onKeyDown={handleKeyDown}
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          const percent = tab.totalCount ? Math.round((tab.answeredCount / tab.totalCount) * 100) : 0;
          const tabStatus =
            percent >= 100 ? "complete" : percent > 0 ? "in_progress" : "not_started";

          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex-1 py-3 px-3 text-sm font-medium transition-colors text-center",
                isActive ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "ml-1.5 text-xs",
                  tabStatus === "complete" && "text-brand-green",
                  tabStatus === "in_progress" && "text-amber-600",
                  tabStatus === "not_started" && "text-slate-400"
                )}
              >
                ({tab.answeredCount}/{tab.totalCount})
              </span>

              {/* Active underline */}
              {isActive && (
                <motion.div
                  layoutId="quadrant-tab-underline"
                  className={cn(
                    "absolute bottom-0 left-0 right-0 h-0.5",
                    tabStatus === "complete" && "bg-brand-green",
                    tabStatus === "in_progress" && "bg-amber-500",
                    tabStatus === "not_started" && "bg-brand-blue"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content with slide animation */}
      <div className="relative overflow-hidden mt-4">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={active}
            custom={direction}
            initial={{ x: direction * 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -30, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            {children(active)}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
