"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface WorkstreamTab {
  id: string;
  label: string;
}

interface WorkstreamTabsProps {
  tabs: WorkstreamTab[];
  activeTabId?: string;
  onChange?: (tabId: string) => void;
  children: (activeTabId: string) => React.ReactNode;
  className?: string;
}

export function WorkstreamTabs({
  tabs,
  activeTabId,
  onChange,
  children,
  className,
}: WorkstreamTabsProps) {
  const [internalActive, setInternalActive] = useState(tabs[0]?.id || "");
  const [direction, setDirection] = useState(0);

  const active = activeTabId ?? internalActive;

  const handleTabChange = useCallback(
    (tabId: string) => {
      const curIdx = tabs.findIndex((t) => t.id === active);
      const nxtIdx = tabs.findIndex((t) => t.id === tabId);
      setDirection(nxtIdx > curIdx ? 1 : -1);
      setInternalActive(tabId);
      onChange?.(tabId);
    },
    [active, onChange, tabs]
  );

  return (
    <div className={className}>
      <div className="flex gap-1 bg-[#141414] rounded-lg p-1">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "relative flex-1 py-2 px-2 text-xs font-medium transition-colors text-center rounded-lg z-10",
                isActive ? "text-white" : "text-white/45 hover:text-white/75"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="workstream-tab-bg"
                  className="absolute inset-0 rounded-lg bg-white/15"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

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
