"use client";
import { useState, Suspense, ClipboardEvent } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Mail, ArrowRight, Eye, EyeOff } from "lucide-react";
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
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/portal/overview";

  const log = (msg: string) => setDebugLog(prev => [...prev, `${new Date().toISOString().slice(11,19)} ${msg}`]);

  const handlePasswordLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setDebugLog([]);
    try {
      log("Step 1: Calling /api/auth/login...");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      log(`Step 2: Response status=${res.status}`);

      // Check Set-Cookie header
      const setCookie = res.headers.get("set-cookie");
      log(`Step 3: Set-Cookie header=${setCookie ? "present (" + setCookie.length + " chars)" : "MISSING"}`);

      const data = await res.json();
      log(`Step 4: Body=${JSON.stringify(data)}`);

      if (!res.ok) {
        toastError("Sign in failed", data.error || "Invalid email or password");
        setLoading(false);
        return;
      }

      log("Step 5: Login OK, checking session cookie...");
      const checkRes = await fetch("/api/auth/check", { credentials: "include" });
      const checkData = await checkRes.json();
      log(`Step 6: Session check=${JSON.stringify(checkData)}`);

      if (checkData.authenticated) {
        log(`Step 7: Authenticated! Redirecting to ${callbackUrl}`);
        window.location.href = callbackUrl;
      } else {
        log("Step 7: NOT authenticated after login - cookie not set!");
        toastError("Sign in failed", "Session cookie was not set. Check debug log below.");
        setLoading(false);
      }
    } catch (e) {
      log(`ERROR: ${(e as Error).message}`);
      toastError("Sign in failed", "Something went wrong");
      setLoading(false);
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
        window.location.href = callbackUrl;
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
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Private portal — authorised access only
        </p>

        {debugLog.length > 0 && (
          <div className="mt-4 p-3 bg-gray-900 text-green-400 text-xs font-mono rounded-lg max-h-48 overflow-y-auto">
            {debugLog.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}
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
