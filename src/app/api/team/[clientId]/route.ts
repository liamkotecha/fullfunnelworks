export const dynamic = "force-dynamic";
/**
 * GET /api/team/[clientId] — list team members + their completion status
 *
 * Dual-path: if IntakeResponse.migratedAt is set → read from new Participant model.
 * Otherwise → legacy IntakeResponse path.
 * Response shape is identical on both paths.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, assertClientAccess, resolveClientSession } from "@/lib/api-helpers";
import IntakeResponse from "@/models/IntakeResponse";

const EMPTY = { teamMode: false, members: [], allSubmitted: false };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { clientId } = await params;

    await connectDB();

    const guard = await assertClientAccess(userOrRes, clientId);
    if (guard) return guard;

    // ── Routing gate ─────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ────────────────────────────────────────
      const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
      if (!doc) return NextResponse.json(EMPTY);

      const teamMode = (doc.teamMode as boolean) ?? false;
      const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];
      const members = teamMembers.map((m) => ({
        userId: String(m.userId), name: m.name as string, email: m.email as string,
        role: m.role as string,
        invitedAt: m.invitedAt ? new Date(m.invitedAt as string).toISOString() : null,
        submittedAt: m.submittedAt ? new Date(m.submittedAt as string).toISOString() : null,
        isComplete: !!m.submittedAt,
      }));
      return NextResponse.json({ teamMode, members, allSubmitted: members.length > 0 && members.every((m) => m.isComplete) });
    }

    // ── New model path ───────────────────────────────────────
    const { session } = resolved;
    const { default: Participant } = await import("@/models/Participant");

    const participants = await Participant.find({ sessionId: session._id })
      .populate("userId", "name email")
      .lean() as Array<Record<string, unknown>>;

    const members = participants.map((p) => {
      const u = p.userId as Record<string, unknown>;
      return {
        userId: String(u?._id ?? p.userId),
        name: (u?.name as string) ?? "",
        email: (u?.email as string) ?? "",
        role: (p.role as string) ?? "",
        invitedAt: p.invitedAt ? new Date(p.invitedAt as string).toISOString() : null,
        submittedAt: p.submittedAt ? new Date(p.submittedAt as string).toISOString() : null,
        isComplete: !!p.submittedAt,
      };
    });

    return NextResponse.json({
      teamMode: session.teamMode,
      members,
      allSubmitted: members.length > 0 && members.every((m) => m.isComplete),
    });
  } catch (error) {
    console.error("[TEAM GET]", error);
    return NextResponse.json({ error: "Failed to fetch team" }, { status: 500 });
  }
}
