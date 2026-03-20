"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ArrowLeft, ArrowRight, Send, Package, ClipboardList, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { useToast } from "@/components/notifications/ToastContext";
import { cn } from "@/lib/utils";
import { CONSULTING_PACKAGES, OnboardingStep, ONBOARDING_STEPS } from "@/types";
import { ClientDTO } from "@/types";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40, transition: { duration: 0.2 } }),
};

export default function OnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success, error: toastError, info } = useToast();
  const [client, setClient] = useState<ClientDTO | null>(null);
  const [step, setStep] = useState<OnboardingStep>("invite");
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);
  const [pkg, setPkg] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  const stepIndex = ONBOARDING_STEPS.findIndex((s) => s.id === step);

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setClient(d.data);
        if (d.data?.status === "onboarding" || d.data?.status === "active") {
          setInviteSent(true);
        }
      });
  }, [id]);

  const goTo = (target: OnboardingStep) => {
    const targetIdx = ONBOARDING_STEPS.findIndex((s) => s.id === target);
    setDir(targetIdx > stepIndex ? 1 : -1);
    setStep(target);
  };

  const next = () => {
    if (stepIndex < ONBOARDING_STEPS.length - 1) {
      goTo(ONBOARDING_STEPS[stepIndex + 1].id);
    }
  };

  const prev = () => {
    if (stepIndex > 0) {
      goTo(ONBOARDING_STEPS[stepIndex - 1].id);
    }
  };

  const handleSendInvite = async () => {
    setSaving(true);
    try {
      await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "onboarding" }),
      });
      setInviteSent(true);
      success("Invite sent", "Onboarding email dispatched to client.");
      next();
    } catch (e) {
      toastError("Failed to send invite", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePackage = async () => {
    if (!pkg) return;
    setSaving(true);
    try {
      await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ package: pkg }),
      });
      success("Package saved");
      next();
    } catch (e) {
      toastError("Failed to save package", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active", onboardingCompletedAt: new Date().toISOString() }),
      });
      success("Onboarding complete", `${client?.businessName} is now active.`);
      router.push(`/admin/clients/${id}`);
    } catch (e) {
      toastError("Failed to complete onboarding", (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const stepMeta: Record<OnboardingStep, { label: string; icon: React.ReactNode; desc: string }> = {
    invite: { label: "Invite", icon: <Send className="w-4 h-4" />, desc: "Send the client their portal invite" },
    intake: { label: "Intake", icon: <ClipboardList className="w-4 h-4" />, desc: "Review intake form progress" },
    package: { label: "Package", icon: <Package className="w-4 h-4" />, desc: "Assign a consulting package" },
    review: { label: "Review", icon: <BadgeCheck className="w-4 h-4" />, desc: "Confirm and activate the client" },
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push(`/admin/clients/${id}`)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-navy transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {client?.businessName ?? "client"}
      </button>

      {/* Progress Steps */}
      <div className="flex items-center gap-0">
        {ONBOARDING_STEPS.map((s, i) => {
          const meta = stepMeta[s.id];
          const isCurrent = s.id === step;
          const isDone = i < stepIndex;
          return (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => isDone ? goTo(s.id) : undefined}
                className={cn(
                  "flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg transition-all text-xs",
                  isCurrent && "bg-navy text-white shadow-md",
                  isDone && "text-emerald-600 cursor-pointer hover:bg-emerald-50",
                  !isCurrent && !isDone && "text-slate-400"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center",
                  isCurrent && "bg-white/20",
                  isDone && "bg-emerald-100",
                  !isCurrent && !isDone && "bg-gray-100"
                )}>
                  {isDone ? <Check className="w-4 h-4" /> : meta.icon}
                </div>
                <span className="font-medium hidden sm:block">{meta.label}</span>
              </button>
              {i < ONBOARDING_STEPS.length - 1 && (
                <div className={cn(
                  "flex-1 h-0.5 mx-1 transition-colors",
                  i < stepIndex ? "bg-emerald-300" : "bg-gray-100"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="card min-h-[280px] overflow-hidden relative">
        <AnimatePresence mode="wait" custom={dir}>
          {/* INVITE */}
          {step === "invite" && (
            <motion.div
              key="invite"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">Invite Client</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Send {client?.businessName} their portal access invite. They&apos;ll receive an email with
                  instructions to set up their account.
                </p>
              </div>
              {inviteSent ? (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-emerald-700 text-sm">Invite already sent</p>
                    <p className="text-xs text-emerald-600">Client has been invited and is in onboarding.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-navy/5 rounded-lg p-4 text-sm text-slate-600 space-y-1">
                    <p className="font-medium text-navy">What happens next:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-500 mt-1">
                      <li>Client receives a branded welcome email</li>
                      <li>They set up their passkey or OTP login</li>
                      <li>They gain access to the intake form</li>
                    </ul>
                  </div>
                  <Button
                    leftIcon={<Send className="w-4 h-4" />}
                    isLoading={saving}
                    onClick={handleSendInvite}
                  >
                    Send Invite Email
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* INTAKE */}
          {step === "intake" && (
            <motion.div
              key="intake"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">Intake Form</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Review the client&apos;s intake form progress or complete it on their behalf.
                </p>
              </div>
              <div className="bg-navy/5 rounded-lg p-4 text-sm text-slate-600 space-y-2">
                <p>The intake covers 7 sections:</p>
                <div className="grid grid-cols-2 gap-1 mt-2">
                  {["Overview", "Assessment", "People", "Product", "Process", "Roadmap", "KPIs"].map((s) => (
                    <div key={s} className="flex items-center gap-2 text-slate-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={() => {
                  info("Opening intake form", "Redirecting to the intake form for this client.");
                  router.push(`/portal/intake?clientId=${id}`);
                }}
              >
                Open Intake Form
              </Button>
            </motion.div>
          )}

          {/* PACKAGE */}
          {step === "package" && (
            <motion.div
              key="package"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">Consulting Package</h2>
                <p className="text-sm text-slate-500 mt-1">Assign a package to this client.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {CONSULTING_PACKAGES.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPkg(p.id)}
                    className={cn(
                      "text-left p-4 rounded-lg border-2 transition-all",
                      pkg === p.id
                        ? "border-navy bg-navy/5 shadow-sm"
                        : "border-gray-100 hover:border-gray-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-sm text-navy">{p.name}</span>
                      {pkg === p.id && <Check className="w-4 h-4 text-navy" />}
                    </div>
                    <p className="text-xs text-slate-500">{p.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* REVIEW */}
          {step === "review" && (
            <motion.div
              key="review"
              custom={dir}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              className="space-y-5"
            >
              <div>
                <h2 className="text-lg font-bold text-slate-900">Review & Activate</h2>
                <p className="text-sm text-slate-500 mt-1">
                  Confirm everything is in order before marking {client?.businessName} as active.
                </p>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Client invited", done: inviteSent },
                  { label: "Package assigned", done: !!pkg },
                ].map((item) => (
                  <div
                    key={item.label}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg border",
                      item.done ? "bg-emerald-50 border-emerald-100" : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center",
                      item.done ? "bg-emerald-200" : "bg-gray-200"
                    )}>
                      {item.done ? (
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                    <span className={cn("text-sm font-medium", item.done ? "text-emerald-700" : "text-slate-400")}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                isLoading={saving}
                onClick={handleComplete}
                leftIcon={<BadgeCheck className="w-4 h-4" />}
              >
                Activate Client
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <div className="flex justify-between">
        <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />} onClick={prev} disabled={stepIndex === 0}>
          Previous
        </Button>
        {step !== "review" && (
          <Button
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={step === "package" ? handleSavePackage : next}
            isLoading={step === "package" ? saving : false}
            disabled={step === "package" && !pkg}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
