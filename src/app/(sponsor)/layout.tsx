import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sponsor View — Full Funnel",
};

export default async function SponsorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/sponsor");
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "sponsor" && role !== "admin") {
    redirect("/portal/overview");
  }

  return (
    <div className="min-h-screen bg-[#F5F5F3]">
      {/* Minimal header */}
      <header className="bg-[#141414] px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1
            className="font-bold text-xl tracking-widest"
            style={{ color: "#6CC2FF", fontFamily: "Georgia, serif" }}
          >
            FULL FUNNEL
          </h1>
          <p className="text-white/40 text-sm">Sponsor View</p>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
