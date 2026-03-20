export const dynamic = "force-dynamic";
/**
 * DELETE /api/team/[clientId]/[userId] — remove a team member
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
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

    // Remove from Client.teamUserIds
    await Client.updateOne(
      { _id: clientId },
      { $pull: { teamUserIds: userId } }
    );

    // Remove from IntakeResponse.teamMembers
    await IntakeResponse.updateOne(
      { clientId },
      { $pull: { teamMembers: { userId } } }
    );

    // Remove individual responses for this user
    await IntakeResponse.updateOne(
      { clientId },
      { $unset: { [`individualResponses.${userId}`]: "" } }
    );

    // If no team members left, turn off team mode
    const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
    const remaining = (doc?.teamMembers as Array<unknown>)?.length ?? 0;
    if (remaining === 0) {
      await IntakeResponse.updateOne({ clientId }, { $set: { teamMode: false } });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[TEAM DELETE]", error);
    return NextResponse.json({ error: "Failed to remove team member" }, { status: 500 });
  }
}
