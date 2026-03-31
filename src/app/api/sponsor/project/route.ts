export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import IntakeResponse from "@/models/IntakeResponse";
import { requireAuth, resolveClientSession } from "@/lib/api-helpers";
import { FRAMEWORK_NAV } from "@/lib/framework-nav";

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
      .lean() as Record<string, unknown> | null;

    if (!project) {
      return NextResponse.json({ error: "No project found for this sponsor" }, { status: 404 });
    }

    const clientId = String((project.clientId as Record<string, unknown>)?._id ?? project.clientId);

    // Fetch sub-section progress — dual-path
    let subSectionProgress: Record<string, { answeredCount: number; totalCount: number }> = {};
    const resolved = await resolveClientSession(clientId);
    if (resolved) {
      // New model: derive from canonical Response docs
      const { default: SessionResponse } = await import("@/models/Response");
      const respDocs = await SessionResponse.find({
        sessionId: resolved.session._id,
        participantId: null,
      }).select("fieldKey").lean() as unknown as Array<{ fieldKey: string }>;
      const answeredSet = new Set(respDocs.map((r) => r.fieldKey));
      for (const section of FRAMEWORK_NAV) {
        for (const sub of section.children) {
          subSectionProgress[sub.id] = {
            answeredCount: sub.fieldIds.filter((id) => answeredSet.has(id)).length,
            totalCount: sub.fieldIds.length,
          };
        }
        if (section.fieldIds?.length) {
          subSectionProgress[section.id] = {
            answeredCount: section.fieldIds.filter((id) => answeredSet.has(id)).length,
            totalCount: section.fieldIds.length,
          };
        }
      }
    } else {
      const intakeDoc = await IntakeResponse.findOne({ clientId })
        .select("subSectionProgress")
        .lean() as Record<string, unknown> | null;
      subSectionProgress =
        (intakeDoc?.subSectionProgress as Record<string, { answeredCount: number; totalCount: number }>) ?? {};
    }

    return NextResponse.json({ data: { project, subSectionProgress } });
  } catch (error) {
    console.error("[SPONSOR PROJECT]", error);
    return NextResponse.json({ error: "Failed to load project" }, { status: 500 });
  }
}
