"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * This page has moved to /portal/process/builder.
 * Redirect to keep any saved links working.
 */
export default function Page() {
  const router = useRouter();
  useEffect(() => { router.replace("/portal/process/builder"); }, [router]);
  return null;
}
