"use client";
import { useState, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, Mail, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { useToast } from "@/components/notifications/ToastContext";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

function RegisterContent() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { error: toastError } = useToast();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin/dashboard";

  const passwordStrength = (() => {
    if (password.length === 0) return 0;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][passwordStrength];
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-sky-400", "bg-emerald-500"][passwordStrength];

  const handleRegister = async () => {
    if (!name.trim() || !email || !password) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: name.trim(), email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError("Registration failed", data.error || "Something went wrong");
        setLoading(false);
        return;
      }
      // Cookie is set — hard navigate
      window.location.href = callbackUrl;
    } catch {
      toastError("Registration failed", "Something went wrong");
      setLoading(false);
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
          <p className="text-sm text-slate-500">Consultant Account Registration</p>
        </div>

        <div className="card space-y-5">
          <div>
            <h2 className="font-bold text-navy text-lg mb-1">Create your account</h2>
            <p className="text-sm text-slate-500">
              Start managing your clients on the Full Funnel framework.
            </p>
          </div>

          <Input
            label="Full name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sarah Johnson"
            leftIcon={<User className="w-4 h-4" />}
          />

          <Input
            label="Work email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <div className="space-y-1.5">
            <div className="relative">
              <Input
                label="Password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                onKeyDown={(e) => e.key === "Enter" && handleRegister()}
                leftIcon={<Lock className="w-4 h-4" />}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-[38px] text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password strength bar */}
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((s) => (
                    <div
                      key={s}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-all duration-300",
                        s <= passwordStrength ? strengthColor : "bg-slate-200"
                      )}
                    />
                  ))}
                </div>
                <p className={cn(
                  "text-xs",
                  passwordStrength <= 1 ? "text-red-500" :
                  passwordStrength === 2 ? "text-amber-600" :
                  passwordStrength === 3 ? "text-sky-600" : "text-emerald-600"
                )}>
                  {strengthLabel}
                </p>
              </div>
            )}
          </div>

          <Button
            className="w-full"
            isLoading={loading}
            onClick={handleRegister}
            disabled={!name.trim() || !email || password.length < 8}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Create account
          </Button>

          {/* What you get */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">What you get</p>
            <ul className="space-y-2">
              {[
                "Client portal with 11 framework modules",
                "Pipeline, invoicing and project management",
                "PDF report generation",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-5">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-navy hover:underline">
            Sign in
          </Link>
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
