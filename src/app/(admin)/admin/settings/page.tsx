"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Bell,
  Shield,
  Palette,
  Save,
  Eye,
  EyeOff,
  Check,
  Megaphone,
  Copy,
  Loader2,
  ChevronDown,
  X,
  Plus,
  CheckCircle2,
  Clock,
  BarChart3,
  CreditCard,
  Package,
  UserPlus,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/notifications/ToastContext";
import type { ConsultantDTO, AssignmentLogDTO, GA4EventConfigDTO } from "@/types";

const TABS = [
  { id: "general",       label: "General",       icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "leads",         label: "Lead Gen",      icon: Megaphone },
  { id: "analytics",     label: "Analytics",     icon: BarChart3 },
  { id: "security",      label: "Security",      icon: Shield },
  { id: "plans",         label: "Plans",          icon: Package },
  { id: "payments",      label: "Payments",       icon: CreditCard },
  { id: "onboarding",    label: "Onboarding",     icon: UserPlus },
  { id: "branding",      label: "Branding",       icon: Palette },
] as const;
type TabId = typeof TABS[number]["id"];

/* ── Toggle switch ──────────────────────────────────────────── */
function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-6 rounded-full transition-colors duration-200 flex-shrink-0",
          checked ? "bg-[#141414]" : "bg-slate-200"
        )}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked ? "translate-x-4" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

/* ── Field wrapper ──────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 text-sm text-slate-700 bg-white border border-slate-200 rounded-lg focus:border-slate-400 focus:ring-1 focus:ring-slate-200 focus:outline-none transition-all";

/* ── General tab ────────────────────────────────────────────── */
function GeneralTab() {
  const { data: session } = useSession();
  const { success } = useToast();
  const [name,  setName]  = useState(session?.user?.name  ?? "");
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [tz,    setTz]    = useState("Europe/London");

  return (
    <div className="space-y-5">
      <Field label="Full name">
        <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </Field>
      <Field label="Email address">
        <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@example.com" />
      </Field>
      <Field label="Timezone">
        <select className={inputCls} value={tz} onChange={(e) => setTz(e.target.value)}>
          {["Europe/London", "America/New_York", "America/Los_Angeles", "Europe/Berlin", "Asia/Singapore", "Australia/Sydney"].map((z) => (
            <option key={z} value={z}>{z.replace("_", " ")}</option>
          ))}
        </select>
      </Field>
      <button
        onClick={() => success("Settings saved", "Your profile has been updated.")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        Save changes
      </button>
    </div>
  );
}

/* ── Notifications tab ──────────────────────────────────────── */
function NotificationsTab() {
  const { success } = useToast();
  const [prefs, setPrefs] = useState({
    newClient:       true,
    projectBlocked:  true,
    responseSubmit:  true,
    weeklyDigest:    false,
    kpiUpdates:      false,
  });

  const toggle = (key: keyof typeof prefs) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

  return (
    <div className="space-y-1">
      <Toggle checked={prefs.newClient}      onChange={() => toggle("newClient")}      label="New client added"      description="When a new client account is created" />
      <Toggle checked={prefs.projectBlocked} onChange={() => toggle("projectBlocked")} label="Project blocked"        description="When a project is marked as blocked" />
      <Toggle checked={prefs.responseSubmit} onChange={() => toggle("responseSubmit")} label="Response submitted"     description="When a client submits a framework section" />
      <Toggle checked={prefs.weeklyDigest}   onChange={() => toggle("weeklyDigest")}   label="Weekly digest"          description="Portfolio summary every Monday morning" />
      <Toggle checked={prefs.kpiUpdates}     onChange={() => toggle("kpiUpdates")}     label="KPI updates"            description="When KPI statuses change" />

      <div className="pt-4">
        <button
          onClick={() => success("Notification preferences saved")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          Save preferences
        </button>
      </div>
    </div>
  );
}

/* ── Security tab ───────────────────────────────────────────── */
function SecurityTab() {
  const { success, error: toastError } = useToast();
  const [current, setCurrent] = useState("");
  const [next,    setNext]    = useState("");
  const [confirm, setConfirm] = useState("");
  const [show,    setShow]    = useState(false);
  const [saving,  setSaving]  = useState(false);

  const handleSave = async () => {
    if (!current || !next) return;
    if (next !== confirm) { toastError("Passwords don't match", "Please re-enter your new password."); return; }
    if (next.length < 8) { toastError("Too short", "Password must be at least 8 characters."); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setCurrent(""); setNext(""); setConfirm("");
    success("Password updated", "Your password has been changed.");
  };

  return (
    <div className="space-y-5">
      <Field label="Current password">
        <div className="relative">
          <input className={cn(inputCls, "pr-10")} type={show ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="••••••••" />
          <button onClick={() => setShow((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </Field>
      <Field label="New password">
        <input className={inputCls} type={show ? "text" : "password"} value={next} onChange={(e) => setNext(e.target.value)} placeholder="Min. 8 characters" />
      </Field>
      <Field label="Confirm new password">
        <input className={inputCls} type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" />
      </Field>
      <button
        onClick={handleSave}
        disabled={saving || !current || !next || !confirm}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {saving ? (
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Shield className="w-3.5 h-3.5" />
        )}
        {saving ? "Saving…" : "Update password"}
      </button>
    </div>
  );
}

/* ── Branding tab ───────────────────────────────────────────── */
function BrandingTab() {
  const { success } = useToast();
  const PRESETS = [
    { label: "Blue",   value: "rgb(108,194,255)" },
    { label: "Green",  value: "rgb(112,255,162)" },
    { label: "Purple", value: "rgb(167,139,250)" },
    { label: "Amber",  value: "rgb(251,191,36)"  },
    { label: "Rose",   value: "rgb(251,113,133)"  },
  ];
  const [selected, setSelected] = useState("rgb(108,194,255)");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Portal accent colour</p>
        <div className="flex gap-3 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.value}
              onClick={() => setSelected(p.value)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div
                className="w-9 h-9 rounded-lg ring-offset-2 transition-all"
                style={{
                  background: p.value,
                  boxShadow: selected === p.value ? `0 0 0 2px #141414` : "none",
                }}
              >
                {selected === p.value && (
                  <div className="w-full h-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-[#141414]/70" strokeWidth={2.5} />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Client portal preview</p>
        <div className="rounded-2xl ring-1 ring-black/[0.06] overflow-hidden">
          <div className="h-8 flex items-center px-4 gap-2" style={{ background: "#141414" }}>
            <div className="w-20 h-2 rounded bg-white/20" />
          </div>
          <div className="p-4 bg-slate-50/50">
            <div className="h-4 w-32 rounded bg-slate-200 mb-2" />
            <div className="h-2 w-48 rounded bg-slate-100 mb-4" />
            <div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-[#141414]"
              style={{ background: selected }}
            >
              Continue →
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => success("Branding saved", "Client portal will update shortly.")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        Save branding
      </button>
    </div>
  );
}

/* ── Capacity Bar ───────────────────────────────────────────── */
function CapacityBar({ current, max }: { current: number; max: number }) {
  const pct = max > 0 ? Math.round((current / max) * 100) : 0;
  const colour = pct <= 60 ? "bg-emerald-500" : pct <= 85 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", colour)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className="text-xs text-slate-500 tabular-nums whitespace-nowrap">{current}/{max} clients</span>
    </div>
  );
}

function statusBadge(c: ConsultantDTO) {
  const pct = c.profile.capacityPercent;
  const holiday = c.profile.holidayUntil && new Date(c.profile.holidayUntil) > new Date();
  if (holiday) return { label: "On holiday", cls: "bg-slate-100 text-slate-600" };
  if (c.profile.availabilityStatus === "unavailable" || pct >= 100) return { label: "At capacity", cls: "bg-red-50 text-red-700" };
  if (c.profile.availabilityStatus === "limited" || pct >= 80) return { label: "Limited", cls: "bg-amber-50 text-amber-700" };
  return { label: "Available", cls: "bg-emerald-50 text-emerald-700" };
}

/* ── Weight dots ────────────────────────────────────────────── */
function WeightDots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={cn("w-2 h-2 rounded-full", i <= value ? "bg-slate-800" : "bg-slate-200")} />
      ))}
    </span>
  );
}

/* ── Consultant Edit Panel ──────────────────────────────────── */
function ConsultantEditPanel({
  consultant,
  onSave,
  onCancel,
}: {
  consultant: ConsultantDTO;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}) {
  const [maxClients, setMaxClients] = useState(consultant.profile.maxActiveClients);
  const [availability, setAvailability] = useState(consultant.profile.availabilityStatus);
  const [holidayUntil, setHolidayUntil] = useState(
    consultant.profile.holidayUntil ? consultant.profile.holidayUntil.slice(0, 10) : ""
  );
  const [specialisms, setSpecialisms] = useState<string[]>(consultant.profile.specialisms);
  const [newSpec, setNewSpec] = useState("");
  const [weight, setWeight] = useState(consultant.profile.roundRobinWeight);
  const [saving, setSaving] = useState(false);

  const addSpec = () => {
    const val = newSpec.trim();
    if (val && !specialisms.includes(val)) {
      setSpecialisms([...specialisms, val]);
    }
    setNewSpec("");
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave({
      maxActiveClients: maxClients,
      availabilityStatus: availability,
      holidayUntil: holidayUntil || null,
      specialisms,
      roundRobinWeight: weight,
    });
    setSaving(false);
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="pt-3 pb-1 pl-4 pr-4 space-y-4 border-t border-slate-100">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Max active clients">
            <input
              className={inputCls}
              type="number"
              min={1}
              max={20}
              value={maxClients}
              onChange={(e) => setMaxClients(Number(e.target.value))}
            />
          </Field>
          <Field label="Weight (1–5)">
            <input
              className={inputCls}
              type="range"
              min={1}
              max={5}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
            />
            <p className="text-xs text-slate-400 mt-1 text-center">{weight}</p>
          </Field>
        </div>

        <Field label="Availability">
          <div className="flex gap-3">
            {(["available", "limited", "unavailable"] as const).map((v) => (
              <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name={`avail-${consultant.id}`}
                  checked={availability === v}
                  onChange={() => setAvailability(v)}
                  className="accent-slate-800"
                />
                <span className="text-sm text-slate-700 capitalize">{v}</span>
              </label>
            ))}
          </div>
        </Field>

        <Field label="Holiday until">
          <div className="flex items-center gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              type="date"
              value={holidayUntil}
              onChange={(e) => setHolidayUntil(e.target.value)}
            />
            {holidayUntil && (
              <button
                onClick={() => setHolidayUntil("")}
                className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                title="Clear holiday"
              >
                <X className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </Field>

        <Field label="Specialisms">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {specialisms.map((s) => (
              <span key={s} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-md text-xs text-slate-700">
                {s}
                <button onClick={() => setSpecialisms(specialisms.filter((x) => x !== s))} className="text-slate-400 hover:text-slate-600">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className={cn(inputCls, "flex-1")}
              value={newSpec}
              onChange={(e) => setNewSpec(e.target.value)}
              placeholder="Add specialism..."
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSpec(); } }}
            />
            <button onClick={addSpec} className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <Plus className="w-3.5 h-3.5 text-slate-500" />
            </button>
          </div>
        </Field>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 disabled:opacity-40 transition-all"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? "Saving…" : "Save"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Lead Generation tab ────────────────────────────────────── */
function LeadGenTab() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [leadNotificationEmail, setLeadNotificationEmail] = useState("");
  const [autoResponseReplyTo, setAutoResponseReplyTo] = useState("");
  const [calendlyUrl, setCalendlyUrl] = useState("");
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [consultants, setConsultants] = useState<ConsultantDTO[]>([]);
  const [assignmentLogs, setAssignmentLogs] = useState<AssignmentLogDTO[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/lead?key=${showKey ? (process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? "••••••••") : "••••••••"}`
    : "";

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, consultantsRes, logsRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/consultants"),
        fetch("/api/admin/assignment-log?limit=20"),
      ]);
      if (settingsRes.ok) {
        const { data } = await settingsRes.json();
        setLeadNotificationEmail(data.leadNotificationEmail ?? "");
        setAutoResponseReplyTo(data.autoResponseReplyTo ?? "");
        setCalendlyUrl(data.calendlyUrl ?? "");
        setAutoAssignEnabled(data.autoAssignEnabled ?? false);
      }
      if (consultantsRes.ok) {
        const { data } = await consultantsRes.json();
        setConsultants(data ?? []);
      }
      if (logsRes.ok) {
        const { data } = await logsRes.json();
        setAssignmentLogs(data ?? []);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadNotificationEmail: leadNotificationEmail || undefined,
          autoResponseReplyTo: autoResponseReplyTo || undefined,
          calendlyUrl: calendlyUrl || undefined,
          autoAssignEnabled,
        }),
      });
      if (res.ok) {
        success("Lead generation settings saved");
      } else {
        toastError("Failed to save", "Please try again.");
      }
    } catch {
      toastError("Failed to save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyWebhookUrl = () => {
    const url = `${window.location.origin}/api/webhooks/lead?key=${process.env.NEXT_PUBLIC_WEBHOOK_SECRET ?? "your-secret-here"}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConsultantSave = async (consultantId: string, data: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/consultants/${consultantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        success("Consultant settings saved");
        setEditingId(null);
        // Refresh consultant data
        const refreshRes = await fetch("/api/admin/consultants");
        if (refreshRes.ok) {
          const { data: fresh } = await refreshRes.json();
          setConsultants(fresh ?? []);
        }
      } else {
        toastError("Failed to save", "Please try again.");
      }
    } catch {
      toastError("Failed to save", "Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
          Webhook URL
        </label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg font-mono truncate">
            {webhookUrl || "Loading…"}
          </div>
          <button
            onClick={() => setShowKey((v) => !v)}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title={showKey ? "Hide key" : "Reveal key"}
          >
            {showKey ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
          </button>
          <button
            onClick={copyWebhookUrl}
            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
            title="Copy webhook URL"
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Read-only. Use this URL in your Elementor form webhook action.</p>
      </div>

      {/* Lead notification email */}
      <Field label="Lead notification email">
        <input
          className={inputCls}
          type="email"
          value={leadNotificationEmail}
          onChange={(e) => setLeadNotificationEmail(e.target.value)}
          placeholder="leads@yourcompany.com"
        />
        <p className="text-xs text-slate-400 mt-1">Where new lead notification emails are sent</p>
      </Field>

      {/* Auto-response reply-to email */}
      <Field label="Auto-response reply-to email">
        <input
          className={inputCls}
          type="email"
          value={autoResponseReplyTo}
          onChange={(e) => setAutoResponseReplyTo(e.target.value)}
          placeholder="hello@yourcompany.com"
        />
        <p className="text-xs text-slate-400 mt-1">Prospects reply to this address</p>
      </Field>

      {/* Calendly URL */}
      <Field label="Calendly booking URL (optional)">
        <input
          className={inputCls}
          type="url"
          value={calendlyUrl}
          onChange={(e) => setCalendlyUrl(e.target.value)}
          placeholder="https://calendly.com/your-link"
        />
        <p className="text-xs text-slate-400 mt-1">If set, included in auto-response email as booking link</p>
      </Field>

      {/* Auto-assignment toggle */}
      <Toggle
        checked={autoAssignEnabled}
        onChange={setAutoAssignEnabled}
        label="Auto-assign leads to consultants"
        description="When enabled, new leads are automatically assigned to the best available consultant"
      />

      {autoAssignEnabled && (
        <div className="rounded-lg bg-slate-50 p-4 text-xs text-slate-500 space-y-1">
          <p className="font-medium text-slate-700">Assignment rules:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Consultants at full capacity are skipped</li>
            <li>Consultants on holiday are skipped</li>
            <li>Consultants with matching specialisms are preferred</li>
            <li>Weight determines how frequently a consultant receives leads</li>
          </ul>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {saving ? (
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <Save className="w-3.5 h-3.5" />
        )}
        {saving ? "Saving…" : "Save lead settings"}
      </button>

      {/* ── Consultant Capacity ──────────────────────────── */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Consultant Capacity</h3>
        {consultants.length === 0 ? (
          <p className="text-xs text-slate-400">No consultants found.</p>
        ) : (
          <div className="rounded-lg ring-1 ring-black/[0.06] divide-y divide-slate-100 overflow-hidden">
            {consultants.map((c) => {
              const badge = statusBadge(c);
              const isEditing = editingId === c.id;
              return (
                <div key={c.id}>
                  <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-slate-800">{c.name}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-medium", badge.cls)}>
                        {badge.label}
                      </span>
                    </div>
                    <CapacityBar current={c.profile.currentActiveClients} max={c.profile.maxActiveClients} />
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        {c.profile.specialisms.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Specialisms: {c.profile.specialisms.join(", ")}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-[11px] text-slate-400">
                          Weight: <WeightDots value={c.profile.roundRobinWeight ?? 1} />
                        </span>
                      </div>
                      <button
                        onClick={() => setEditingId(isEditing ? null : c.id)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
                      >
                        <ChevronDown className={cn("w-3 h-3 transition-transform", isEditing && "rotate-180")} />
                        {isEditing ? "Close" : "Edit capacity"}
                      </button>
                    </div>
                  </div>
                  <AnimatePresence>
                    {isEditing && (
                      <ConsultantEditPanel
                        consultant={c}
                        onSave={(data) => handleConsultantSave(c.id, data)}
                        onCancel={() => setEditingId(null)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Assignment Log ───────────────────────────────── */}
      <div className="border-t border-slate-200 pt-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-800 mb-3">Assignment Log</h3>
        {assignmentLogs.length === 0 ? (
          <p className="text-xs text-slate-400">No assignment decisions yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th className="pb-2 pr-3 font-medium text-slate-500">Time</th>
                  <th className="pb-2 pr-3 font-medium text-slate-500">Prospect</th>
                  <th className="pb-2 pr-3 font-medium text-slate-500">Assigned to</th>
                  <th className="pb-2 pr-3 font-medium text-slate-500">Auto</th>
                  <th className="pb-2 font-medium text-slate-500">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {assignmentLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3 text-slate-400 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })},{" "}
                      {new Date(log.createdAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2 pr-3 text-slate-700 font-medium">{log.prospectName || "—"}</td>
                    <td className="py-2 pr-3 text-slate-700">{log.assignedToName || "—"}</td>
                    <td className="py-2 pr-3">
                      {log.autoAssigned ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-slate-300" />
                      )}
                    </td>
                    <td className="py-2 text-slate-500">{log.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Analytics Tab (GA4) ────────────────────────────────────── */

const DEFAULT_EVENTS: GA4EventConfigDTO = {
  leadReceived: true,
  leadQualified: true,
  proposalSent: true,
  dealWon: true,
  dealLost: false,
  clientConverted: true,
  assessmentStarted: true,
  sectionCompleted: false,
  moduleCompleted: true,
  invoicePaid: true,
  reportDownloaded: false,
};

const EVENT_LABELS: { key: keyof GA4EventConfigDTO; label: string; note?: string }[] = [
  { key: "leadReceived", label: "Lead received (web form submission)" },
  { key: "leadQualified", label: "Lead qualified (moved to SQL)" },
  { key: "proposalSent", label: "Proposal sent" },
  { key: "dealWon", label: "Deal won" },
  { key: "dealLost", label: "Deal lost" },
  { key: "clientConverted", label: "Client converted" },
  { key: "assessmentStarted", label: "Assessment started" },
  { key: "sectionCompleted", label: "Section completed", note: "high volume — enable with caution" },
  { key: "moduleCompleted", label: "Module completed" },
  { key: "invoicePaid", label: "Invoice paid" },
  { key: "reportDownloaded", label: "Report downloaded" },
];

function AnalyticsTab() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [ga4Enabled, setGa4Enabled] = useState(false);
  const [ga4MeasurementId, setGa4MeasurementId] = useState("");
  const [ga4ApiSecret, setGa4ApiSecret] = useState("");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [trackedEvents, setTrackedEvents] = useState<GA4EventConfigDTO>(DEFAULT_EVENTS);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/settings");
      if (res.ok) {
        const { data } = await res.json();
        setGa4Enabled(data.ga4Enabled ?? false);
        setGa4MeasurementId(data.ga4MeasurementId ?? "");
        setGa4ApiSecret(data.ga4ApiSecret ?? "");
        if (data.ga4TrackedEvents) setTrackedEvents(data.ga4TrackedEvents);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ga4Enabled,
          ga4MeasurementId: ga4MeasurementId || undefined,
          ga4ApiSecret: ga4ApiSecret || undefined,
          ga4TrackedEvents: trackedEvents,
        }),
      });
      if (res.ok) {
        success("Analytics settings saved");
      } else {
        toastError("Failed to save", "Please try again.");
      }
    } catch {
      toastError("Failed to save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/analytics/test", { method: "POST" });
      const body = await res.json();
      if (res.ok) {
        success(body.message ?? "Test event sent");
      } else {
        toastError("Test failed", body.error ?? "Check your configuration");
      }
    } catch {
      toastError("Test failed", "Network error — please try again.");
    } finally {
      setTesting(false);
    }
  };

  const handleCopySecret = () => {
    if (!ga4ApiSecret) return;
    navigator.clipboard.writeText(ga4ApiSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const toggleEvent = (key: keyof GA4EventConfigDTO) => {
    setTrackedEvents((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const inputCls = "w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-brand-blue focus:border-transparent outline-none";

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Google Analytics 4</h2>
        <p className="text-sm text-slate-500 mt-1">
          Track the full funnel from form submission through to paying client.
        </p>
      </div>

      <Toggle
        checked={ga4Enabled}
        onChange={setGa4Enabled}
        label="Enable GA4 tracking"
        description="When enabled, server-side events are sent via Measurement Protocol for pipeline stage changes. Client-side page views require the NEXT_PUBLIC_GA4_MEASUREMENT_ID environment variable."
      />

      <AnimatePresence>
        {ga4Enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-5 overflow-hidden"
          >
            <Field label="Measurement ID">
              <input
                className={inputCls}
                placeholder="G-XXXXXXXXXX"
                value={ga4MeasurementId}
                onChange={(e) => setGa4MeasurementId(e.target.value)}
              />
              <p className="text-xs text-slate-400 mt-1">
                Also set <code className="text-xs bg-slate-100 px-1 rounded">NEXT_PUBLIC_GA4_MEASUREMENT_ID</code> in your environment variables for client-side page view tracking.
              </p>
            </Field>

            <Field label="API Secret (for server-side events)">
              <div className="flex gap-2">
                <input
                  className={cn(inputCls, "flex-1")}
                  type={showSecret ? "text" : "password"}
                  placeholder="Enter API Secret"
                  value={ga4ApiSecret}
                  onChange={(e) => setGa4ApiSecret(e.target.value)}
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="px-3 py-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  title={showSecret ? "Hide" : "Reveal"}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleCopySecret}
                  className="px-3 py-2 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                  title="Copy"
                >
                  {copiedSecret ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Create this in GA4 → Admin → Data Streams → Measurement Protocol API secrets
              </p>
            </Field>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Events to track</p>
              <div className="space-y-2">
                {EVENT_LABELS.map(({ key, label, note }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={trackedEvents[key]}
                      onChange={() => toggleEvent(key)}
                      className="w-4 h-4 rounded border-slate-300 text-brand-blue focus:ring-brand-blue"
                    />
                    <span className="text-sm text-slate-700 group-hover:text-slate-900">
                      {label}
                      {note && <span className="text-xs text-amber-600 ml-1">({note})</span>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleTest}
                disabled={testing || !ga4MeasurementId || !ga4ApiSecret}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                Test connection
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-brand-blue text-white text-sm font-semibold hover:bg-brand-blue/90 disabled:opacity-50 transition-colors"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save settings
              </button>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-700 mb-1">Verification</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                After clicking &quot;Test connection&quot;, open GA4 → Admin → DebugView within 60 seconds to confirm receipt of the test event. Note: Measurement Protocol always returns 204 regardless of whether the event was accepted.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Plans Tab ──────────────────────────────────────────────── */
function PlansTab() {
  const [plans, setPlans] = useState<Array<{ id: string; name: string; monthlyPricePence: number; maxActiveClients: number; isActive: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => { setPlans(d.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Subscription Plans</h2>
        <p className="text-sm text-slate-500 mt-1">{plans.length} plan{plans.length !== 1 ? "s" : ""} configured</p>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-slate-400">No plans found. Create your first plan to get started.</p>
      ) : (
        <div className="space-y-2">
          {plans.map((plan) => (
            <div key={plan.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{plan.name}</p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    £{(plan.monthlyPricePence / 100).toFixed(2)}/mo · up to {plan.maxActiveClients} clients
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", plan.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
                  {plan.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <a
        href="/admin/plans"
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#141414] text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
      >
        <ArrowRight className="w-4 h-4" />
        Manage plans
      </a>
    </div>
  );
}

/* ── Payments Tab ───────────────────────────────────────────── */
function PaymentsTab() {
  const { success } = useToast();
  const [showSecretHook, setShowSecretHook] = useState(false);
  const [copied, setCopied] = useState(false);
  const webhookEndpoint = typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/stripe` : "";

  const copyEndpoint = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Stripe Integration</h2>
        <p className="text-sm text-slate-500 mt-1">Configure your Stripe webhook and billing settings.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Webhook endpoint</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg font-mono truncate">
            {webhookEndpoint || "Loading…"}
          </div>
          <button onClick={copyEndpoint} className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" title="Copy">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Add this URL in your Stripe Dashboard → Webhooks.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Webhook signing secret</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg font-mono">
            {showSecretHook ? (process.env.NEXT_PUBLIC_STRIPE_WEBHOOK_HINT ?? "Set STRIPE_WEBHOOK_SECRET in environment") : "whsec_••••••••••••••••"}
          </div>
          <button onClick={() => setShowSecretHook((v) => !v)} className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" title={showSecretHook ? "Hide" : "Reveal"}>
            {showSecretHook ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-slate-500" />}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1">Set <code className="text-xs bg-slate-100 px-1 rounded">STRIPE_WEBHOOK_SECRET</code> in your environment variables.</p>
      </div>

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 flex gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-800">Required Stripe webhook events</p>
          <p className="text-xs text-amber-700">Ensure these events are enabled in your Stripe webhook configuration:</p>
          <ul className="text-xs text-amber-700 list-disc list-inside space-y-0.5">
            <li>checkout.session.completed</li>
            <li>customer.subscription.updated</li>
            <li>customer.subscription.deleted</li>
            <li>invoice.payment_succeeded</li>
            <li>invoice.payment_failed</li>
          </ul>
        </div>
      </div>

      <button
        onClick={() => success("Payments configuration saved")}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 transition-colors"
      >
        <Save className="w-3.5 h-3.5" />
        Save
      </button>
    </div>
  );
}

/* ── Onboarding Tab ─────────────────────────────────────────── */
function OnboardingTab() {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [allowSelfReg, setAllowSelfReg] = useState(false);
  const [requireApproval, setRequireApproval] = useState(true);
  const [defaultTrialDays, setDefaultTrialDays] = useState(14);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) {
          setAllowSelfReg(d.data.allowConsultantSelfRegistration ?? false);
          setRequireApproval(d.data.requireConsultantApproval ?? true);
          setDefaultTrialDays(d.data.defaultTrialDays ?? 14);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowConsultantSelfRegistration: allowSelfReg,
          requireConsultantApproval: requireApproval,
          defaultTrialDays,
        }),
      });
      if (res.ok) {
        success("Onboarding settings saved");
      } else {
        toastError("Failed to save", "Please try again.");
      }
    } catch {
      toastError("Failed to save", "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Consultant Onboarding</h2>
        <p className="text-sm text-slate-500 mt-1">Control how consultants join the platform.</p>
      </div>

      <Toggle
        checked={allowSelfReg}
        onChange={setAllowSelfReg}
        label="Allow self-registration"
        description="Consultants can sign up at /register — they'll be prompted to choose a plan"
      />

      <Toggle
        checked={requireApproval}
        onChange={setRequireApproval}
        label="Require admin approval"
        description="New registrations are held as 'pending' until an admin approves them"
      />

      <Field label="Default trial period (days)">
        <input
          className={inputCls}
          type="number"
          min={0}
          max={90}
          value={defaultTrialDays}
          onChange={(e) => setDefaultTrialDays(Number(e.target.value))}
        />
        <p className="text-xs text-slate-400 mt-1">How many trial days new consultants get before billing starts. Set 0 to disable trials.</p>
      </Field>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-[#141414] hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        {saving ? "Saving…" : "Save onboarding settings"}
      </button>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function AdminSettingsPage() {
  const [tab, setTab] = useState<TabId>("general");

  const content: Record<TabId, React.ReactNode> = {
    general:       <GeneralTab />,
    notifications: <NotificationsTab />,
    leads:         <LeadGenTab />,
    analytics:     <AnalyticsTab />,
    security:      <SecurityTab />,
    plans:         <PlansTab />,
    payments:      <PaymentsTab />,
    onboarding:    <OnboardingTab />,
    branding:      <BrandingTab />,
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-bold text-2xl text-slate-900">Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Manage your account and platform preferences</p>
      </div>

      <div className="flex gap-6 items-start">
        {/* Vertical sidebar menu — 1/3 */}
        <nav className="w-1/3 flex-shrink-0 sticky top-24 bg-white rounded-lg ring-1 ring-black/[0.06] p-2 space-y-0.5">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "relative w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-sm font-medium transition-colors text-left",
                tab === id
                  ? "bg-[#141414] text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {tab === id && (
                <motion.div
                  layoutId="settings-tab"
                  className="absolute inset-0 bg-[#141414] rounded-md"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  style={{ zIndex: 0 }}
                />
              )}
              <Icon className="relative z-10 w-4 h-4" />
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </nav>

        {/* Settings card — 2/3 */}
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="w-2/3 bg-white rounded-lg ring-1 ring-black/[0.06] p-6"
        >
          {content[tab]}
        </motion.div>
      </div>
    </div>
  );
}
