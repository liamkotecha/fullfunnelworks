"use client";
import { useState, useEffect, Suspense, ClipboardEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, Eye, EyeOff, Fingerprint } from "lucide-react";
import { startAuthentication } from "@simplewebauthn/browser";
import { useToast } from "@/components/notifications/ToastContext";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo_blue_650.webp"
              alt="Full Funnel"
              width={180}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <p className="text-sm text-slate-500">Growth Strategy Portal</p>
        </div>

        <div className="card">
          <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
            {(["password", "otp"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setOtpStep("email"); setCode(["", "", "", "", "", ""]); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200",
                  tab === t
                    ? "bg-white text-navy shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
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
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <div className="relative">
                  <Input
                    label="Password"
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    onKeyDown={(e) => e.key === "Enter" && handlePasswordLogin()}
                    leftIcon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  className="w-full"
                  isLoading={loading}
                  onClick={handlePasswordLogin}
                  disabled={!email || !password}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign In
                </Button>
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
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                  leftIcon={<Mail className="w-4 h-4" />}
                />
                <Button
                  className="w-full"
                  isLoading={loading}
                  onClick={handleSendOTP}
                  disabled={!email}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Send Code
                </Button>
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
                  <p className="text-sm text-slate-600">Enter the 6-digit code sent to</p>
                  <p className="font-semibold text-navy text-sm">{email}</p>
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
                        "w-12 h-12 text-center text-xl font-bold rounded-lg border-2 text-navy",
                        "focus:outline-none focus:ring-2 focus:ring-navy/30 focus:border-navy transition-all",
                        digit ? "border-navy bg-navy/5" : "border-gray-200 bg-white"
                      )}
                    />
                  ))}
                </div>
                <div className="space-y-2">
                  <Button
                    className="w-full"
                    isLoading={loading}
                    onClick={handleVerifyOTP}
                    disabled={code.join("").length !== 6}
                  >
                    Verify Code
                  </Button>
                  <button
                    onClick={() => { setOtpStep("email"); setCode(["", "", "", "", "", ""]); }}
                    className="w-full text-center text-sm text-slate-500 hover:text-navy transition-colors py-1"
                  >
                    Change email or resend
                  </button>
                </div>
                <p className="text-center text-xs text-slate-400">Code expires in 10 minutes</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Passkey sign-in — shown when browser supports it */}
          {passkeySupported && (
            <div className="mt-5 pt-5 border-t border-slate-100">
              <button
                type="button"
                onClick={handlePasskeyLogin}
                disabled={passkeyLoading}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-slate-500" />
                {passkeyLoading ? "Verifying…" : "Sign in with passkey"}
              </button>
            </div>
          )}
        </div>

        {/* Demo quick-login — only visible in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-center text-xs text-slate-400 mb-3 uppercase tracking-wide font-medium">
              Demo accounts
            </p>
            <div className="flex gap-2 justify-center flex-wrap">
              {[
                { label: "Admin",      email: "admin@demo.fullf.io",      pw: "demo1234" },
                { label: "Consultant", email: "consultant@demo.fullf.io", pw: "demo1234" },
                { label: "Client",     email: "client@demo.fullf.io",     pw: "demo1234" },
              ].map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => { setTab("password"); setEmail(d.email); setPassword(d.pw); }}
                  className="px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-600 transition-colors"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-5">
          New consultant?{" "}
          <a href="/register?role=consultant" className="font-semibold text-navy hover:underline">
            Create an account
          </a>
        </p>

        <p className="text-center text-xs text-slate-400 mt-3">
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
