"use client";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Package,
  Loader2,
  Check,
} from "lucide-react";
import { useToast } from "@/components/notifications/ToastContext";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { formatPence } from "@/lib/format";

interface PlanOption {
  id: string;
  name: string;
  description: string | null;
  monthlyPricePence: number;
  maxActiveClients: number;
  allowedModules: string[];
  trialDays: number;
  isActive: boolean;
}

const fadeSlide = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.22 },
};

function PasswordStrength({ password }: { password: string }) {
  const score = (() => {
    if (!password) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  })();
  const color = ["", "bg-red-400", "bg-amber-400", "bg-sky-400", "bg-emerald-500"][score];
  const label = ["", "Weak", "Fair", "Good", "Strong"][score];
  const labelColor = ["", "text-red-500", "text-amber-600", "text-sky-600", "text-emerald-600"][score];
  if (!password) return null;
  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={cn("h-1 flex-1 rounded-full transition-all duration-300", s <= score ? color : "bg-slate-200")} />
        ))}
      </div>
      <p className={cn("text-xs", labelColor)}>{label}</p>
    </div>
  );
}

function RegisterContent() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  // Step 2
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  // Loading / errors
  const [loading, setLoading] = useState(false);
  const { error: toastError } = useToast();
  const searchParams = useSearchParams();
  const isConsultantFlow = searchParams.get("role") === "consultant";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  /* Step 1 → 2: register account then load plans */
  const handleStep1 = async () => {
    if (!name.trim() || !email || password.length < 8) return;
    if (!isConsultantFlow) {
      // Original single-step admin flow
      setLoading(true);
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: name.trim(), email, password }),
        });
        const data = await res.json();
        if (!res.ok) { toastError("Registration failed", data.error || "Something went wrong"); return; }
        window.location.href = callbackUrl;
      } catch {
        toastError("Registration failed", "Something went wrong");
      } finally {
        setLoading(false);
      }
      return;
    }
    // Consultant flow: go to plan selection
    setPlansLoading(true);
    setStep(2);
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans((data.data ?? []).filter((p: PlanOption) => p.isActive));
    } catch {
      toastError("Couldn't load plans", "Please refresh and try again");
    } finally {
      setPlansLoading(false);
    }
  };

  /* Step 2 → 3: validate + register account */
  const handleStep2 = async () => {
    if (!selectedPlanId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email, password, role: "consultant" }),
      });
      const data = await res.json();
      if (!res.ok) { toastError("Registration failed", data.error || "Something went wrong"); setLoading(false); return; }
      setStep(3);
    } catch {
      toastError("Registration failed", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* Step 3: redirect to Stripe checkout */
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: selectedPlanId, email, name: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) { toastError("Checkout failed", data.error || "Couldn't create checkout session"); setLoading(false); return; }
      window.location.href = data.checkoutUrl;
    } catch {
      toastError("Checkout failed", "Please try again");
      setLoading(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo_blue_650.webp" alt="Full Funnel" width={180} height={60} className="object-contain" priority />
          </div>
          {isConsultantFlow && (
            <p className="text-sm text-slate-500">Consultant Account Registration</p>
          )}
        </div>

        {/* Step indicator (consultant flow only) */}
        {isConsultantFlow && (
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                  s < step ? "bg-emerald-500 text-white" : s === step ? "bg-[#141414] text-white" : "bg-slate-200 text-slate-400"
                )}>
                  {s < step ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 3 && <div className={cn("w-8 h-0.5 rounded", s < step ? "bg-emerald-500" : "bg-slate-200")} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* ── STEP 1 ── Account details */}
          {step === 1 && (
            <motion.div key="step1" {...fadeSlide} className="card space-y-5">
              <div>
                <h2 className="font-bold text-navy text-lg mb-1">
                  {isConsultantFlow ? "Create your account" : "Create admin account"}
                </h2>
                <p className="text-sm text-slate-500">
                  {isConsultantFlow
                    ? "You'll choose your plan in the next step."
                    : "Start managing your clients on the Full Funnel framework."}
                </p>
              </div>

              <Input label="Full name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Johnson" leftIcon={<User className="w-4 h-4" />} />
              <Input label="Work email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" leftIcon={<Mail className="w-4 h-4" />} />

              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <Button className="w-full" isLoading={loading} onClick={handleStep1} disabled={!name.trim() || !email || password.length < 8} rightIcon={<ArrowRight className="w-4 h-4" />}>
                {isConsultantFlow ? "Continue to plan selection" : "Create account"}
              </Button>

              {!isConsultantFlow && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What you get</p>
                  <ul className="space-y-2">
                    {["Client portal with 11 framework modules", "Pipeline, invoicing and project management", "PDF report generation"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STEP 2 ── Plan selection */}
          {step === 2 && (
            <motion.div key="step2" {...fadeSlide} className="card space-y-5">
              <div>
                <h2 className="font-bold text-navy text-lg mb-1">Choose your plan</h2>
                <p className="text-sm text-slate-500">Select the plan that fits your consultancy.</p>
              </div>

              {plansLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : plans.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">No plans available. Please contact support.</p>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border-2 transition-all",
                        selectedPlanId === plan.id
                          ? "border-[#141414] bg-[#141414]/5"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-slate-900 text-sm">{plan.name}</p>
                            {plan.description && <p className="text-xs text-slate-500 mt-0.5">{plan.description}</p>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-bold text-slate-900 tabular-nums">{formatPence(plan.monthlyPricePence)}</p>
                          <p className="text-xs text-slate-400">/month</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-2.5 pl-6">
                        <span className="text-xs text-slate-500">Up to {plan.maxActiveClients} clients</span>
                        {plan.trialDays > 0 && (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                            {plan.trialDays}-day trial
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={() => setStep(1)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <Button className="flex-1" isLoading={loading} disabled={!selectedPlanId} onClick={handleStep2} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Continue to checkout
                </Button>
              </div>
            </motion.div>
          )}

          {/* ── STEP 3 ── Checkout confirmation */}
          {step === 3 && (
            <motion.div key="step3" {...fadeSlide} className="card space-y-5">
              <div>
                <h2 className="font-bold text-navy text-lg mb-1">Complete your subscription</h2>
                <p className="text-sm text-slate-500">You&apos;ll be taken to Stripe to enter your payment details.</p>
              </div>

              {selectedPlan && (
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-900 text-sm">{selectedPlan.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 tabular-nums">{formatPence(selectedPlan.monthlyPricePence)}/mo</span>
                  </div>
                  {selectedPlan.trialDays > 0 && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {selectedPlan.trialDays}-day free trial — no charge today
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  Account created for {email}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  Secure payment via Stripe
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  Cancel anytime from your billing settings
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <Button className="flex-1" isLoading={loading} onClick={handleCheckout} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Go to Stripe checkout
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-navy hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterContent />
    </Suspense>
  );
}

