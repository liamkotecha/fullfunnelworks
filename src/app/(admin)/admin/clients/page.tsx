"use client";
import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Users, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { DataTable, Column, ActionItem } from "@/components/ui/DataTable";
import { useToast } from "@/components/notifications/ToastContext";
import { formatDate } from "@/lib/utils";
import { ClientDTO, CLIENT_STATUS_META } from "@/types";
import { useRouter } from "next/navigation";

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ businessName: "", email: "" });
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();
  const router = useRouter();

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => { setClients(d.data ?? []); setLoading(false); });
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = clients.filter(
    (c) =>
      c.businessName.toLowerCase().includes(search.toLowerCase()) ||
      c.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.businessName || !form.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { data } = await res.json();
      success("Client created", `Invite sent to ${form.email}`);
      setShowModal(false);
      setForm({ businessName: "", email: "" });
      router.push(`/admin/clients/${data.id}/onboarding`);
    } catch (e) {
      toastError("Failed to create client", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Clients</h1>
          <p className="text-sm text-slate-500 mt-0.5">{clients.length} total</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setShowModal(true)}>
          New Client
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      {/* Table / List */}
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="card text-center py-16 space-y-3"
        >
          <div className="w-14 h-14 rounded-full bg-[#141414]/5 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-slate-900/30" />
          </div>
          <p className="font-medium text-slate-600">
            {search ? "No clients match your search" : "No clients yet"}
          </p>
          {!search && (
            <Button size="sm" variant="secondary" onClick={() => setShowModal(true)}>
              Add your first client
            </Button>
          )}
        </motion.div>
      ) : (
        <DataTable
          data={filtered}
          keyExtractor={(c) => c.id}
          onRowClick={(c) => router.push(`/admin/clients/${c.id}`)}
          columns={[
            {
              id: "business",
              header: "Business",
              sortable: true,
              sortValue: (c) => c.businessName.toLowerCase(),
              accessor: (c) => (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#141414] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {c.businessName[0].toUpperCase()}
                  </div>
                  <span className="font-medium text-slate-900 group-hover:text-slate-600 transition-colors">
                    {c.businessName}
                  </span>
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              sortValue: (c) => c.status,
              accessor: (c) => {
                const meta = CLIENT_STATUS_META[c.status];
                return (
                  <Badge variant={meta.badge as BadgeVariant} dot>
                    {meta.label}
                  </Badge>
                );
              },
            },
            {
              id: "added",
              header: "Added",
              sortable: true,
              sortValue: (c) => new Date(c.createdAt),
              hideBelow: "md",
              accessor: (c) => (
                <span className="text-slate-500">{formatDate(c.createdAt)}</span>
              ),
            },
            {
              id: "onboarded",
              header: "Onboarded",
              sortable: true,
              sortValue: (c) => c.onboardingCompletedAt ? new Date(c.onboardingCompletedAt) : new Date(0),
              hideBelow: "lg",
              accessor: (c) => (
                <span className="text-slate-500">
                  {c.onboardingCompletedAt ? formatDate(c.onboardingCompletedAt) : "—"}
                </span>
              ),
            },
            {
              id: "progress",
              header: "Framework",
              sortable: true,
              sortValue: (c) => c.overallProgress ?? 0,
              hideBelow: "lg",
              accessor: (c) => {
                const pct = c.overallProgress ?? 0;
                return (
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#141414] transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs tabular-nums text-slate-500 w-8 text-right">{pct}%</span>
                  </div>
                );
              },
            },
          ] satisfies Column<ClientDTO>[]}
          actions={[
            {
              label: "View details",
              icon: <Eye className="w-4 h-4" />,
              onClick: (c) => router.push(`/admin/clients/${c.id}`),
            },
            {
              label: "Edit",
              icon: <Pencil className="w-4 h-4" />,
              onClick: (c) => router.push(`/admin/clients/${c.id}`),
            },
          ] satisfies ActionItem<ClientDTO>[]}
        />
      )}

      {/* New Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Client"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button isLoading={saving} onClick={handleCreate} disabled={!form.businessName || !form.email}>
              Create & Invite
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Business name"
            value={form.businessName}
            onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))}
            placeholder="Acme Ltd"
          />
          <Input
            label="Client email address"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="owner@acme.com"
            hint="An onboarding invite will be sent to this address"
          />
        </div>
      </Modal>
    </div>
  );
}
