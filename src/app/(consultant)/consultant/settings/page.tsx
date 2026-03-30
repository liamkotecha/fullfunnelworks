"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Globe, Building2, Save, Loader2,
  CreditCard, Bell, Lock, Eye, EyeOff, AlertTriangle, Code2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import Link from "next/link";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface Profile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  website: string;
  companyName: string;
  notifyNewClient: boolean;
  notifyInvoicePaid: boolean;
  notifyProjectBlocked: boolean;
  notifyWeeklyDigest: boolean;
}

function Toggle({ checked, onChange, label, description }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2 ${
          checked ? "bg-brand-blue" : "bg-slate-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

export default function ConsultantSettingsPage() {
  const { data: session, update } = useSession();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile>({
    name: "", email: "", phone: "", bio: "", website: "", companyName: "",
    notifyNewClient: true, notifyInvoicePaid: true,
    notifyProjectBlocked: true, notifyWeeklyDigest: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    fetch("/api/me/profile")
      .then((r) => r.json())
      .then((d) => {
        setProfile({
          name: d.name ?? session?.user?.name ?? "",
          email: d.email ?? session?.user?.email ?? "",
          phone: d.phone ?? "",
          bio: d.bio ?? "",
          website: d.website ?? "",
          companyName: d.companyName ?? "",
          notifyNewClient: d.notifyNewClient ?? true,
          notifyInvoicePaid: d.notifyInvoicePaid ?? true,
          notifyProjectBlocked: d.notifyProjectBlocked ?? true,
          notifyWeeklyDigest: d.notifyWeeklyDigest ?? true,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      await update({ name: profile.name });
      success("Settings saved", "Your profile has been updated.");
    } catch (e) {
      toastError("Save failed", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toastError("Password mismatch", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toastError("Too short", "Password must be at least 8 characters.");
      return;
    }
    setSavingPw(true);
    try {
      const res = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Change failed");
      success("Password updated", "Your password has been changed.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      toastError("Change failed", (e as Error).message);
    } finally {
      setSavingPw(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-6">
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your profile, notifications and security</p>
      </motion.div>

      {/* ── Profile ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card space-y-5">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Profile</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Full name"
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Jane Smith"
            leftIcon={<User className="w-3.5 h-3.5 text-slate-400" />}
          />
          <Input
            label="Email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
            placeholder="jane@example.com"
            leftIcon={<Mail className="w-3.5 h-3.5 text-slate-400" />}
            disabled
          />
          <Input
            label="Phone"
            value={profile.phone}
            onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            placeholder="+44 7700 000000"
            leftIcon={<Phone className="w-3.5 h-3.5 text-slate-400" />}
          />
          <Input
            label="Website"
            value={profile.website}
            onChange={(e) => setProfile((p) => ({ ...p, website: e.target.value }))}
            placeholder="https://yoursite.com"
            leftIcon={<Globe className="w-3.5 h-3.5 text-slate-400" />}
          />
          <Input
            label="Company / Trading name"
            value={profile.companyName}
            onChange={(e) => setProfile((p) => ({ ...p, companyName: e.target.value }))}
            placeholder="Acme Consulting Ltd"
            leftIcon={<Building2 className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Professional bio</label>
          <textarea
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 resize-none"
            rows={4}
            value={profile.bio}
            onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Brief description of your specialism and approach..."
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            leftIcon={saving ? undefined : <Save className="w-3.5 h-3.5" />}
          >
            Save profile
          </Button>
        </div>
      </motion.div>

      {/* ── Notifications ────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card space-y-1">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Notifications</h2>
        </div>

        <Toggle
          checked={profile.notifyNewClient}
          onChange={(v) => setProfile((p) => ({ ...p, notifyNewClient: v }))}
          label="New client assigned"
          description="Email when a new client is assigned to you"
        />
        <Toggle
          checked={profile.notifyInvoicePaid}
          onChange={(v) => setProfile((p) => ({ ...p, notifyInvoicePaid: v }))}
          label="Invoice paid"
          description="Email when a client pays an invoice"
        />
        <Toggle
          checked={profile.notifyProjectBlocked}
          onChange={(v) => setProfile((p) => ({ ...p, notifyProjectBlocked: v }))}
          label="Project blocked"
          description="Email when a project is marked as blocked"
        />
        <Toggle
          checked={profile.notifyWeeklyDigest}
          onChange={(v) => setProfile((p) => ({ ...p, notifyWeeklyDigest: v }))}
          label="Weekly digest"
          description="Summary of your pipeline, projects and revenue every Monday"
        />

        <div className="flex justify-end pt-3">
          <Button
            onClick={handleSave}
            isLoading={saving}
            leftIcon={saving ? undefined : <Save className="w-3.5 h-3.5" />}
          >
            Save preferences
          </Button>
        </div>
      </motion.div>

      {/* ── Security ─────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Security</h2>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <Input
              label="Current password"
              type={showCurrentPw ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              leftIcon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPw((v) => !v)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="relative">
            <Input
              label="New password"
              type={showNewPw ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              leftIcon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
            />
            <button
              type="button"
              onClick={() => setShowNewPw((v) => !v)}
              className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
            >
              {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            leftIcon={<Lock className="w-3.5 h-3.5 text-slate-400" />}
          />
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handlePasswordChange}
            isLoading={savingPw}
            variant="secondary"
            leftIcon={savingPw ? undefined : <Lock className="w-3.5 h-3.5" />}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Change password
          </Button>
        </div>
      </motion.div>

      {/* ── Integrations ─────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Integrations</h2>
        </div>
        <p className="text-sm text-slate-500">
          Embed a lead capture form on your website — submissions flow directly into your pipeline.
        </p>
        <Link href="/consultant/settings/forms">
          <Button variant="secondary">
            Manage lead forms →
          </Button>
        </Link>
      </motion.div>

      {/* ── Payouts ──────────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Payouts</h2>
        </div>
        <p className="text-sm text-slate-500">
          Connect your Stripe account to receive invoice payments directly. Platform-managed payouts are coming soon.
        </p>
        <Button variant="secondary" disabled>
          Connect Stripe — Coming soon
        </Button>
      </motion.div>

      {/* ── Danger zone ──────────────────────────────────────── */}
      <motion.div variants={fadeUp} className="card border-red-100 space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <h2 className="font-semibold text-red-700">Danger zone</h2>
        </div>
        <p className="text-sm text-slate-500">
          Permanently delete your account and all associated data. This cannot be undone.
          Speak to support before proceeding.
        </p>
        <Button variant="ghost" disabled className="text-red-500 border border-red-200 hover:bg-red-50">
          Request account deletion
        </Button>
      </motion.div>
    </motion.div>
  );
}
