import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/layout/AdminShell";
import type { SessionUser } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin — Full Funnel",
};

export default async function AdminLayout({
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
    <AdminShell userName={user.name} userEmail={user.email}>
      {children}
    </AdminShell>
  );
}
