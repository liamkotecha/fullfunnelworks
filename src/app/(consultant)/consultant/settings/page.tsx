"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { User, Mail, Phone, Globe, Building2, Save, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

interface Profile {
  name: string;
  email: string;
  phone: string;
  bio: string;
  website: string;
  companyName: string;
}

export default function ConsultantSettingsPage() {
  const { data: session, update } = useSession();
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<Profile>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    website: "",
    companyName: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {[1, 2].map((i) => (
          <div key={i} className="card h-40 animate-pulse bg-slate-50" />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="show"
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your consultant profile</p>
      </motion.div>

      {/* Profile */}
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
            Save changes
          </Button>
        </div>
      </motion.div>

      {/* Billing / Stripe Connect placeholder */}
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
    </motion.div>
  );
}
