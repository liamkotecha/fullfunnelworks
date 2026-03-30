export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import IntakeResponse from "@/models/IntakeResponse";
import { requireAuth } from "@/lib/api-helpers";

/**
 * GET /api/sponsor/project
 * Returns the project + overall sub-section progress for the authenticated sponsor.
 */
export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id: userId, role } = userOrRes;

    if (role !== "sponsor" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const project = await Project.findOne({ sponsorId: userId })
      .populate("assignedTo", "name email")
      .populate("clientId", "businessName")
      .lean();

    if (!project) {
      return NextResponse.json({ error: "No project found for this sponsor" }, { status: 404 });
    }

    const clientId = String((project.clientId as Record<string, unknown>)?._id ?? project.clientId);

    // Fetch sub-section progress from IntakeResponse
    const intakeDoc = await IntakeResponse.findOne({ clientId })
      .select("subSectionProgress")
      .lean() as Record<string, unknown> | null;

    const subSectionProgress =
      (intakeDoc?.subSectionProgress as Record<string, { answeredCount: number; totalCount: number }>) ?? {};

    return NextResponse.json({ data: { project, subSectionProgress } });
  } catch (error) {
    console.error("[SPONSOR PROJECT]", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
