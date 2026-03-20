export const dynamic = "force-dynamic";
/**
 * POST /api/projects/[id]/activity
 * Update lastActivityAt to now. Resets staleness to "active" if currently
 * "nudge" or "stalled". Does NOT reset "at_risk" or "terminated" — those
 * require consultant action.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { requireAuth, apiError } from "@/lib/api-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await connectDB();

    const project = await Project.findById(id).select("staleness").lean() as {
      staleness?: string;
    } | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const update: Record<string, unknown> = {
      lastActivityAt: new Date(),
    };

    // Reset staleness only if nudge or stalled
    const currentStaleness = project.staleness ?? "active";
    if (currentStaleness === "nudge" || currentStaleness === "stalled") {
      update.staleness = "active";
    }

    await Project.updateOne({ _id: id }, { $set: update });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("PROJECT_ACTIVITY_POST", err);
  }
}
