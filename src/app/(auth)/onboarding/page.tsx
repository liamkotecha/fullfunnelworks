"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Fingerprint,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import { cn } from "@/lib/utils";

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

export default function OnboardingPage() {
  const [step, setStep] = useState<"password" | "passkey" | "done">("password");
  const [me, setMe] = useState<{ id: string; email: string; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    setPasskeySupported(!!window.PublicKeyCredential);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.id) setMe(d); })
      .catch(() => {});
  }, []);

  const handleSetPassword = async () => {
    if (password.length < 8 || password !== confirm) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/onboarding/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) { toastError("Failed", data.error || "Could not set password"); return; }
      success("Password saved", "You can now sign in with your password.");
      setStep("passkey");
    } catch {
      toastError("Error", "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!me) return;
    setLoading(true);
    try {
      const optRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: me.email, name: me.name }),
      });
      const { options, userId } = await optRes.json();
      if (!optRes.ok) throw new Error("Failed to get options");

      const credential = await startRegistration(options);

      const verifyRes = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "register", userId, response: credential }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) throw new Error("Verification failed");

      success("Passkey added", "Your device is now registered for instant sign-in.");
      setStep("done");
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "The operation either timed out or was not allowed.") {
        toastError("Passkey setup failed", msg || "Please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  const fadeSlide = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.22 },
  };

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
          <p className="text-sm text-slate-500">Welcome to Full Funnel Works</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {(["password", "passkey"] as const).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                (step === "done" || (step === "passkey" && s === "password"))
                  ? "bg-emerald-500 text-white"
                  : step === s
                    ? "bg-[#141414] text-white"
                    : "bg-slate-200 text-slate-400"
              )}>
                {(step === "done" || (step === "passkey" && s === "password")) ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (i + 1)}
              </div>
              {i < 1 && <div className={cn("w-8 h-0.5 rounded", step !== "password" ? "bg-emerald-500" : "bg-slate-200")} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Set password ── */}
          {step === "password" && (
            <motion.div key="pw" {...fadeSlide} className="card space-y-5">
              <div>
                <h2 className="font-bold text-navy text-lg mb-1">Set your password</h2>
                <p className="text-sm text-slate-500">
                  Create a password for {me?.email ?? "your account"}. You&apos;ll use this to sign in.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="relative">
                  <Input
                    label="New password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors" tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              <Input
                label="Confirm password"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Repeat password"
                onKeyDown={(e) => e.key === "Enter" && handleSetPassword()}
                leftIcon={<Lock className="w-4 h-4" />}
              />

              {confirm && password !== confirm && (
                <p className="text-xs text-red-500">Passwords don&apos;t match</p>
              )}

              <Button
                className="w-full"
                isLoading={loading}
                disabled={password.length < 8 || password !== confirm}
                onClick={handleSetPassword}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Set password &amp; continue
              </Button>
            </motion.div>
          )}

          {/* ── Step 2: Add passkey (optional) ── */}
          {step === "passkey" && (
            <motion.div key="pk" {...fadeSlide} className="card space-y-6">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <Fingerprint className="w-7 h-7 text-slate-600" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="font-bold text-navy text-lg mb-1">Add a passkey</h2>
                <p className="text-sm text-slate-500">
                  Use Face ID, Touch ID or your device PIN to sign in instantly — no password needed.
                </p>
              </div>

              {passkeySupported ? (
                <div className="space-y-3">
                  <ul className="space-y-2">
                    {["No password to type", "Phishing-resistant by design", "Works on all your Apple or Google devices"].map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    isLoading={loading}
                    onClick={handleRegisterPasskey}
                    leftIcon={<Fingerprint className="w-4 h-4" />}
                  >
                    Add passkey
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 text-center">
                  Your browser doesn&apos;t support passkeys yet. You can add one later in Account Settings.
                </p>
              )}

              <button
                onClick={() => setStep("done")}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
              >
                Skip — I&apos;ll set one up later
              </button>
            </motion.div>
          )}

          {/* ── Done ── */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card text-center space-y-5"
            >
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <div>
                <h2 className="font-bold text-navy text-xl mb-1">
                  You&apos;re all set{me?.name ? `, ${me.name.split(" ")[0]}` : ""}!
                </h2>
                <p className="text-sm text-slate-500">Your account is ready to go.</p>
              </div>
              <Button className="w-full" onClick={() => { window.location.href = "/consultant/dashboard"; }} rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to dashboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
