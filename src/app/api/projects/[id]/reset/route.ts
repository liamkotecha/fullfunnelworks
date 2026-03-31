export const dynamic = "force-dynamic";
/**
 * POST /api/projects/[id]/reset
 * Clears all framework responses for the project's client.
 * Admin/consultant only. Used for demo and testing purposes.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import IntakeResponse from "@/models/IntakeResponse";
import { requireAuth, resolveClientSession } from "@/lib/api-helpers";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const project = await Project.findById(params.id).select("clientId").lean<{ clientId: unknown }>();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const clientId = String(project.clientId);

    // ── Routing gate ─────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (resolved) {
      // New model path
      const { session } = resolved;
      const { default: Participant } = await import("@/models/Participant");
      const { default: SessionResponse } = await import("@/models/Response");

      await SessionResponse.deleteMany({ sessionId: session._id });
      await Participant.updateMany({ sessionId: session._id }, { $unset: { submittedAt: "" } });
      session.status = "active";
      session.lastActiveSub = "";
      session.synthesisCompletedAt = undefined;
      session.synthesisCompletedBy = undefined;
      await session.save();
    } else {
      const result = await IntakeResponse.findOneAndUpdate(
        { clientId },
        {
          $set: {
            responses: {},
            subSectionProgress: {},
            sectionProgress: {},
            individualResponses: {},
            synthesisResponses: {},
            lastActiveSub: "",
            submittedAt: null,
            synthesisCompletedAt: null,
            synthesisCompletedBy: null,
          },
        },
        { new: true }
      );

      if (!result) {
        // No responses document yet — nothing to reset
        return NextResponse.json({ message: "No responses found — nothing to reset." });
      }
    }

    return NextResponse.json({ message: "Responses cleared successfully." });
  } catch (error) {
    console.error("[PROJECT RESET]", error);
    return NextResponse.json({ error: "Failed to reset responses" }, { status: 500 });
  }
}
