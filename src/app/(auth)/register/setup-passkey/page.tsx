"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Fingerprint, CheckCircle2, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/notifications/ToastContext";

export default function SetupPasskeyPage() {
  const [me, setMe] = useState<{ id: string; email: string; name: string } | null>(null);
  const [registering, setRegistering] = useState(false);
  const [done, setDone] = useState(false);
  const [supported, setSupported] = useState(true);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    // Check passkey support
    if (!window.PublicKeyCredential) {
      setSupported(false);
    }
    // Fetch current user from session
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.id) setMe(d); })
      .catch(() => {});
  }, []);

  const handleRegisterPasskey = async () => {
    if (!me) return;
    setRegistering(true);
    try {
      // Get registration options
      const optRes = await fetch("/api/auth/passkey/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: me.email, name: me.name }),
      });
      const { options, userId } = await optRes.json();
      if (!optRes.ok) throw new Error(options?.error ?? "Failed to get options");

      // Prompt user's authenticator
      const credential = await startRegistration(options);

      // Verify with server
      const verifyRes = await fetch("/api/auth/passkey/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "register", userId, response: credential }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) throw new Error("Verification failed");

      success("Passkey added", "You can now sign in instantly with your device.");
      setDone(true);
    } catch (e) {
      const msg = (e as Error).message;
      if (msg !== "The operation either timed out or was not allowed.") {
        toastError("Passkey setup failed", msg || "Please try again");
      }
    } finally {
      setRegistering(false);
    }
  };

  const handleContinue = () => {
    window.location.href = "/consultant/dashboard";
  };

  if (done) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md text-center card space-y-5"
        >
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-navy text-xl mb-1">You&apos;re all set!</h2>
            <p className="text-sm text-slate-500">Your account is ready and your passkey is saved. Sign in instantly next time.</p>
          </div>
          <Button className="w-full" onClick={handleContinue} rightIcon={<ArrowRight className="w-4 h-4" />}>
            Go to dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

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
        </div>

        <div className="card space-y-6">
          <div className="flex justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Fingerprint className="w-7 h-7 text-slate-600" />
            </div>
          </div>

          <div className="text-center">
            <h2 className="font-bold text-navy text-lg mb-1">Add a passkey for faster sign-in</h2>
            <p className="text-sm text-slate-500">
              Use Face ID, Touch ID or your device PIN to sign in without a password. Takes 5 seconds.
            </p>
          </div>

          {!supported ? (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-xl px-4 py-3 text-center">
              Your browser doesn&apos;t support passkeys. You can always add one later in Account Settings.
            </p>
          ) : (
            <div className="space-y-3">
              <ul className="space-y-2">
                {[
                  "No password to remember",
                  "Phishing-resistant by design",
                  "Works across your Apple or Google devices",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-slate-600">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                isLoading={registering}
                onClick={handleRegisterPasskey}
                leftIcon={!registering ? <Fingerprint className="w-4 h-4" /> : <Loader2 className="w-4 h-4 animate-spin" />}
              >
                {registering ? "Setting up passkey…" : "Add passkey"}
              </Button>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600 transition-colors py-1"
          >
            Skip for now — I&apos;ll set one up later
          </button>
        </div>
      </motion.div>
    </div>
  );
}
