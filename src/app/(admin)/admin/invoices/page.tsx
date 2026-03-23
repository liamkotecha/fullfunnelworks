"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Receipt,
  Eye,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
} from "lucide-react";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { formatPence } from "@/lib/format";
import type { InvoiceDTO, InvoiceStatus } from "@/types";
import { INVOICE_STATUS_META } from "@/types";
import { useRouter } from "next/navigation";

const PAGE_SIZES = [10, 25, 50];

type StatusFilterValue = "all" | InvoiceStatus;

const STATUS_FILTERS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "sent", label: "Unpaid" },
  { value: "paid", label: "Paid" },
  { value: "draft", label: "Draft" },
  { value: "overdue", label: "Overdue" },
];

/* ── Stat cards config ─────────────────────────────────────── */
const STAT_CARDS: {
  key: string;
  label: string;
  badgeVariant: BadgeVariant;
  filter: StatusFilterValue;
}[] = [
  { key: "paid", label: "Paid", badgeVariant: "success", filter: "paid" },
  { key: "sent", label: "Unpaid", badgeVariant: "warning", filter: "sent" },
  { key: "draft", label: "Draft", badgeVariant: "neutral", filter: "draft" },
  { key: "overdue", label: "Overdue", badgeVariant: "error", filter: "overdue" },
];

/* ── Sort helpers ──────────────────────────────────────────── */
type SortKey = "title" | "client" | "created" | "dueDate" | "amount" | "status";
type SortDir = "asc" | "desc";

function compare(a: InvoiceDTO, b: InvoiceDTO, key: SortKey): number {
  switch (key) {
    case "title":
      return a.title.localeCompare(b.title);
    case "client":
      return (a.clientName ?? "").localeCompare(b.clientName ?? "");
    case "created":
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    case "dueDate": {
      const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
      const db = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      return da - db;
    }
    case "amount":
      return a.amountPence - b.amountPence;
    case "status":
      return a.status.localeCompare(b.status);
    default:
      return 0;
  }
}

/* ── Row action menu ───────────────────────────────────────── */
function RowActions({ inv, onView }: { inv: InvoiceDTO; onView: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black/[0.08] py-1"
          >
            <button
              onClick={(e) => { e.stopPropagation(); onView(); setOpen(false); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Eye className="w-4 h-4" /> View invoice
            </button>
            {inv.stripePaymentUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); window.open(inv.stripePaymentUrl!, "_blank"); setOpen(false); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="w-4 h-4" /> Open Stripe link
              </button>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}

/* ── Sortable header ───────────────────────────────────────── */
function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = currentKey === sortKey;
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors",
        className
      )}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <svg className={cn("w-3 h-3", active ? "text-slate-700" : "text-slate-300")} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d={active && currentDir === "desc" ? "M3 4.5L6 7.5L9 4.5" : "M3 7.5L6 4.5L9 7.5"} />
        </svg>
      </span>
    </th>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<InvoiceDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/invoices")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setInvoices(d.data ?? []);
      })
      .catch(() => {
        setInvoices([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Stats per status ────────────────────────────────────── */
  const statsByStatus = useMemo(() => {
    const m: Record<string, { amount: number; count: number }> = {};
    for (const s of ["paid", "sent", "draft", "overdue", "void"]) {
      m[s] = { amount: 0, count: 0 };
    }
    for (const inv of invoices) {
      const b = m[inv.status];
      if (b) { b.amount += inv.amountPence; b.count += 1; }
    }
    return m;
  }, [invoices]);

  /* ── Filtering ───────────────────────────────────────────── */
  const filtered = useMemo(() => {
    let list = invoices;
    if (statusFilter !== "all") {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.clientName ?? "").toLowerCase().includes(q) ||
          i.amountFormatted.toLowerCase().includes(q) ||
          i.status.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, statusFilter, search]);

  /* ── Sorting ─────────────────────────────────────────────── */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => dir * compare(a, b, sortKey));
  }, [filtered, sortKey, sortDir]);

  /* ── Pagination ──────────────────────────────────────────── */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);
  const rangeStart = sorted.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, sorted.length);

  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  /* ── Sort handler ────────────────────────────────────────── */
  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ── Select helpers ──────────────────────────────────────── */
  const allOnPageSelected = paged.length > 0 && paged.every((i) => selected.has(i.id));
  const toggleAll = () => {
    if (allOnPageSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((i) => next.delete(i.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        paged.forEach((i) => next.add(i.id));
        return next;
      });
    }
  };
  const toggleRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  /* ── First-use empty state ─────────────────────────────── */
  if (!loading && invoices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage client invoices</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="rounded-lg bg-white ring-1 ring-black/[0.06] p-12 sm:p-16 text-center"
        >
          <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
            <Receipt className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No invoices yet</h2>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            Invoices will appear here once they&apos;re created for your clients.
            You can create invoices from any client&apos;s detail page.
          </p>
          <button
            onClick={() => router.push("/admin/clients")}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-[#141414]/90 transition-colors"
          >
            Go to Clients
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {invoices.length} total invoices
        </p>
      </div>

      {/* ── Summary cards ─────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {STAT_CARDS.map((card) => {
          const s = statsByStatus[card.key] ?? { amount: 0, count: 0 };
          return (
            <button
              key={card.key}
              onClick={() => setStatusFilter(statusFilter === card.filter ? "all" : card.filter)}
              className={cn(
                "rounded-lg bg-white ring-1 ring-black/[0.06] px-5 py-4 text-left transition-all hover:ring-black/[0.12]",
                statusFilter === card.filter && "ring-2 ring-slate-900/20"
              )}
            >
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border",
                card.badgeVariant === "success" && "bg-emerald-50 text-emerald-700 border-emerald-200",
                card.badgeVariant === "warning" && "bg-amber-50 text-amber-700 border-amber-200",
                card.badgeVariant === "neutral" && "bg-gray-100 text-gray-700 border-gray-200",
                card.badgeVariant === "error" && "bg-red-50 text-red-700 border-red-200",
              )}>{card.label}</span>
              <p className="text-2xl font-bold text-slate-900 mt-2.5 tabular-nums">
                {formatPence(s.amount)}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {s.count} invoice{s.count !== 1 ? "s" : ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Toolbar ───────────────────────────────────────── */}
      <div className="bg-white rounded-lg ring-1 ring-black/[0.06]">
        {/* Search + actions row */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-100">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search invoices..."
              className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* Status radio row */}
        <div className="flex items-center gap-1 px-4 py-2.5 border-b border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-2">Show only:</span>
          {STATUS_FILTERS.map((f) => (
            <label
              key={f.value}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm cursor-pointer transition-colors",
                statusFilter === f.value
                  ? "bg-[#141414] text-white font-medium"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <input
                type="radio"
                name="statusFilter"
                value={f.value}
                checked={statusFilter === f.value}
                onChange={() => setStatusFilter(f.value)}
                className="sr-only"
              />
              {f.label}
            </label>
          ))}
        </div>

        {/* ── Table ─────────────────────────────────────── */}
        {loading ? (
          <div className="p-4">
            <SkeletonTable rows={8} cols={7} />
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[#141414]/5 flex items-center justify-center mx-auto">
              <Receipt className="w-7 h-7 text-slate-900/30" />
            </div>
            <p className="font-medium text-slate-600">
              {search || statusFilter !== "all"
                ? "No invoices match your filters"
                : "No invoices yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleAll}
                      className="w-4 h-4 rounded border-slate-300 text-[#141414] focus:ring-slate-200 cursor-pointer"
                    />
                  </th>
                  <SortHeader label="Title" sortKey="title" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Client" sortKey="client" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden md:table-cell" />
                  <SortHeader label="Created" sortKey="created" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <SortHeader label="Due date" sortKey="dueDate" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="hidden lg:table-cell" />
                  <SortHeader label="Amount" sortKey="amount" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} className="text-right" />
                  <SortHeader label="Status" sortKey="status" currentKey={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {paged.map((inv, idx) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15, delay: idx * 0.02 }}
                    onClick={() => router.push(`/admin/invoices/${inv.id}`)}
                    className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer transition-colors group"
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={selected.has(inv.id)}
                        onChange={(e) => { e.stopPropagation(); toggleRow(inv.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded border-slate-300 text-[#141414] focus:ring-slate-200 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-medium text-slate-900 group-hover:text-slate-600 transition-colors">
                        {inv.title}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-slate-600">{inv.clientName ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-500 tabular-nums">
                        {formatDate(inv.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <span className="text-slate-500 tabular-nums">
                        {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-semibold text-slate-900 tabular-nums">
                        {inv.amountFormatted}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={INVOICE_STATUS_META[inv.status].badge as BadgeVariant} dot>
                        {INVOICE_STATUS_META[inv.status].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <RowActions
                        inv={inv}
                        onView={() => router.push(`/admin/invoices/${inv.id}`)}
                      />
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination footer ───────────────────────── */}
        {sorted.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <label className="text-xs text-slate-500">Rows per page</label>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-2 py-1.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <span className="text-xs text-slate-500 tabular-nums">
                {rangeStart}–{rangeEnd} of {sorted.length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[
                { icon: ChevronsLeft, label: "First", onClick: () => setPage(1), disabled: safePage <= 1 },
                { icon: ChevronLeft, label: "Previous", onClick: () => setPage((p) => Math.max(1, p - 1)), disabled: safePage <= 1 },
              ].map(({ icon: Icon, label, onClick, disabled }) => (
                <button key={label} onClick={onClick} disabled={disabled} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={label}>
                  <Icon className="w-4 h-4 text-slate-600" />
                </button>
              ))}
              <span className="text-xs text-slate-600 tabular-nums px-2">
                Page {safePage} of {totalPages}
              </span>
              {[
                { icon: ChevronRight, label: "Next", onClick: () => setPage((p) => Math.min(totalPages, p + 1)), disabled: safePage >= totalPages },
                { icon: ChevronsRight, label: "Last", onClick: () => setPage(totalPages), disabled: safePage >= totalPages },
              ].map(({ icon: Icon, label, onClick, disabled }) => (
                <button key={label} onClick={onClick} disabled={disabled} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors" aria-label={label}>
                  <Icon className="w-4 h-4 text-slate-600" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
