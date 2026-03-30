export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const user = await User.findById(userOrRes.id).lean() as Record<string, unknown> | null;
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const profile = (user.consultantProfile as Record<string, unknown>) ?? {};

    return NextResponse.json({
      role: user.role,
      name: user.name,
      email: user.email,
      allowedModules: (profile.allowedModules as string[]) ?? null,
      maxActiveClients: (profile.maxActiveClients as number) ?? 5,
      phone: (profile.phone as string) ?? "",
      bio: (profile.bio as string) ?? "",
      website: (profile.website as string) ?? "",
      companyName: (profile.companyName as string) ?? "",
      notifyNewClient: (profile.notifyNewClient as boolean) ?? true,
      notifyInvoicePaid: (profile.notifyInvoicePaid as boolean) ?? true,
      notifyProjectBlocked: (profile.notifyProjectBlocked as boolean) ?? true,
      notifyWeeklyDigest: (profile.notifyWeeklyDigest as boolean) ?? true,
    });
  } catch (error) {
    console.error("ME PROFILE GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const body = await req.json() as Record<string, unknown>;

    const allowed = ["name", "phone", "bio", "website", "companyName",
      "notifyNewClient", "notifyInvoicePaid", "notifyProjectBlocked", "notifyWeeklyDigest"];

    const topLevel: Record<string, unknown> = {};
    const nested: Record<string, unknown> = {};

    for (const key of allowed) {
      if (!(key in body)) continue;
      if (key === "name") {
        topLevel.name = String(body.name ?? "").trim().slice(0, 200);
      } else if (["notifyNewClient","notifyInvoicePaid","notifyProjectBlocked","notifyWeeklyDigest"].includes(key)) {
        nested[`consultantProfile.${key}`] = Boolean(body[key]);
      } else {
        nested[`consultantProfile.${key}`] = String(body[key] ?? "").trim().slice(0, 500);
      }
    }

    await User.findByIdAndUpdate(userOrRes.id, { $set: { ...topLevel, ...nested } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ME PROFILE PATCH", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
