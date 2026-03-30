"use client";
import { useState, useEffect, Suspense, ClipboardEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Fingerprint } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useToast } from "@/components/notifications/ToastContext";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Tab = "password" | "otp";

function LoginContent() {
  const [tab, setTab] = useState<Tab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [otpStep, setOtpStep] = useState<"email" | "code">("email");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/portal/overview";

  useEffect(() => {
    setPasskeySupported(!!window.PublicKeyCredential);
  }, []);

  function redirectAfterLogin(role: string) {
    if (role === "admin") return "/admin/dashboard";
    if (role === "consultant") return "/consultant/dashboard";
    if (role === "sponsor") return "/sponsor";
    return callbackUrl;
  }

  const handlePasswordLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Sign in failed", data.error || "Invalid email or password");
        setLoading(false);
        return;
      }
      // Cookie is set — hard navigate to pick it up
      window.location.href = redirectAfterLogin(data.user?.role ?? "");
    } catch {
      toastError("Sign in failed", "Something went wrong");
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setPasskeyLoading(true);
    try {
      // 1. Get authentication options from server
      const optRes = await fetch("/api/auth/passkey/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email || undefined }),
      });
      const { options } = await optRes.json();
      if (!optRes.ok) throw new Error("Failed to get options");

      // 2. Prompt the user's authenticator
      const credential = await startAuthentication(options);

      // 3. Verify with server
      const verifyRes = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "authenticate", email, response: credential, challenge: options.challenge }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) throw new Error(verifyData.error ?? "Passkey authentication failed");

      // 4. Issue session cookie
      const loginRes = await fetch("/api/auth/login-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId: verifyData.userId }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.error ?? "Session error");

      window.location.href = redirectAfterLogin(loginData.user?.role ?? "");
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "The operation either timed out or was not allowed.") {
        toastError("Passkey sign-in failed", msg || "Please try another method");
      }
    } finally {
      setPasskeyLoading(false);
    }
  };

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
      setOtpStep("code");
      success("Code sent", "Check your terminal / email for the 6-digit code");
    } catch (e) {
      toastError("Failed to send code", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const codeStr = code.join("");
    if (codeStr.length !== 6) return;
    setLoading(true);
    try {
      const verifyRes = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeStr }),
      });
      if (!verifyRes.ok) throw new Error((await verifyRes.json()).error);
      const { userId } = await verifyRes.json();
      const loginRes = await fetch("/api/auth/login-by-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        toastError("Invalid code", loginData.error);
      } else {
        const dest = loginData.user?.needsOnboarding
          ? "/onboarding"
          : redirectAfterLogin(loginData.user?.role ?? "");
        window.location.href = dest;
      }
    } catch (e) {
      toastError("Invalid code", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (value: string, index: number) => {
    if (!/^[0-9]*$/.test(value)) return;
    const updated = [...code];
    updated[index] = value.slice(-1);
    setCode(updated);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleCodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleCodePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const digits = pasted.split("");
    const updated = ["", "", "", "", "", ""];
    digits.forEach((d, i) => { updated[i] = d; });
    setCode(updated);
    const nextEmpty = digits.length < 6 ? digits.length : 5;
    const el = document.getElementById(`otp-${nextEmpty}`);
    el?.focus();
  };

  return (
    <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center p-4">
      {/* Subtle radial glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-brand-blue/[0.07] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md relative"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo_blue_650.webp"
              alt="Full Funnel"
              width={160}
              height={54}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-white/40 tracking-wide">Growth Strategy Portal</p>
        </div>

        <div className="bg-[#161616] rounded-xl ring-1 ring-white/[0.07] shadow-2xl p-6">
          {/* Tab switcher */}
          <div className="flex bg-[#0d0d0d] rounded-lg p-1 mb-6 ring-1 ring-white/[0.05]">
            {(["password", "otp"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setOtpStep("email"); setCode(["", "", "", "", "", ""]); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-semibold transition-all duration-200",
                  tab === t
                    ? "bg-white/[0.1] text-white shadow-sm"
                    : "text-white/35 hover:text-white/60"
                )}
              >
                {t === "password" ? <Lock className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                {t === "password" ? "Password" : "Email Code"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {tab === "password" && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue/50 transition-all"
                    />
                  </div>
                </div>
                {/* Password */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      aria-label={showPw ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  onClick={handlePasswordLogin}
                  disabled={!email || !password || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue text-[#141414] text-sm font-bold transition-all hover:bg-brand-blue/90 hover:shadow-[0_0_24px_rgba(108,194,255,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>Sign In <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            )}

            {tab === "otp" && otpStep === "email" && (
              <motion.div
                key="otp-email"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider">Email address</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.06] border border-white/[0.1] text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-brand-blue/40 focus:border-brand-blue/50 transition-all"
                    />
                  </div>
                </div>
                <button
                  onClick={handleSendOTP}
                  disabled={!email || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue text-[#141414] text-sm font-bold transition-all hover:bg-brand-blue/90 hover:shadow-[0_0_24px_rgba(108,194,255,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <>Send Code <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </motion.div>
            )}

            {tab === "otp" && otpStep === "code" && (
              <motion.div
                key="otp-code"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div className="text-center">
                  <p className="text-sm text-white/50">Enter the 6-digit code sent to</p>
                  <p className="font-semibold text-white text-sm mt-0.5">{email}</p>
                </div>
                <div className="flex gap-2 justify-center">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeInput(e.target.value, i)}
                      onKeyDown={(e) => handleCodeKeyDown(e, i)}
                      onPaste={handleCodePaste}
                      className={cn(
                        "w-12 h-12 text-center text-xl font-bold rounded-lg border-2 text-white transition-all",
                        "focus:outline-none focus:ring-2 focus:ring-brand-blue/40",
                        digit
                          ? "border-brand-blue/60 bg-brand-blue/10"
                          : "border-white/[0.1] bg-white/[0.05]"
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handleVerifyOTP}
                    disabled={code.join("").length !== 6 || loading}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-blue text-[#141414] text-sm font-bold transition-all hover:bg-brand-blue/90 hover:shadow-[0_0_24px_rgba(108,194,255,0.3)] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : "Verify Code"}
                  </button>
                  <button
                    onClick={() => { setOtpStep("email"); setCode(["", "", "", "", "", ""]); }}
                    className="w-full text-center text-sm text-white/35 hover:text-white/60 transition-colors py-1"
                  >
                    Change email or resend
                  </button>
                </div>
                <p className="text-center text-xs text-white/25">Code expires in 10 minutes</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Passkey sign-in */}
          {passkeySupported && (
            <div className="mt-5 pt-5 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-lg border border-white/[0.1] bg-white/[0.04] text-sm font-medium text-white/60 hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.18] transition-all disabled:opacity-40"
              >
                <Fingerprint className="w-4 h-4" />
                {passkeyLoading ? "Verifying…" : "Sign in with passkey"}
              </button>
            </div>
          )}
        </div>

        {/* Demo quick-login — only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-5 border-t border-white/[0.06]">
            <p className="text-center text-xs text-white/25 mb-3 uppercase tracking-wide font-medium">
              Demo accounts
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { label: "Admin",      email: "admin@fullfunnelworks.co.uk",       pw: "admin123" },
                { label: "Consultant", email: "consultant1@fullfunnelworks.co.uk", pw: "admin123" },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => { setTab("password"); setEmail(d.email); setPassword(d.pw); }}
                  className="px-3 py-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-xs font-medium text-white/50 hover:text-white/80 transition-colors border border-white/[0.08]"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-sm text-white/35 mt-5">
          New consultant?{" "}
          <a href="/register?role=consultant" className="font-semibold text-brand-blue hover:text-brand-blue/80 transition-colors">
            Create an account
          </a>
        </p>

        <p className="text-center text-xs text-white/20 mt-3">
          Private portal — authorised access only
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
