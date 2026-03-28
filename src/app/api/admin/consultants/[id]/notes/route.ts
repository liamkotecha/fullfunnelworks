export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, apiError } from "@/lib/api-helpers";

/* ── POST /api/admin/consultants/[id]/notes ─────────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Note text is required" }, { status: 400 });
    }

    await connectDB();

    const updated = await User.findOneAndUpdate(
      { _id: id, role: "consultant" },
      {
        $push: {
          "consultantProfile.adminNotes": {
            $each: [{ text, createdByName: userOrRes.name ?? "Admin", createdAt: new Date() }],
            $position: 0,
          },
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    const profile = (updated as Record<string, unknown>).consultantProfile as Record<string, unknown>;
    const notes = ((profile?.adminNotes as Array<Record<string, unknown>>) ?? []).map((n) => ({
      text: n.text as string,
      createdByName: n.createdByName as string,
      createdAt: (n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as string)).toISOString(),
    }));

    return NextResponse.json({ data: notes });
  } catch (error) {
    return apiError("CONSULTANT NOTES POST", error);
  }
}

/* ── DELETE /api/admin/consultants/[id]/notes ───────────────── */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const noteIndex = parseInt(searchParams.get("index") ?? "", 10);
    if (isNaN(noteIndex) || noteIndex < 0) {
      return NextResponse.json({ error: "Invalid index" }, { status: 400 });
    }

    await connectDB();

    // Two-step delete by index: unset then pull
    const consultant = await User.findOne({ _id: id, role: "consultant" });
    if (!consultant) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const notes: Array<Record<string, unknown>> =
      (consultant.consultantProfile as Record<string, unknown>)?.adminNotes as Array<Record<string, unknown>> ?? [];
    notes.splice(noteIndex, 1);

    await User.updateOne(
      { _id: id },
      { $set: { "consultantProfile.adminNotes": notes } }
    );

    const updated = notes.map((n) => ({
      text: n.text as string,
      createdByName: n.createdByName as string,
      createdAt: (n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt as string)).toISOString(),
    }));

    return NextResponse.json({ data: updated });
  } catch (error) {
    return apiError("CONSULTANT NOTES DELETE", error);
  }
}
