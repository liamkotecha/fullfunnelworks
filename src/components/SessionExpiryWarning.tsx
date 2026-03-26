/**
 * SessionExpiryWarning — shows a banner when the NextAuth JWT session is
 * within WARN_HOURS of expiring. Lets the user renew without a full sign-out.
 */
"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { AlertTriangle, X, RefreshCw } from "lucide-react";

const WARN_HOURS = 48; // show banner when fewer than 48 h remain

export function SessionExpiryWarning() {
  const { data: session, update } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [hoursLeft, setHoursLeft] = useState<number | null>(null);
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    if (!session?.expires) return;
    const expiresMs = new Date(session.expires).getTime();

    const tick = () => {
      const ms = expiresMs - Date.now();
      setHoursLeft(ms / (1000 * 60 * 60));
    };

    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [session?.expires]);

  if (dismissed || hoursLeft === null || hoursLeft > WARN_HOURS || hoursLeft <= 0) {
    return null;
  }

  const label =
    hoursLeft < 1
      ? "Your session expires in less than an hour."
      : hoursLeft < 24
      ? `Your session expires in ${Math.floor(hoursLeft)} hours.`
      : `Your session expires in ${Math.round(hoursLeft / 24)} days.`;

  const handleRenew = async () => {
    setRenewing(true);
    await update();
    setDismissed(true);
    setRenewing(false);
  };

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl shadow-lg px-4 py-3 text-sm text-amber-900 max-w-sm w-full"
    >
      <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
      <span className="flex-1 leading-snug">{label}</span>
      <button
        onClick={handleRenew}
        disabled={renewing}
        className="flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 disabled:opacity-50 transition-colors"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${renewing ? "animate-spin" : ""}`} />
        Renew
      </button>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-amber-400 hover:text-amber-700 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
