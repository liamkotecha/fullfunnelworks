import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ConsultantShell } from "@/components/layout/ConsultantShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Workspace — Full Funnel",
};

export default async function ConsultantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  // Admins can impersonate — allow admin role through too
  if (user.role !== "consultant" && user.role !== "admin") {
    redirect("/login");
  }

  return (
    <ConsultantShell userName={user.name} userEmail={user.email}>
      {children}
    </ConsultantShell>
  );
}
