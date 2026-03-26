/**
 * All Prospects — sortable table view with filters, bulk actions, CSV export.
 */
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  RefreshCw,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { cn, formatDate } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import { LeadScoreBadge } from "@/components/crm/LeadScoreBadge";
import { QuickAddProspectModal } from "@/components/crm/QuickAddProspectModal";
import { ConfirmModal } from "@/components/ui/Modal";
import { useToast } from "@/components/notifications/ToastContext";
import type { ProspectDTO, ProspectStage } from "@/types";
import { PROSPECT_STAGE_META } from "@/types";

const PAGE_SIZE = 15;

type SortKey = "businessName" | "contactName" | "leadScore" | "stage" | "dealValue" | "source" | "createdAt";
type SortDir = "asc" | "desc";

const STAGE_ORDER: Record<ProspectStage, number> = {
  mql: 0, sql: 1, discovery: 2, proposal: 3, negotiating: 4, won: 5, lost: 6,
};

/* ── Stage badge helper ──────────────────────────────────── */
function StageBadge({ stage }: { stage: ProspectStage }) {
  const meta = PROSPECT_STAGE_META[stage];
  const colorMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    amber: "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
    green: "bg-emerald-100 text-emerald-700",
    gray: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        colorMap[meta.colour] ?? "bg-gray-100 text-gray-600"
      )}
    >
      {meta.label}
    </span>
  );
}

export default function ProspectListPage() {
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const hasFetched = useRef(false);
  const { error: toastError, success } = useToast();

  const fetchProspects = useCallback(async () => {
    try {
      const res = await fetch("/api/prospects");
      const json = await res.json();
      setProspects(json.data ?? []);
    } catch {
      toastError("Couldn't load prospects", "Please refresh the page");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchProspects();
  }, [fetchProspects]);

  /* ── Filtering ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = prospects;
    if (stageFilter !== "all") list = list.filter((p) => p.stage === stageFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.businessName.toLowerCase().includes(q) ||
          p.contactName.toLowerCase().includes(q) ||
          p.contactEmail.toLowerCase().includes(q)
      );
    }
    return list;
  }, [prospects, search, stageFilter]);

  /* ── Sorting ────────────────────────────────────────── */
  const sorted = useMemo(() => {
    const list = [...filtered];
    list.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "businessName":
          cmp = a.businessName.localeCompare(b.businessName);
          break;
        case "contactName":
          cmp = a.contactName.localeCompare(b.contactName);
          break;
        case "leadScore":
          cmp = a.leadScore - b.leadScore;
          break;
        case "stage":
          cmp = STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage];
          break;
        case "dealValue":
          cmp = (a.dealValue ?? 0) - (b.dealValue ?? 0);
          break;
        case "source":
          cmp = a.source.localeCompare(b.source);
          break;
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [filtered, sortKey, sortDir]);

  /* ── Pagination ─────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const allSelected = paginated.length > 0 && paginated.every((p) => selected.has(p.id));

  const toggleAll = () => {
    const next = new Set(selected);
    if (allSelected) paginated.forEach((p) => next.delete(p.id));
    else paginated.forEach((p) => next.add(p.id));
    setSelected(next);
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3 h-3 text-slate-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-slate-600" />
    );
  };

  /* ── Bulk delete ────────────────────────────────────── */
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleteConfirm(false);
    const count = selected.size;
    for (const id of selected) {
      await fetch(`/api/prospects/${id}`, { method: "DELETE" });
    }
    setProspects((prev) => prev.filter((p) => !selected.has(p.id)));
    setSelected(new Set());
    success(`${count} prospect${count !== 1 ? "s" : ""} deleted`);
  };

  /* ── CSV export ─────────────────────────────────────── */
  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/prospects/export");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prospects-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastError("Export failed", "Couldn't generate CSV — please try again");
    } finally {
      setExporting(false);
    }
  };

  /* ── Loading ────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 bg-slate-200/60 rounded-lg animate-pulse" />
        <div className="h-96 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="font-bold text-2xl text-slate-900">All Prospects</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {filtered.length} prospect{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search…"
              className="pl-8 pr-3 py-2 text-sm font-sans rounded-lg bg-white ring-1 ring-black/[0.08] outline-none focus:ring-2 focus:ring-[#1C1C1E]/20 w-40 placeholder:text-slate-400"
            />
          </div>

          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="px-3 py-2.5 text-sm rounded-lg bg-white border border-slate-200 text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
          >
            <option value="all">All stages</option>
            {Object.entries(PROSPECT_STAGE_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white ring-1 ring-black/[0.08] text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgb(108, 194, 255)", color: "#141414" }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </motion.button>
        </div>
      </div>

      {/* ── Bulk action bar ──────────────────────────────── */}
      {selected.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 px-4 py-2.5 bg-[#1C1C1E] rounded-lg flex items-center gap-3"
        >
          <span className="font-sans text-xs text-slate-300">
            {selected.size} selected
          </span>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 font-medium"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="font-sans text-xs text-slate-400 hover:text-white ml-auto"
          >
            Clear
          </button>
        </motion.div>
      )}

      {/* ── Table ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-slate-300 accent-[#1C1C1E] cursor-pointer"
                  />
                </th>
                {[
                  { key: "businessName" as const, label: "Business" },
                  { key: "contactName" as const, label: "Contact" },
                  { key: "leadScore" as const, label: "Score" },
                  { key: "stage" as const, label: "Stage" },
                  { key: "dealValue" as const, label: "Deal Value" },
                  { key: "source" as const, label: "Source" },
                  { key: "createdAt" as const, label: "Created" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left font-sans text-[11px] font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-600 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {col.label}
                      <SortIcon col={col.key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center font-sans text-sm text-slate-400">
                    No prospects match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((p) => (
                  <tr
                    key={p.id}
                    className={cn(
                      "group transition-colors",
                      selected.has(p.id) ? "bg-slate-50" : "hover:bg-slate-50/60"
                    )}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(p.id)}
                        onChange={() => toggleOne(p.id)}
                        className="rounded border-slate-300 accent-[#1C1C1E] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        href={`/admin/crm/prospects/${p.id}`}
                        className="text-sm font-semibold text-slate-900 hover:underline truncate block max-w-[180px]"
                      >
                        {p.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-700 truncate">{p.contactName}</p>
                        <p className="text-xs text-slate-400 truncate">{p.contactEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <LeadScoreBadge score={p.leadScore} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StageBadge stage={p.stage} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700 tabular-nums">
                      {p.dealValue ? formatPence(p.dealValue) : "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs text-slate-500 capitalize">{p.source.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-400">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link href={`/admin/crm/prospects/${p.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </motion.button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ──────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
          <p className="font-sans text-xs text-slate-400">
            Showing {sorted.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-sans text-xs text-slate-500 px-2">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-slate-500"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <QuickAddProspectModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onCreated={(p) => setProspects((prev) => [p, ...prev])}
      />

      <ConfirmModal
        isOpen={bulkDeleteConfirm}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={confirmBulkDelete}
        title={`Delete ${selected.size} prospect${selected.size !== 1 ? "s" : ""}?`}
        message="This will permanently delete the selected prospects and cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}
