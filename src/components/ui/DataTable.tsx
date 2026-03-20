"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────

export type SortDirection = "asc" | "desc" | null;

export interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  /** Raw value for sorting — return string | number | Date */
  sortValue?: (row: T) => string | number | Date;
  sortable?: boolean;
  /** Hide on smaller screens */
  hideBelow?: "md" | "lg" | "xl";
  /** Right-align column */
  align?: "left" | "center" | "right";
  /** Custom width class */
  width?: string;
}

export interface ActionItem<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  /** Conditionally show action */
  show?: (row: T) => boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  /** Row key extractor */
  keyExtractor: (row: T) => string;
  /** Three-dot action menu items */
  actions?: ActionItem<T>[];
  /** Click handler for the entire row */
  onRowClick?: (row: T) => void;
  /** Empty state content */
  emptyState?: React.ReactNode;
  /** Show stagger animation */
  animated?: boolean;
  /** Additional class on wrapper */
  className?: string;
}

// ── Animation variants ───────────────────────────────────────

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const rowVariant = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

// ── Sort Icon ────────────────────────────────────────────────

function SortIcon({ direction }: { direction: SortDirection }) {
  if (!direction) {
    return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
  }
  if (direction === "asc") {
    return <ChevronUp className="w-3.5 h-3.5 text-navy" />;
  }
  return <ChevronDown className="w-3.5 h-3.5 text-navy" />;
}

// ── Action Menu ──────────────────────────────────────────────

function ActionMenu<T>({ row, actions }: { row: T; actions: ActionItem<T>[] }) {
  const [open, setOpen] = useState(false);

  const visibleActions = actions.filter((a) => !a.show || a.show(row));
  if (visibleActions.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600"
        aria-label="Row actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-full mt-1 z-20 w-44 bg-white rounded-lg shadow-sm border border-gray-100 py-1 overflow-hidden"
            >
              {visibleActions.map((action) => (
                <button
                  key={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(row);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors",
                    action.variant === "danger"
                      ? "text-red-600 hover:bg-red-50"
                      : "text-slate-700 hover:bg-gray-50"
                  )}
                >
                  {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── DataTable ────────────────────────────────────────────────

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  actions,
  onRowClick,
  emptyState,
  animated = true,
  className,
}: DataTableProps<T>) {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>(null);

  const handleSort = useCallback(
    (colId: string) => {
      if (sortCol === colId) {
        // Cycle: asc → desc → null
        if (sortDir === "asc") setSortDir("desc");
        else if (sortDir === "desc") {
          setSortCol(null);
          setSortDir(null);
        }
      } else {
        setSortCol(colId);
        setSortDir("asc");
      }
    },
    [sortCol, sortDir]
  );

  const sortedData = useMemo(() => {
    if (!sortCol || !sortDir) return data;
    const col = columns.find((c) => c.id === sortCol);
    if (!col?.sortValue) return data;
    const sv = col.sortValue;

    return [...data].sort((a, b) => {
      const va = sv(a);
      const vb = sv(b);
      let cmp = 0;
      if (typeof va === "string" && typeof vb === "string") {
        cmp = va.localeCompare(vb);
      } else if (va instanceof Date && vb instanceof Date) {
        cmp = va.getTime() - vb.getTime();
      } else {
        cmp = Number(va) - Number(vb);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortCol, sortDir, columns]);

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const hideClass = (col: Column<T>) => {
    if (!col.hideBelow) return "";
    return col.hideBelow === "md"
      ? "hidden md:table-cell"
      : col.hideBelow === "lg"
      ? "hidden lg:table-cell"
      : "hidden xl:table-cell";
  };

  const alignClass = (col: Column<T>) => {
    if (col.align === "right") return "text-right";
    if (col.align === "center") return "text-center";
    return "text-left";
  };

  const Tbody = animated ? motion.tbody : "tbody";
  const Tr = animated ? motion.tr : "tr";

  return (
    <div className={cn("bg-white rounded-lg shadow border border-gray-100 overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    "px-6 py-3 text-xs font-semibold uppercase tracking-wider",
                    alignClass(col),
                    hideClass(col),
                    col.sortable
                      ? "cursor-pointer select-none hover:text-navy transition-colors text-slate-500"
                      : "text-slate-500",
                    col.width
                  )}
                  onClick={col.sortable ? () => handleSort(col.id) : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && (
                      <SortIcon direction={sortCol === col.id ? sortDir : null} />
                    )}
                  </span>
                </th>
              ))}
              {actions && actions.length > 0 && (
                <th className="px-4 py-3 w-12">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <Tbody {...(animated ? { variants: stagger, initial: "hidden", animate: "show" } : {})}>
            {sortedData.map((row) => (
              <Tr
                key={keyExtractor(row)}
                {...(animated ? { variants: rowVariant } : {})}
                className={cn(
                  "border-b border-gray-100 last:border-0 transition-colors",
                  onRowClick
                    ? "cursor-pointer hover:bg-gray-50/80 group"
                    : "hover:bg-gray-50/50"
                )}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn(
                      "px-6 py-3.5",
                      alignClass(col),
                      hideClass(col),
                      col.width
                    )}
                  >
                    {col.accessor(row)}
                  </td>
                ))}
                {actions && actions.length > 0 && (
                  <td className="px-4 py-3.5 text-right">
                    <ActionMenu row={row} actions={actions} />
                  </td>
                )}
              </Tr>
            ))}
          </Tbody>
        </table>
      </div>
    </div>
  );
}
