"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConsultantDTO, MODULE_META, ModuleId } from "@/types";
import { useToast } from "@/components/notifications/ToastContext";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

/* ── plan badge ─────────────────────────────────────────────── */
function PlanBadge({ name }: { name?: string | null }) {
  if (!name) return <span className="text-xs text-slate-400">No plan</span>;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
      {name}
    </span>
  );
}

/* ── subscription status badge ──────────────────────────────── */
const SUB_STATUS_META: Record<string, { label: string; cls: string }> = {
  active:   { label: "Active",   cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  trialing: { label: "Trialing", cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  past_due: { label: "Past due", cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  canceled: { label: "Canceled", cls: "bg-slate-100 text-slate-500 ring-slate-200" },
  paused:   { label: "Paused",   cls: "bg-slate-100 text-slate-500 ring-slate-200" },
};

function SubBadge({ status }: { status?: string | null }) {
  if (!status) return <span className="text-xs text-slate-400">—</span>;
  const meta = SUB_STATUS_META[status] ?? { label: status, cls: "bg-slate-50 text-slate-600 ring-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ring-1", meta.cls)}>
      {meta.label}
    </span>
  );
}

/* ── capacity bar ────────────────────────────────────────────── */
function CapacityBar({ used, max }: { used: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
  const colour = pct >= 90 ? "bg-rose-400" : pct >= 70 ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-slate-100 overflow-hidden">
        <div className={cn("h-full rounded-full", colour)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-500">{used}/{max}</span>
    </div>
  );
}

/* ── main page ───────────────────────────────────────────────── */
export default function ConsultantsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error: toastError } = useToast();

  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && (session?.user as { role?: string })?.role === "admin") {
      fetch("/api/admin/consultants")
        .then((r) => r.json())
        .then((data) => {
          setConsultants(data.data ?? []);
          setLoading(false);
        })
        .catch(() => {
          toastError("Failed to load consultants");
          setLoading(false);
        });
    }
  }, [status, session]);

  const filtered = consultants.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      ((c.profile?.specialisms ?? []) as string[]).some((s) => s.toLowerCase().includes(q))
    );
  });

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading consultants…
      </div>
    );
  }

  return (
    <motion.div className="space-y-6" variants={stagger} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Consultants</h1>
          <p className="text-sm text-slate-500 mt-0.5">{consultants.length} total</p>
        </div>
        <button
          onClick={() => router.push("/admin/consultants/invite")}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
        >
          + Invite consultant
        </button>
      </motion.div>

      {/* Search */}
      <motion.div variants={fadeUp}>
        <input
          type="text"
          placeholder="Search by name, email or specialism…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
        />
      </motion.div>

      {/* Table */}
      {filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400">
            {search ? "No consultants match your search." : "No consultants yet."}
          </p>
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="rounded-xl bg-white ring-1 ring-black/[0.06] overflow-hidden">
          <table className="min-w-full divide-y divide-slate-100">
            <thead>
              <tr className="bg-slate-50/70">
                <th className="pl-5 pr-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Consultant</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Plan</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Subscription</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Capacity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide">Modules</th>
                <th className="pr-5 pl-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((c) => {
                const profile = (c.profile ?? {}) as unknown as Record<string, unknown>;
                const planObj = profile.plan as Record<string, unknown> | undefined;
                const planName = (profile.planName as string | undefined) ?? (planObj?.name as string | undefined);
                const subStatus = profile.subscriptionStatus as string | undefined;
                const activeClients = (profile.activeClientCount as number | undefined) ?? 0;
                const maxClients = (planObj?.maxActiveClients as number | undefined) ?? 0;
                const modules = ((profile.allowedModules as ModuleId[] | undefined) ?? []);

                return (
                  <tr
                    key={c.id}
                    onClick={() => router.push(`/admin/consultants/${c.id}`)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <td className="pl-5 pr-4 py-3.5">
                      <div className="font-medium text-sm text-slate-900">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <PlanBadge name={planName} />
                    </td>
                    <td className="px-4 py-3.5">
                      <SubBadge status={subStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      {maxClients > 0 ? (
                        <CapacityBar used={activeClients} max={maxClients} />
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {modules.length === 0 ? (
                          <span className="text-xs text-slate-400">—</span>
                        ) : (
                          modules.slice(0, 3).map((mod) => (
                            <span key={mod} className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              {MODULE_META[mod]?.label ?? mod}
                            </span>
                          ))
                        )}
                        {modules.length > 3 && (
                          <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500">
                            +{modules.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="pr-5 pl-4 py-3.5 text-right">
                      <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </motion.div>
  );
}
