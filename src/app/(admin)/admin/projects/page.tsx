"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, FolderOpen, Filter, Eye, Pencil, LayoutGrid, List, User, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { DataTable, Column, ActionItem } from "@/components/ui/DataTable";
import { formatDate } from "@/lib/utils";
import { ProjectDTO, PROJECT_STATUS_META, ProjectStatus, StalenessStatus } from "@/types";
import { cn } from "@/lib/utils";

/* ── helpers ────────────────────────────────────────────────── */
function getClientName(p: ProjectDTO): string {
  if (typeof p.clientId === "object" && p.clientId?.businessName) return p.clientId.businessName;
  if (p.clientName) return p.clientName;
  return "—";
}

function getClientId(p: ProjectDTO): string {
  if (typeof p.clientId === "object" && p.clientId?._id) return p.clientId._id;
  if (typeof p.clientId === "string") return p.clientId;
  return "";
}

function getConsultantName(p: ProjectDTO): string {
  return p.assignedTo?.name ?? "Unassigned";
}

/* ── Kanban column config ──────────────────────────────────── */
const KANBAN_COLS: {
  id: ProjectStatus;
  label: string;
  dotCls: string;
  headerCls: string;
}[] = [
  { id: "not_started",  label: "Not Started",  dotCls: "bg-slate-300",  headerCls: "border-slate-200" },
  { id: "in_progress",  label: "In Progress",  dotCls: "bg-amber-400",  headerCls: "border-amber-300" },
  { id: "blocked",      label: "Blocked",       dotCls: "bg-red-400",    headerCls: "border-red-300" },
  { id: "completed",    label: "Completed",     dotCls: "bg-emerald-400",headerCls: "border-emerald-300" },
];

/* ── Kanban card ───────────────────────────────────────────── */
function KanbanCard({ project, onClick }: { project: ProjectDTO; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-lg ring-1 ring-black/[0.06] p-4 cursor-pointer"
    >
      <div className="flex items-start gap-2 mb-1.5">
        {project.status === "blocked" && (
          <AlertTriangle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />
        )}
        <p className="text-sm font-medium text-slate-900 leading-snug flex-1">{project.title}</p>
      </div>
      <p className="text-xs font-medium text-slate-600 mb-1">{getClientName(project)}</p>
      {project.description && (
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-2">
          {project.description}
        </p>
      )}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-slate-100 flex items-center justify-center">
            <User className="w-2.5 h-2.5 text-slate-400" />
          </div>
          <span className="text-[10px] text-slate-400">{getConsultantName(project)}</span>
        </div>
        {project.dueDate && (
          <p className="text-[10px] text-slate-300 tabular-nums">
            Due {formatDate(project.dueDate)}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/* ── Kanban board ──────────────────────────────────────────── */
function KanbanBoard({ projects, onCardClick }: { projects: ProjectDTO[]; onCardClick: (p: ProjectDTO) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-h-[60vh]">
      {KANBAN_COLS.map((col) => {
        const cards = projects.filter((p) => p.status === col.id);
        return (
          <div key={col.id} className="flex flex-col">
            {/* Column header */}
            <div className={cn("flex items-center gap-2 pb-3 border-b-2 mb-3", col.headerCls)}>
              <div className={cn("w-2 h-2 rounded-full", col.dotCls)} />
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {col.label}
              </p>
              <span className="ml-auto text-xs text-slate-400 tabular-nums font-medium">
                {cards.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-3 bg-slate-50/50 rounded-lg p-3 min-h-[120px]">
              {cards.length === 0 ? (
                <div className="flex items-center justify-center h-20">
                  <p className="text-xs text-slate-300">Empty</p>
                </div>
              ) : (
                cards.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.2 }}
                  >
                    <KanbanCard project={p} onClick={() => onCardClick(p)} />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto py-12 text-center text-slate-400">Loading…</div>}>
      <ProjectsContent />
    </Suspense>
  );
}

function ProjectsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") as ProjectStatus | null;

  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all" | "stale">(initialStatus ?? "all");
  const [view, setView] = useState<"table" | "board">("table");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    const params = statusFilter !== "all" && statusFilter !== "stale" ? `?status=${statusFilter}` : "";
    fetch(`/api/projects${params}`)
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.data ?? []);
        setLoading(false);
      });
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const blocked = projects.filter((p) => p.status === "blocked");

  const filtered = (statusFilter === "stale"
    ? projects.filter((p) => p.staleness === "stalled" || p.staleness === "at_risk")
    : projects
  ).filter((p) =>
    !search || p.title?.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projects</h1>
          <div className="flex items-center gap-3 mt-0.5">
            <p className="text-sm text-slate-500">{projects.length} total</p>
            {!loading && blocked.length > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5">
                <AlertTriangle className="w-3 h-3" />
                {blocked.length} blocked
              </span>
            )}
          </div>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 bg-[#141414] rounded-lg p-1.5">
          <button
            onClick={() => setView("table")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
              view === "table" ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
            )}
          >
            <List className="w-3.5 h-3.5" />
            Table
          </button>
          <button
            onClick={() => setView("board")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150",
              view === "board" ? "bg-white/15 text-white" : "text-white/55 hover:text-white"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Board
          </button>
        </div>
      </div>

      {/* Blocked Banner */}
      <AnimatePresence>
        {blocked.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">
                {blocked.length} project{blocked.length > 1 ? "s" : ""} blocked
              </p>
              <p className="text-xs text-red-500">These require immediate attention.</p>
            </div>
            <Button
              size="sm"
              variant="danger"
              onClick={() => setStatusFilter("blocked")}
            >
              View Blocked
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search projects…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200"
          />
        </div>
        {view === "table" && (
          <>
            <Filter className="w-4 h-4 text-slate-400" />
            <div className="w-40">
              <Select
                options={[
                  { value: "all", label: "All statuses" },
                  { value: "not_started", label: "Not started" },
                  { value: "in_progress", label: "In progress" },
                  { value: "blocked", label: "Blocked" },
                  { value: "completed", label: "Completed" },
                  { value: "stale", label: "Stale (stalled + at risk)" },
                ]}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all" | "stale")}
              />
            </div>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="text-xs text-slate-400 hover:text-slate-900 transition-colors"
              >
                Clear filter
              </button>
            )}
          </>
        )}
      </div>

      {/* Table / Board */}
      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : view === "board" ? (
        <KanbanBoard projects={filtered} onCardClick={(p) => router.push(`/admin/projects/${p.id}`)} />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16 space-y-3"
        >
          <div className="w-14 h-14 rounded-full bg-[#141414]/5 flex items-center justify-center mx-auto">
            <FolderOpen className="w-7 h-7 text-slate-900/30" />
          </div>
          <p className="font-medium text-slate-600">
            {statusFilter !== "all" ? `No ${statusFilter.replace("_", " ")} projects` : "No projects yet"}
          </p>
        </motion.div>
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(p) => p.id}
          onRowClick={(p) => router.push(`/admin/projects/${p.id}`)}
          columns={[
            {
              id: "project",
              header: "Project",
              sortable: true,
              sortValue: (p) => p.title.toLowerCase(),
              accessor: (p) => (
                <div className="flex items-center gap-2">
                  {p.status === "blocked" && (
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900 group-hover:text-slate-600 transition-colors">
                      {p.title}
                    </p>
                    {p.description && (
                      <p className="text-xs text-slate-400 truncate max-w-xs">{p.description}</p>
                    )}
                  </div>
                </div>
              ),
            },
            {
              id: "client",
              header: "Client",
              sortable: true,
              sortValue: (p) => getClientName(p).toLowerCase(),
              accessor: (p) => {
                const name = getClientName(p);
                const cId = getClientId(p);
                return (
                  <button
                    onClick={(e) => { e.stopPropagation(); if (cId) router.push(`/admin/clients/${cId}`); }}
                    className="text-sm font-medium text-slate-700 hover:text-slate-900 hover:underline underline-offset-2 transition-colors text-left"
                  >
                    {name}
                  </button>
                );
              },
            },
            {
              id: "consultant",
              header: "Consultant",
              sortable: true,
              sortValue: (p) => getConsultantName(p).toLowerCase(),
              hideBelow: "md",
              accessor: (p) => {
                const name = getConsultantName(p);
                return (
                  <div className="flex items-center gap-1.5">
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                      name === "Unassigned" ? "bg-slate-100 text-slate-400" : "bg-[#141414] text-white"
                    )}>
                      {name === "Unassigned" ? "?" : name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn("text-sm", name === "Unassigned" ? "text-slate-400 italic" : "text-slate-600")}>
                      {name}
                    </span>
                  </div>
                );
              },
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              sortValue: (p) => p.status,
              accessor: (p) => {
                const meta = PROJECT_STATUS_META[p.status];
                return (
                  <Badge variant={meta.badge as BadgeVariant} dot>
                    {meta.label}
                  </Badge>
                );
              },
            },
            {
              id: "staleness",
              header: "Staleness",
              sortable: true,
              sortValue: (p) => p.staleness ?? "active",
              accessor: (p) => {
                if (p.staleness === "at_risk") return <Badge variant="error">At risk</Badge>;
                if (p.staleness === "stalled") return <Badge variant="warning">Stalled</Badge>;
                if (p.staleness === "terminated") return <Badge variant="neutral">Terminated</Badge>;
                return null;
              },
            },
            {
              id: "due",
              header: "Due",
              sortable: true,
              sortValue: (p) => p.dueDate ? new Date(p.dueDate) : new Date(0),
              hideBelow: "md",
              accessor: (p) => (
                <span className="text-slate-500">{p.dueDate ? formatDate(p.dueDate) : "—"}</span>
              ),
            },

          ] satisfies Column<ProjectDTO>[]}
          actions={[
            {
              label: "View details",
              icon: <Eye className="w-4 h-4" />,
              onClick: (p) => router.push(`/admin/projects/${p.id}`),
            },
            {
              label: "Edit",
              icon: <Pencil className="w-4 h-4" />,
              onClick: (p) => router.push(`/admin/projects/${p.id}`),
            },
          ] satisfies ActionItem<ProjectDTO>[]}
        />
      )}
    </div>
  );
}
