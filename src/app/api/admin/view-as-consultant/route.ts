export const dynamic = "force-dynamic";
/**
 * POST /api/admin/view-as-consultant  — admin impersonates a consultant
 * DELETE /api/admin/view-as-consultant — exits impersonation
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth } from "@/lib/api-helpers";

export async function POST(req: NextRequest) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;
  if (userOrRes.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { consultantId } = await req.json();
  if (!consultantId) {
    return NextResponse.json({ error: "consultantId required" }, { status: 400 });
  }

  await connectDB();
  const consultant = await User.findById(consultantId).lean() as { _id: { toString: () => string }; name: string; role: string } | null;
  if (!consultant || consultant.role !== "consultant") {
    return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("view-as-consultant-id", consultant._id.toString(), {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60, // 1 hour
    sameSite: "lax",
  });
  res.cookies.set("view-as-consultant-name", consultant.name, {
    httpOnly: false, // readable by client for banner display
    path: "/",
    maxAge: 60 * 60,
    sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;
  if (userOrRes.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const res = NextResponse.json({ ok: true });
  res.cookies.delete("view-as-consultant-id");
  res.cookies.delete("view-as-consultant-name");
  return res;
}
