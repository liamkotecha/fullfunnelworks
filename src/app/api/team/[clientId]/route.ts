export const dynamic = "force-dynamic";
/**
 * GET  /api/team/[clientId]  — list team members + their completion status
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import IntakeResponse from "@/models/IntakeResponse";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { clientId } = await params;

    await connectDB();

    const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;

    if (!doc) {
      return NextResponse.json({
        teamMode: false,
        members: [],
        allSubmitted: false,
      });
    }

    const teamMode = (doc.teamMode as boolean) ?? false;
    const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];

    const members = teamMembers.map((m) => ({
      userId: String(m.userId),
      name: m.name as string,
      email: m.email as string,
      role: m.role as string,
      invitedAt: m.invitedAt ? new Date(m.invitedAt as string).toISOString() : null,
      submittedAt: m.submittedAt ? new Date(m.submittedAt as string).toISOString() : null,
      isComplete: !!m.submittedAt,
    }));

    const allSubmitted = members.length > 0 && members.every((m) => m.isComplete);

    return NextResponse.json({
      teamMode,
      members,
      allSubmitted,
    });
  } catch (error) {
    console.error("[TEAM GET]", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
