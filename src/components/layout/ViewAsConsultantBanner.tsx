"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";

/**
 * Shown inside ConsultantShell when an admin is impersonating a consultant.
 * Reads the consultant name from the non-httpOnly cookie set by the view-as API.
 */
export default function ViewAsConsultantBanner() {
  const [consultantName, setConsultantName] = useState<string | null>(null);
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [exiting, setExiting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // The name cookie is readable by JS (httpOnly: false)
    const cookieMap = Object.fromEntries(
      document.cookie.split(";").map((c) => {
        const [k, ...v] = c.trim().split("=");
        return [k, decodeURIComponent(v.join("="))];
      })
    );
    if (cookieMap["view-as-consultant-name"]) {
      setConsultantName(cookieMap["view-as-consultant-name"]);
    }
    // Fetch the consultant ID via a server round-trip so we know where to navigate back
    fetch("/api/admin/view-as-consultant/status")
      .then((r) => r.json())
      .then((d) => { if (d.consultantId) setConsultantId(d.consultantId); })
      .catch(() => {});
  }, []);

  if (!consultantName) return null;

  async function handleExit() {
    setExiting(true);
    await fetch("/api/admin/view-as-consultant", { method: "DELETE" });
    router.push(consultantId ? `/admin/consultants/${consultantId}` : "/admin/consultants");
  }

  return (
    <div className="bg-indigo-600 text-white text-sm px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2">
        <Eye className="w-4 h-4 shrink-0" />
        <span>
          Viewing workspace as: <strong>{consultantName}</strong>
        </span>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1.5 text-indigo-200 hover:text-white transition-colors disabled:opacity-50"
      >
        <X className="w-3.5 h-3.5" />
        Exit
      </button>
    </div>
  );
}
