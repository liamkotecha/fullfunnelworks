"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[Portal Error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-slate-900">Something went wrong</h1>
          <p className="text-sm text-slate-500">
            This page ran into an unexpected error. Your saved data is safe — try refreshing or go back.
          </p>
          {error.digest && (
            <p className="text-xs text-slate-400 font-mono">Ref: {error.digest}</p>
          )}
        </div>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => router.push("/portal/overview")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Overview
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141414] text-white text-sm font-medium hover:bg-[#1a1a1a] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
