export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, apiError } from "@/lib/api-helpers";

/* ── PATCH /api/admin/consultants/[id] ─────────────────────── */
export async function PATCH(
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

    await connectDB();

    const consultant = await User.findOne({ _id: id, role: "consultant" });
    if (!consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    // Build update
    const update: Record<string, unknown> = {};
    const unset: Record<string, unknown> = {};

    if (body.maxActiveClients !== undefined) {
      update["consultantProfile.maxActiveClients"] = Math.max(1, Math.min(20, Number(body.maxActiveClients)));
    }
    if (body.availabilityStatus !== undefined) {
      const valid = ["available", "limited", "unavailable"];
      if (valid.includes(body.availabilityStatus)) {
        update["consultantProfile.availabilityStatus"] = body.availabilityStatus;
      }
    }
    if (body.holidayUntil !== undefined) {
      if (body.holidayUntil === null) {
        unset["consultantProfile.holidayUntil"] = 1;
      } else {
        update["consultantProfile.holidayUntil"] = new Date(body.holidayUntil);
      }
    }
    if (body.specialisms !== undefined) {
      update["consultantProfile.specialisms"] = Array.isArray(body.specialisms)
        ? body.specialisms.map((s: string) => String(s).trim()).filter(Boolean)
        : [];
    }
    if (body.roundRobinWeight !== undefined) {
      update["consultantProfile.roundRobinWeight"] = Math.max(1, Math.min(5, Number(body.roundRobinWeight)));
    }

    const ops: Record<string, unknown> = {};
    if (Object.keys(update).length > 0) ops.$set = update;
    if (Object.keys(unset).length > 0) ops.$unset = unset;

    if (Object.keys(ops).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    await User.findByIdAndUpdate(id, ops);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError("CONSULTANT PATCH", error);
  }
}
