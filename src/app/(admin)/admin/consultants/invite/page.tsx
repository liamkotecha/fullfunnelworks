"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";

interface PlanOption {
  id: string;
  name: string;
  monthlyPricePence: number;
  maxActiveClients: number;
}

export default function InviteConsultantPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [planId, setPlanId] = useState("");
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ id: string; name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.data ?? []).filter((p: PlanOption & { isActive: boolean }) => p.isActive);
        setPlans(active);
        if (active.length === 1) setPlanId(active[0].id);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/consultants/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), planId: planId || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }

      setSuccess(data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="px-8 pt-8 pb-12 max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-8 text-center space-y-4"
        >
          <CheckCircle className="mx-auto w-12 h-12 text-emerald-500" />
          <h2 className="text-xl font-semibold text-slate-900">Invitation sent</h2>
          <p className="text-sm text-slate-500">
            <span className="font-medium text-slate-800">{success.name}</span> ({success.email}) has been
            invited. They&apos;ll receive a welcome email with a sign-in link.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <button
              onClick={() => router.push(`/admin/consultants/${success.id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              View profile
            </button>
            <button
              onClick={() => {
                setSuccess(null);
                setName("");
                setEmail("");
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Invite another
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="px-8 pt-8 pb-12 max-w-lg space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <button
          onClick={() => router.push("/admin/consultants")}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
          aria-label="Back to consultants"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Invite consultant</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Create a consultant account and send them a welcome email with a sign-in link.
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onSubmit={handleSubmit}
        className="rounded-xl bg-white ring-1 ring-slate-200 shadow-sm p-6 space-y-5"
      >
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-sm font-medium text-slate-700">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-slate-700">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        {plans.length > 0 && (
          <div className="space-y-1.5">
            <label htmlFor="plan" className="block text-sm font-medium text-slate-700">
              Plan <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <select
              id="plan"
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 bg-white"
            >
              <option value="">No plan assigned (admin will configure later)</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — up to {p.maxActiveClients} clients
                </option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Sending invite…" : "Send invite"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/consultants")}
            className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>
    </div>
  );
}
