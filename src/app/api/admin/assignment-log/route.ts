export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import AssignmentLog from "@/models/AssignmentLog";
import Prospect from "@/models/Prospect";
import { requireAuth, apiError } from "@/lib/api-helpers";

/* ── GET /api/admin/assignment-log ─────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 50), 200);

    const logs = await AssignmentLog.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Enrich with prospect names
    const prospectIds = logs.map((l) => (l as Record<string, unknown>).prospectId);
    const prospects = await Prospect.find({ _id: { $in: prospectIds } })
      .select("_id businessName")
      .lean();
    const prospectMap = new Map(
      (prospects as Record<string, unknown>[]).map((p) => [String(p._id), String(p.businessName ?? "")])
    );

    const data = (logs as Record<string, unknown>[]).map((l) => ({
      id: String(l._id),
      prospectId: String(l.prospectId),
      prospectName: prospectMap.get(String(l.prospectId)) ?? "",
      assignedTo: l.assignedTo ? String(l.assignedTo) : null,
      assignedToName: (l.assignedToName as string) || null,
      reason: String(l.reason),
      skipped: l.skipped as { consultantId: string; name: string; reason: string }[],
      autoAssigned: Boolean(l.autoAssigned),
      createdAt: new Date(l.createdAt as string).toISOString(),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return apiError("ASSIGNMENT_LOG GET", error);
  }
}
