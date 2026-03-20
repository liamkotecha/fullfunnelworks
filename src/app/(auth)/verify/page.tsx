"use client";
import { useState, Suspense, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { success, error: toastError, info } = useToast();

  const emailParam = searchParams.get("email") ?? "";
  const callbackUrl = searchParams.get("callbackUrl") ?? "/portal/overview";

  const [email, setEmail] = useState(emailParam);
  const [step, setStep] = useState<"email" | "code">(emailParam ? "code" : "email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (step === "code") {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  const handleSendOTP = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setStep("code");
      info("Code sent", `Check ${email} for your 6-digit code.`);
    } catch (e) {
      toastError("Failed to send code", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeStr }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const { userId } = await res.json();

      const result = await signIn("otp", { userId, redirect: false, callbackUrl });
      if (result?.ok) {
        setDone(true);
        success("Welcome back!", "You're now signed in.");
        setTimeout(() => router.push(callbackUrl), 800);
      } else {
        throw new Error(result?.error ?? "Sign in failed");
      }
    } catch (e) {
      toastError("Verification failed", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (val: string, idx: number) => {
    if (!/^[0-9]*$/.test(val)) return;
    const updated = [...code];
    updated[idx] = val.slice(-1);
    setCode(updated);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (updated.every((d) => d !== "") && !updated.includes("")) {
      // auto-submit when last digit entered
      setTimeout(() => {
        const el = document.getElementById("verify-btn") as HTMLButtonElement | null;
        el?.click();
      }, 100);
    }
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !code[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-navy mb-4">
            <span className="text-gold font-black text-lg tracking-widest">FF</span>
          </div>
          <h1 className="text-2xl font-serif text-navy mb-1">FULL FUNNEL</h1>
          <p className="text-sm text-slate-500">Growth Strategy Portal</p>
        </div>

        <div className="card">
          <AnimatePresence mode="wait">
            {/* SUCCESS STATE */}
            {done && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-3"
              >
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
                <p className="font-semibold text-navy">Signed in — redirecting…</p>
              </motion.div>
            )}

            {/* EMAIL STEP */}
            {!done && step === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-navy">Verify your email</h2>
                    <p className="text-xs text-slate-500">We&apos;ll send you a one-time code</p>
                  </div>
                </div>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                />
                <Button className="w-full" isLoading={loading} onClick={handleSendOTP} disabled={!email}>
                  Send Code
                </Button>
              </motion.div>
            )}

            {/* CODE STEP */}
            {!done && step === "code" && (
              <motion.div
                key="code"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="font-semibold text-navy mb-1">Enter your code</h2>
                  <p className="text-sm text-slate-500">
                    A 6-digit code was sent to{" "}
                    <span className="font-medium text-navy">{email}</span>. It expires in 10 minutes.
                  </p>
                </div>

                <div className="flex gap-2 justify-between">
                  {code.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`verify-otp-${idx}`}
                      ref={(el) => { inputRefs.current[idx] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(e.target.value, idx)}
                      onKeyDown={(e) => handleCodeKeyDown(e, idx)}
                      className="w-11 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-xl bg-white text-navy focus:border-navy focus:outline-none transition-colors"
                    />
                  ))}
                </div>

                <div className="space-y-2">
                  <Button
                    id="verify-btn"
                    className="w-full"
                    isLoading={loading}
                    onClick={handleVerify}
                    disabled={code.join("").length !== 6}
                  >
                    Verify &amp; Sign In
                  </Button>
                  <button
                    type="button"
                    onClick={() => { setStep("email"); setCode(["", "", "", "", "", ""]); }}
                    className="w-full text-xs text-slate-400 hover:text-navy transition-colors py-1"
                  >
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
