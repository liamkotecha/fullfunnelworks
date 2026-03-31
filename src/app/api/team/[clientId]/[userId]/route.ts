export const dynamic = "force-dynamic";
/**
 * DELETE /api/team/[clientId]/[userId] — remove a team member
 *
 * Dual-path: if IntakeResponse.migratedAt is set → delete Participant + their Response docs.
 * Otherwise → legacy IntakeResponse path.
 * Always syncs Client.teamUserIds (access gating).
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, resolveClientSession } from "@/lib/api-helpers";
import Client from "@/models/Client";
import IntakeResponse from "@/models/IntakeResponse";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; userId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const admin = userOrRes;

    if (admin.role !== "admin" && admin.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId, userId } = await params;

    await connectDB();

    if (admin.role === "consultant") {
      const clientDoc = await Client.findById(clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== admin.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Routing gate ──────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (resolved) {
      // ── New model path ──────────────────────────────────────────────────────
      const { session } = resolved;
      const { default: Participant } = await import("@/models/Participant");
      const { default: Response } = await import("@/models/Response");

      const participant = await Participant.findOne({ sessionId: session._id, userId });
      if (participant) {
        // Delete participant's individual responses
        await Response.deleteMany({ sessionId: session._id, participantId: participant._id });
        await participant.deleteOne();
      }

      // Turn off teamMode if no participants remain
      const remaining = await Participant.countDocuments({ sessionId: session._id });
      if (remaining === 0 && session.teamMode) {
        session.teamMode = false;
        await session.save();
      }
    } else {
      // ── Legacy path ──────────────────────────────────────────────────────────
      await IntakeResponse.updateOne({ clientId }, { $pull: { teamMembers: { userId } } });
      await IntakeResponse.updateOne({ clientId }, { $unset: { [`individualResponses.${userId}`]: "" } });

      const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
      const remaining = (doc?.teamMembers as Array<unknown>)?.length ?? 0;
      if (remaining === 0) {
        await IntakeResponse.updateOne({ clientId }, { $set: { teamMode: false } });
      }
    }

    // Always sync Client.teamUserIds (access gating — kept on both paths)
    await Client.updateOne({ _id: clientId }, { $pull: { teamUserIds: userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEAM DELETE]", error);
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}

