import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/layout/PortalShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Portal — Full Funnel",
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user as SessionUser;

  return (
    <PortalShell
      userName={user.name}
      userEmail={user.email}
    >
      {children}
    </PortalShell>
  );
}

