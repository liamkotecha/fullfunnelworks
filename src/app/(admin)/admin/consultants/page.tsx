"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  X,
  Check,
  ChevronDown,
  Briefcase,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultantDTO, MODULE_META, ModuleId } from "@/types";
import { useToast } from "@/components/notifications/ToastContext";

const AVAILABILITY_META: Record<
  "available" | "limited" | "unavailable",
  { label: string; dot: string; pill: string }
> = {
  available:   { label: "Available",   dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  limited:     { label: "Limited",     dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700" },
  unavailable: { label: "Unavailable", dot: "bg-slate-400",   pill: "bg-slate-100 text-slate-500" },
};

const ALL_MODULES = Object.entries(MODULE_META) as [ModuleId, { label: string }][];

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp  = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── capacity bar ─────────────────────────────────────────────── */
function CapacityBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 100 ? "bg-red-500" :
    clamped >= 80  ? "bg-amber-400" :
    "bg-emerald-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums">{clamped}%</span>
    </div>
  );
}

/* ── edit modal ───────────────────────────────────────────────── */
interface EditModalProps {
  consultant: ConsultantDTO;
  onClose: () => void;
  onSaved: (updated: ConsultantDTO) => void;
}

function EditModal({ consultant, onClose, onSaved }: EditModalProps) {
  const { error: toastError, success } = useToast();
  const [maxActive, setMaxActive] = useState(consultant.profile.maxActiveClients);
  const [availability, setAvailability] = useState<"available" | "limited" | "unavailable">(
    consultant.profile.availabilityStatus
  );
  const [selectedModules, setSelectedModules] = useState<Set<ModuleId>>(
    new Set(consultant.profile.allowedModules as ModuleId[])
  );
  const [specialism, setSpecialism] = useState("");
  const [specialisms, setSpecialisms] = useState<string[]>(consultant.profile.specialisms ?? []);
  const [saving, setSaving] = useState(false);

  const toggleModule = (id: ModuleId) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const addSpecialism = () => {
    const trimmed = specialism.trim();
    if (trimmed && !specialisms.includes(trimmed)) {
      setSpecialisms((prev) => [...prev, trimmed]);
    }
    setSpecialism("");
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/consultants/${consultant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxActiveClients: maxActive,
          availabilityStatus: availability,
          allowedModules: Array.from(selectedModules),
          specialisms,
        }),
      });
      if (!res.ok) throw new Error("Server error");
      const updated: ConsultantDTO = {
        ...consultant,
        profile: {
          ...consultant.profile,
          maxActiveClients: maxActive,
          availabilityStatus: availability,
          allowedModules: Array.from(selectedModules) as ModuleId[],
          specialisms,
        },
      };
      onSaved(updated);
      success("Consultant updated", `${consultant.name} profile saved`);
      onClose();
    } catch {
      toastError("Save failed", "Please try again");
    } finally {
      setSaving(false);
    }
  }, [maxActive, availability, selectedModules, specialisms, consultant, onSaved, onClose, success, toastError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.18 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-base text-slate-900">{consultant.name}</h2>
            <p className="text-xs text-slate-400">{consultant.email}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Capacity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Max active clients
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={20}
                value={maxActive}
                onChange={(e) => setMaxActive(Number(e.target.value))}
                className="flex-1 accent-sky-500"
              />
              <span className="text-lg font-bold text-slate-900 w-6 text-right tabular-nums">{maxActive}</span>
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Availability
            </label>
            <div className="flex gap-2">
              {(["available", "limited", "unavailable"] as const).map((s) => {
                const m = AVAILABILITY_META[s];
                return (
                  <button
                    key={s}
                    onClick={() => setAvailability(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      availability === s
                        ? "border-slate-900 bg-slate-900 text-white"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", availability === s ? "bg-white" : m.dot)} />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allowed modules */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Allowed modules ({selectedModules.size}/{ALL_MODULES.length})
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_MODULES.map(([id, meta]) => {
                const active = selectedModules.has(id);
                return (
                  <button
                    key={id}
                    onClick={() => toggleModule(id)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors text-left",
                      active
                        ? "border-sky-300 bg-sky-50 text-sky-800"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    )}
                  >
                    {active && <Check className="w-3 h-3 flex-shrink-0" />}
                    {!active && <span className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setSelectedModules(new Set(ALL_MODULES.map(([id]) => id)))}
                className="text-xs text-sky-600 hover:text-sky-700 underline underline-offset-2"
              >
                Select all
              </button>
              <span className="text-slate-300 text-xs">·</span>
              <button
                onClick={() => setSelectedModules(new Set())}
                className="text-xs text-slate-400 hover:text-slate-600 underline underline-offset-2"
              >
                Clear all
              </button>
            </div>
          </div>

          {/* Specialisms */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Specialisms
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {specialisms.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
                >
                  {s}
                  <button
                    onClick={() => setSpecialisms((prev) => prev.filter((x) => x !== s))}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={specialism}
                onChange={(e) => setSpecialism(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpecialism(); } }}
                placeholder="e.g. SaaS, Enterprise"
                className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400"
              />
              <button
                onClick={addSpecialism}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────────────── */
export default function ConsultantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: toastError } = useToast();
  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ConsultantDTO | null>(null);

  /* redirect non-admins */
  useEffect(() => {
    if (status === "loading") return;
    const role = (session?.user as { role?: string })?.role;
    if (role !== "admin") {
      router.replace("/admin/dashboard");
    }
  }, [session, status, router]);

  useEffect(() => {
    fetch("/api/admin/consultants")
      .then((r) => r.json())
      .then((d) => {
        setConsultants(d.data ?? []);
        setLoading(false);
      })
      .catch(() => {
        toastError("Couldn't load consultants", "Please refresh");
        setLoading(false);
      });
  }, []);

  const handleSaved = useCallback((updated: ConsultantDTO) => {
    setConsultants((prev) => prev.map((c) => c.id === updated.id ? updated : c));
  }, []);

  if (loading) {
    return (
      <div className="px-8 pt-8 pb-10 space-y-4">
        <div className="h-8 w-48 bg-slate-200/60 rounded-lg animate-pulse" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-200/40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {editing && (
          <EditModal
            consultant={editing}
            onClose={() => setEditing(null)}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <motion.div variants={stagger} initial="hidden" animate="show" className="px-8 pt-8 pb-10">
        {/* Header */}
        <motion.div variants={fadeUp} className="mb-6">
          <h1 className="font-bold text-2xl text-slate-900">Consultants</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Manage consultant capacity, availability and module access
          </p>
        </motion.div>

        {consultants.length === 0 ? (
          <motion.div variants={fadeUp} className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="font-semibold text-slate-700 mb-1">No consultants yet</p>
            <p className="text-sm text-slate-400">Consultants who register will appear here</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} className="bg-white rounded-xl ring-1 ring-black/[0.06] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Consultant", "Clients", "Capacity", "Availability", "Modules", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-wider first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {consultants.map((c) => {
                  const avail = AVAILABILITY_META[c.profile.availabilityStatus] ?? AVAILABILITY_META.available;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* Name / email */}
                      <td className="pl-5 pr-4 py-3.5">
                        <p className="font-medium text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.email}</p>
                      </td>

                      {/* Active / max */}
                      <td className="px-4 py-3.5 tabular-nums text-slate-700">
                        {c.profile.currentActiveClients}
                        <span className="text-slate-400">/{c.profile.maxActiveClients}</span>
                      </td>

                      {/* Capacity bar */}
                      <td className="px-4 py-3.5">
                        <CapacityBar pct={c.profile.capacityPercent} />
                      </td>

                      {/* Availability badge */}
                      <td className="px-4 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                            avail.pill
                          )}
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full", avail.dot)} />
                          {avail.label}
                        </span>
                      </td>

                      {/* Allowed module count */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700 tabular-nums">
                            {c.profile.allowedModules.length}
                            <span className="text-slate-400">/{ALL_MODULES.length}</span>
                          </span>
                        </div>
                      </td>

                      {/* Edit button */}
                      <td className="pr-5 pl-4 py-3.5 text-right">
                        <button
                          onClick={() => setEditing(c)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors ml-auto"
                        >
                          Edit <ChevronDown className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </>
  );
}
