"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Edit2, Plus, Trash2, FolderOpen, AlertTriangle, Globe, Phone, Mail, MapPin, Briefcase, User, Users, UserPlus, CheckCircle2, Clock, ToggleLeft, ToggleRight, X, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { Input, Textarea, Select } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import { ActiveModulesCard } from "@/components/admin/ActiveModulesCard";
import { formatDate, formatDateTime } from "@/lib/utils";
import { ClientDTO, ProjectDTO, CLIENT_STATUS_META, PROJECT_STATUS_META, ClientStatus, ModuleId } from "@/types";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const { success, error: toastError } = useToast();

  const [client, setClient] = useState<ClientDTO | null>(null);
  const [projects, setProjects] = useState<ProjectDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [allowedModules, setAllowedModules] = useState<ModuleId[] | undefined>(undefined);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [projectModal, setProjectModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    businessName: "",
    status: "" as ClientStatus,
    notes: "",
    contactName: "",
    jobTitle: "",
    contactEmail: "",
    phone: "",
    invoicingEmail: "",
    website: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    postcode: "",
    country: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [projForm, setProjForm] = useState({ title: "", description: "", dueDate: "" });

  // Team state
  const [teamMode, setTeamMode] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Array<{
    userId: string; name: string; email: string; role: string;
    invitedAt: string | null; submittedAt: string | null; isComplete: boolean;
  }>>([]);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [inviteModal, setInviteModal] = useState(false);
  const [removeModal, setRemoveModal] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({ name: "", email: "", role: "" });
  const [inviting, setInviting] = useState(false);

  // Download report state
  const [downloadModal, setDownloadModal] = useState(false);
  const [downloadIncludeNotes, setDownloadIncludeNotes] = useState(true);
  const [downloadIncludeFinancial, setDownloadIncludeFinancial] = useState(true);

  useEffect(() => {
    const fetches: Promise<unknown>[] = [
      fetch(`/api/clients/${id}`).then((r) => r.json()),
      fetch(`/api/projects?clientId=${id}`).then((r) => r.json()),
      fetch(`/api/team/${id}`).then((r) => r.json()),
    ];
    if (role === "consultant") {
      fetches.push(fetch("/api/me/profile").then((r) => r.json()));
    }

    Promise.all(fetches).then((results) => {
      const [c, p, t, profileRes] = results as [
        { data: ClientDTO },
        { data: ProjectDTO[] },
        { teamMode: boolean; members: typeof teamMembers; allSubmitted: boolean },
        { allowedModules?: ModuleId[] } | undefined,
      ];
      if (role === "consultant" && profileRes?.allowedModules) {
        setAllowedModules(profileRes.allowedModules);
      }
      setClient(c.data);
      setForm({
        businessName:   c.data?.businessName   ?? "",
        status:         c.data?.status,
        notes:          c.data?.notes          ?? "",
        contactName:    c.data?.contactName    ?? "",
        jobTitle:       c.data?.jobTitle       ?? "",
        contactEmail:   c.data?.contactEmail   ?? "",
        phone:          c.data?.phone          ?? "",
        invoicingEmail: c.data?.invoicingEmail ?? "",
        website:        c.data?.website        ?? "",
        addressLine1:   c.data?.addressLine1   ?? "",
        addressLine2:   c.data?.addressLine2   ?? "",
        city:           c.data?.city           ?? "",
        postcode:       c.data?.postcode       ?? "",
        country:        c.data?.country        ?? "",
      });
      setProjects(p.data ?? []);
      setTeamMode(t.teamMode ?? false);
      setTeamMembers(t.members ?? []);
      setAllSubmitted(t.allSubmitted ?? false);
      setLoading(false);
    });
  }, [id, role]);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!form.businessName.trim()) errs.businessName = "Company name is required.";
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail))
      errs.contactEmail = "Enter a valid email address.";
    if (form.invoicingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.invoicingEmail))
      errs.invoicingEmail = "Enter a valid email address.";
    if (form.website && !/^(https?:\/\/)?([\w-]+\.)+[\w-]{2,}/.test(form.website))
      errs.website = "Enter a valid URL.";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { data } = await res.json();
      setClient(data);
      setEditModal(false);
      success("Client updated", "Changes saved successfully.");
    } catch (e) {
      toastError("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error);
      success("Client deleted");
      router.push("/admin/clients");
    } catch (e) {
      toastError("Delete failed", (e as Error).message);
    }
  };

  const handleAddProject = async () => {
    if (!projForm.title) return;
    setSaving(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...projForm, clientId: id }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { data } = await res.json();
      setProjects((prev) => [data, ...prev]);
      setProjectModal(false);
      setProjForm({ title: "", description: "", dueDate: "" });
      success("Project created");
    } catch (e) {
      toastError("Failed to create project", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleTeamMode = async () => {
    try {
      // Team mode is managed through the IntakeResponse.
      // If turning off and no members, just set it. If turning on, it's set via invites.
      // For toggle, we do a simple PATCH to the team endpoint
      const newMode = !teamMode;
      const res = await fetch(`/api/team/${id}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error("Failed to check team status");
      setTeamMode(newMode);
    } catch (e) {
      toastError("Failed to toggle team mode", (e as Error).message);
    }
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email) return;
    setInviting(true);
    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: id, ...inviteForm }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to invite");
      }
      const data = await res.json();
      setTeamMembers((prev) => [
        ...prev,
        {
          userId: data.userId,
          name: data.name,
          email: data.email,
          role: data.role,
          invitedAt: new Date().toISOString(),
          submittedAt: null,
          isComplete: false,
        },
      ]);
      setTeamMode(true);
      setInviteModal(false);
      setInviteForm({ name: "", email: "", role: "" });
      success("Team member invited", `${data.name} has been invited.`);
    } catch (e) {
      toastError("Invite failed", (e as Error).message);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      const res = await fetch(`/api/team/${id}/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
      setRemoveModal(null);
      success("Team member removed");
      // If no members left, turn off team mode
      if (teamMembers.length <= 1) setTeamMode(false);
    } catch (e) {
      toastError("Remove failed", (e as Error).message);
    }
  };

  if (loading) return (
    <div className="space-y-6">
      <SkeletonCard lines={4} />
      <SkeletonCard lines={3} />
    </div>
  );

  if (!client) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Client not found.</p>
    </div>
  );

  const statusMeta = CLIENT_STATUS_META[client.status];

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header Card */}
      <motion.div variants={fadeUp} className="card">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-lg bg-[#141414] text-white flex items-center justify-center text-2xl font-bold">
              {client.businessName[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusMeta.badge as Parameters<typeof Badge>[0]["variant"]} dot>
                  {statusMeta.label}
                </Badge>
                <span className="text-xs text-slate-400">Added {formatDate(client.createdAt)}</span>
              </div>
              {client.email && (
                <p className="text-sm text-slate-500 mt-0.5">{client.email}</p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => setDownloadModal(true)}
            >
              Report
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => { setFormErrors({}); setEditModal(true); }}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="danger"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => setDeleteModal(true)}
            >
              Delete
            </Button>
          </div>
        </div>

        {client.notes && (
          <div className="mt-4 bg-slate-50 rounded-lg p-4 text-sm text-slate-600 border border-slate-100">
            {client.notes}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Status</p>
            <p className="font-medium text-slate-900">{statusMeta.label}</p>
          </div>
          {client.onboardingCompletedAt && (
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Onboarded</p>
              <p className="font-medium text-slate-900">{formatDate(client.onboardingCompletedAt)}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-slate-400 mb-0.5">Last updated</p>
            <p className="font-medium text-slate-900">{formatDateTime(client.updatedAt)}</p>
          </div>
        </div>
      </motion.div>

      {/* Company Details */}
      <motion.div variants={fadeUp} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-slate-900">Company Details</h2>
          <button
            onClick={() => { setFormErrors({}); setEditModal(true); }}
            className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 transition-colors"
          >
            <Edit2 className="w-3 h-3" /> Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 text-sm">
          {/* Contact person */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <User className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Primary Contact</p>
              <p className="font-medium text-slate-900">{client.contactName || "—"}</p>
              <p className="text-xs text-slate-500 mt-0.5">{client.jobTitle || "—"}</p>
            </div>
          </div>

          {/* Contact email */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Contact Email</p>
              {client.contactEmail ? (
                <a href={`mailto:${client.contactEmail}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors block truncate">{client.contactEmail}</a>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Phone</p>
              {client.phone ? (
                <a href={`tel:${client.phone}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors">{client.phone}</a>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Login email */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Login Email</p>
              {client.email ? (
                <a href={`mailto:${client.email}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors block truncate">{client.email}</a>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Invoicing email */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Invoicing Email</p>
              {client.invoicingEmail ? (
                <a href={`mailto:${client.invoicingEmail}`} className="font-medium text-slate-900 hover:text-blue-600 transition-colors block truncate">{client.invoicingEmail}</a>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Website */}
          <div className="flex gap-3">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Website</p>
              {client.website ? (
                <a
                  href={client.website.startsWith("http") ? client.website : `https://${client.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-slate-900 hover:text-blue-600 transition-colors block truncate"
                >
                  {client.website}
                </a>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="flex gap-3 sm:col-span-2">
            <div className="mt-0.5 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-400 mb-0.5">Address</p>
              {(client.addressLine1 || client.city || client.country) ? (
                <p className="font-medium text-slate-900 leading-relaxed">
                  {[client.addressLine1, client.addressLine2, client.city, client.postcode, client.country]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : (
                <p className="font-medium text-slate-400">—</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Projects */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Projects</h2>
          <Button
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setProjectModal(true)}
          >
            New Project
          </Button>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#141414]/5 flex items-center justify-center mx-auto">
              <FolderOpen className="w-6 h-6 text-slate-900/30" />
            </div>
            <p className="text-sm text-slate-400">No projects for this client yet.</p>
            <Button size="sm" variant="secondary" onClick={() => setProjectModal(true)}>
              Create first project
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {projects.map((p) => {
              const meta = PROJECT_STATUS_META[p.status];
              return (
                <div
                  key={p.id}
                  onClick={() => router.push(`/admin/projects/${p.id}`)}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer group transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {p.status === "blocked" && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 group-hover:text-slate-600 truncate transition-colors">
                        {p.title}
                      </p>
                      {p.dueDate && (
                        <p className="text-xs text-slate-400">Due {formatDate(p.dueDate)}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={meta.badge as Parameters<typeof Badge>[0]["variant"]}>{meta.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Active Modules */}
      <motion.div variants={fadeUp}>
        <ActiveModulesCard clientId={id} projects={projects} allowedModules={allowedModules} />
      </motion.div>

      {/* Assessment Team */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Assessment Team</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleTeamMode}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              {teamMode ? (
                <ToggleRight className="w-5 h-5 text-emerald-500" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-300" />
              )}
              Team mode
            </button>
            {teamMode && (
              <Button
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setInviteModal(true)}
              >
                Invite
              </Button>
            )}
          </div>
        </div>

        {!teamMode ? (
          <p className="text-sm text-slate-400">
            Enable team mode to invite multiple people to complete the assessment independently.
          </p>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#141414]/5 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-slate-900/30" />
            </div>
            <p className="text-sm text-slate-400">No team members invited yet.</p>
            <Button size="sm" variant="secondary" onClick={() => setInviteModal(true)}>
              Invite first member
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((m) => (
              <div
                key={m.userId}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 group hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {m.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{m.name}</p>
                    <p className="text-xs text-slate-400 truncate">{m.role ? `${m.role} · ` : ""}{m.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {m.isComplete ? (
                    <Badge variant="success" dot>Submitted</Badge>
                  ) : (
                    <Badge variant="warning" dot>In progress</Badge>
                  )}
                  <button
                    onClick={() => setRemoveModal(m.userId)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
                    title="Remove member"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {allSubmitted && (
              <a
                href={`/admin/clients/${id}/synthesis`}
                className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                All submitted — View synthesis →
              </a>
            )}
          </div>
        )}
      </motion.div>

      {/* Invite Team Member Modal */}
      <Modal
        isOpen={inviteModal}
        onClose={() => setInviteModal(false)}
        title="Invite Team Member"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setInviteModal(false)}>Cancel</Button>
            <Button isLoading={inviting} onClick={handleInvite} disabled={!inviteForm.name || !inviteForm.email}>
              Send Invite
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full name"
            value={inviteForm.name}
            onChange={(e) => setInviteForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
          />
          <Input
            label="Email"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@company.com"
          />
          <Input
            label="Role / Job title"
            value={inviteForm.role}
            onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value }))}
            placeholder="e.g. CFO, Head of Sales"
          />
        </div>
      </Modal>

      {/* Remove Team Member Confirm */}
      <ConfirmModal
        isOpen={!!removeModal}
        onClose={() => setRemoveModal(null)}
        onConfirm={() => { if (removeModal) handleRemoveMember(removeModal); }}
        title="Remove Team Member"
        message="Are you sure you want to remove this team member? Their individual responses will be deleted."
        confirmLabel="Remove"
        variant="danger"
      />

      <Modal
        isOpen={editModal}
        onClose={() => { setEditModal(false); setFormErrors({}); }}
        title="Edit Client"
        size="lg"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setEditModal(false)}>Cancel</Button>
            <Button isLoading={saving} onClick={handleSave}>Save Changes</Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Input
            label="Company name"
            value={form.businessName}
            onChange={(e) => { setForm((f) => ({ ...f, businessName: e.target.value })); setFormErrors((errs) => ({ ...errs, businessName: "" })); }}
            placeholder="Acme Ltd"
            error={formErrors.businessName}
          />

          <Select
            label="Status"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ClientStatus }))}
            options={[
              { value: "invited",    label: "Invited" },
              { value: "onboarding", label: "Onboarding" },
              { value: "active",     label: "Active" },
              { value: "paused",     label: "Paused" },
            ]}
          />

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Contact</p>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact name"
              value={form.contactName}
              onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
              placeholder="Jane Smith"
            />
            <Input
              label="Job title"
              value={form.jobTitle}
              onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))}
              placeholder="Head of Marketing"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact email"
              type="email"
              value={form.contactEmail}
              onChange={(e) => { setForm((f) => ({ ...f, contactEmail: e.target.value })); setFormErrors((errs) => ({ ...errs, contactEmail: "" })); }}
              placeholder="jane@company.com"
              error={formErrors.contactEmail}
            />
            <Input
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+44 7700 000000"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Invoicing email"
              type="email"
              value={form.invoicingEmail}
              onChange={(e) => { setForm((f) => ({ ...f, invoicingEmail: e.target.value })); setFormErrors((errs) => ({ ...errs, invoicingEmail: "" })); }}
              placeholder="accounts@company.com"
              error={formErrors.invoicingEmail}
            />
            <Input
              label="Website"
              value={form.website}
              onChange={(e) => { setForm((f) => ({ ...f, website: e.target.value })); setFormErrors((errs) => ({ ...errs, website: "" })); }}
              placeholder="https://company.com"
              error={formErrors.website}
            />
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Address</p>
          <Input
            label="Address line 1"
            value={form.addressLine1}
            onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))}
            placeholder="123 Example Street"
          />
          <Input
            label="Address line 2"
            value={form.addressLine2}
            onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))}
            placeholder="Suite 4"
          />
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="London"
            />
            <Input
              label="Postcode"
              value={form.postcode}
              onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
              placeholder="EC1A 1BB"
            />
            <Input
              label="Country"
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
              placeholder="United Kingdom"
            />
          </div>

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider pt-1">Notes</p>
          <Textarea
            label="Internal notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Any internal notes about this client..."
            rows={3}
          />
        </div>
      </Modal>

      {/* Add Project Modal */}
      <Modal
        isOpen={projectModal}
        onClose={() => setProjectModal(false)}
        title="New Project"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setProjectModal(false)}>Cancel</Button>
            <Button isLoading={saving} onClick={handleAddProject} disabled={!projForm.title}>
              Create Project
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project title"
            value={projForm.title}
            onChange={(e) => setProjForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. Q3 Growth Sprint"
          />
          <Textarea
            label="Description"
            value={projForm.description}
            onChange={(e) => setProjForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            placeholder="What are we working on?"
          />
          <Input
            label="Due date (optional)"
            type="date"
            value={projForm.dueDate}
            onChange={(e) => setProjForm((f) => ({ ...f, dueDate: e.target.value }))}
          />
        </div>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmModal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${client.businessName}? This action cannot be undone.`}
        confirmLabel="Delete Client"
        variant="danger"
      />

      {/* Download Report Modal */}
      <Modal
        isOpen={downloadModal}
        onClose={() => setDownloadModal(false)}
        title="Download Report"
        size="sm"
        footer={
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setDownloadModal(false)}>Cancel</Button>
            <Button
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={() => {
                const params = new URLSearchParams();
                if (downloadIncludeNotes) params.set("includeNotes", "true");
                const projectId = projects[0]?._id;
                if (projectId) params.set("projectId", projectId);
                window.open(`/api/reports/${id}?${params.toString()}`, "_blank");
                setDownloadModal(false);
              }}
            >
              Download PDF
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-500">
            Generate a branded PDF report for {client.businessName}.
          </p>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={downloadIncludeNotes}
              onChange={(e) => setDownloadIncludeNotes(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">Include consultant notes</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={downloadIncludeFinancial}
              onChange={(e) => setDownloadIncludeFinancial(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
            />
            <span className="text-sm text-slate-700">Include financial summary</span>
          </label>
        </div>
      </Modal>
    </motion.div>
  );
}
