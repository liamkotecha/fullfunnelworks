export const dynamic = "force-dynamic";
/**
 * GET /api/me/profile
 * Returns the authenticated user's role and (for consultants) their
 * allowedModules. Used by the client detail page to know which modules
 * are selectable by this consultant.
 */
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
      allowedModules: (profile.allowedModules as string[]) ?? null,
    });
  } catch (error) {
    console.error("ME PROFILE GET", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
