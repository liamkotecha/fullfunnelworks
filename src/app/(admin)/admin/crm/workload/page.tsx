"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications/ToastContext";
import type { ConsultantDTO, ProspectDTO, ClientDTO } from "@/types";

/* ── Capacity Bar ───────────────────────────────────────────── */
function CapacityBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const colour = pct <= 60 ? "bg-emerald-500" : pct <= 85 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">
        {current}/{max}
      </span>
    </div>
  );
}

/* ── Reassign Popover ───────────────────────────────────────── */
function ReassignPopover({
  consultants,
  currentConsultantId,
  onSelect,
  onClose,
}: {
  consultants: ConsultantDTO[];
  currentConsultantId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -4 }}
      className="absolute right-0 top-full mt-1 z-20 w-64 bg-white rounded-lg shadow-lg ring-1 ring-black/10 p-2"
    >
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider px-2 pb-1">
        Reassign to
      </p>
      {consultants
        .filter((c) => c.id !== currentConsultantId)
        .map((c) => (
          <button
            key={c.id}
            onClick={() => { onSelect(c.id); onClose(); }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-slate-50 transition-colors text-left"
          >
            <span className="text-sm text-slate-700">{c.name}</span>
            <span className="text-[10px] text-slate-400 tabular-nums">
              {c.profile.currentActiveClients}/{c.profile.maxActiveClients} clients
            </span>
          </button>
        ))}
      {consultants.filter((c) => c.id !== currentConsultantId).length === 0 && (
        <p className="text-xs text-slate-400 px-2 py-1">No other consultants</p>
      )}
    </motion.div>
  );
}

/* ── Time Ago ───────────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/* ── Page ───────────────────────────────────────────────────── */
export default function WorkloadPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === "loading") return;
    if ((session?.user as { role?: string })?.role !== "admin") router.replace("/admin/dashboard");
  }, [session, status, router]);

  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [prospects, setProspects] = useState<ProspectDTO[]>([]);
  const [reassignPopover, setReassignPopover] = useState<{ type: "client" | "prospect"; id: string; consultantId: string } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [cRes, clRes, prRes] = await Promise.all([
        fetch("/api/admin/consultants"),
        fetch("/api/clients"),
        fetch("/api/prospects?stage=mql,sql,discovery,proposal,negotiating"),
      ]);
      if (cRes.ok) {
        const { data } = await cRes.json();
        setConsultants(data ?? []);
      }
      if (clRes.ok) {
        const { data } = await clRes.json();
        setClients(data ?? []);
      }
      if (prRes.ok) {
        const { data } = await prRes.json();
        setProspects(data ?? []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleReassign = async (type: "client" | "prospect", itemId: string, newConsultantId: string) => {
    try {
      const url = type === "client" ? `/api/clients/${itemId}` : `/api/prospects/${itemId}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedConsultant: newConsultantId }),
      });
      if (res.ok) {
        success("Reassigned successfully");
        setReassignPopover(null);
        fetchData();
      } else {
        toastError("Reassignment failed", "Please try again.");
      }
    } catch {
      toastError("Reassignment failed", "Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-bold text-2xl text-slate-900">Consultant Workload</h1>
          <p className="text-sm text-slate-400 mt-1">Active clients and assigned prospects per consultant</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 bg-white ring-1 ring-black/[0.06] hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {consultants.length === 0 ? (
        <div className="text-center py-16">
          <UserCheck className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No consultants found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {consultants.map((c) => {
            const myClients = clients.filter(
              (cl) =>
                cl.assignedConsultant &&
                typeof cl.assignedConsultant === "object" &&
                (cl.assignedConsultant as { _id: string })._id === c.id
            );
            const myProspects = prospects.filter(
              (p) => p.assignedConsultant && p.assignedConsultant.id === c.id
            );

            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg ring-1 ring-black/[0.06] p-5"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-800">{c.name}</h3>
                  <div className="text-xs text-slate-400">
                    {c.profile.specialisms.length > 0 && c.profile.specialisms.join(", ")}
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1">
                    <CapacityBar
                      current={c.profile.currentActiveClients}
                      max={c.profile.maxActiveClients}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {myClients.length} active client{myClients.length !== 1 ? "s" : ""}
                    {" · "}
                    {myProspects.length} prospect{myProspects.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Active clients */}
                {myClients.length > 0 && (
                  <div className="mb-3">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                      Active clients
                    </p>
                    <div className="space-y-1">
                      {myClients.map((cl) => (
                        <div key={cl.id} className="flex items-center justify-between py-1 group">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700">{cl.businessName}</span>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                cl.status === "active"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-amber-50 text-amber-700"
                              )}
                            >
                              {cl.status === "active" ? "Active" : "Onboarding"}
                            </span>
                            {cl.createdAt && (
                              <span className="text-[10px] text-slate-300">{timeAgo(cl.createdAt)}</span>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setReassignPopover(
                                  reassignPopover?.id === cl.id
                                    ? null
                                    : { type: "client", id: cl.id, consultantId: c.id }
                                )
                              }
                              className="text-[10px] text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Reassign
                            </button>
                            <AnimatePresence>
                              {reassignPopover?.id === cl.id && (
                                <ReassignPopover
                                  consultants={consultants}
                                  currentConsultantId={c.id}
                                  onSelect={(newId) => handleReassign("client", cl.id, newId)}
                                  onClose={() => setReassignPopover(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned prospects */}
                {myProspects.length > 0 && (
                  <div>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mb-1.5">
                      Assigned prospects
                    </p>
                    <div className="space-y-1">
                      {myProspects.map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1 group">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700">{p.businessName}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 uppercase">
                              {p.stage}
                            </span>
                            <span className="text-[10px] text-slate-400">Score: {p.leadScore}</span>
                          </div>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setReassignPopover(
                                  reassignPopover?.id === p.id
                                    ? null
                                    : { type: "prospect", id: p.id, consultantId: c.id }
                                )
                              }
                              className="text-[10px] text-slate-400 hover:text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Reassign
                            </button>
                            <AnimatePresence>
                              {reassignPopover?.id === p.id && (
                                <ReassignPopover
                                  consultants={consultants}
                                  currentConsultantId={c.id}
                                  onSelect={(newId) => handleReassign("prospect", p.id, newId)}
                                  onClose={() => setReassignPopover(null)}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {myClients.length === 0 && myProspects.length === 0 && (
                  <p className="text-xs text-slate-400">No active clients or prospects assigned</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
