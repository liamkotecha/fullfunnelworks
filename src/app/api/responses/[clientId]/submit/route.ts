export const dynamic = "force-dynamic";
/**
 * POST /api/responses/[clientId]/submit
 * Marks the current user's assessment as submitted.
 * When all members have submitted: notifies the assigned consultant.
 *
 * Dual-path: if IntakeResponse.migratedAt is set → write to new Participant model.
 * Otherwise → legacy IntakeResponse path.
 *
 * Idempotency: returns 409 if already submitted (new path only).
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, assertClientAccess, resolveClientSession } from "@/lib/api-helpers";
import IntakeResponse from "@/models/IntakeResponse";
import Client from "@/models/Client";
import Notification from "@/models/Notification";
import { sendEmail } from "@/lib/sendgrid";
import { synthesisReadyEmail } from "@/lib/email-templates/synthesis-ready";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const { clientId } = await params;

    await connectDB();

    const guard = await assertClientAccess(user, clientId);
    if (guard) return guard;

    const now = new Date();

    // ── Routing gate ──────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ───────────────────────────────────────────────────────
      const result = await IntakeResponse.findOneAndUpdate(
        { clientId, "teamMembers.userId": user.id },
        { $set: { "teamMembers.$.submittedAt": now } },
        { new: true }
      );

      if (!result) {
        return NextResponse.json({ error: "Not found or not a team member" }, { status: 404 });
      }

      const allSubmitted = result.teamMembers.every((m: { submittedAt?: Date }) => !!m.submittedAt);
      if (allSubmitted) await fireAllSubmittedNotification(clientId, result.teamMembers.length);

      return NextResponse.json({ submitted: true, allSubmitted });
    }

    // ── New model path ────────────────────────────────────────────────────────
    const { session } = resolved;
    const { default: Participant } = await import("@/models/Participant");

    const participant = await Participant.findOne({ sessionId: session._id, userId: user.id });
    if (!participant) {
      return NextResponse.json({ error: "Not a participant in this session" }, { status: 404 });
    }

    // Idempotency guard (bug fix over legacy path)
    if (participant.submittedAt) {
      const allParticipants = await Participant.find({ sessionId: session._id }).lean();
      const allSubmitted = allParticipants.every((p) => !!p.submittedAt);
      return NextResponse.json({ submitted: true, allSubmitted, alreadySubmitted: true }, { status: 409 });
    }

    participant.submittedAt = now;
    await participant.save();

    const allParticipants = await Participant.find({ sessionId: session._id }).lean() as Array<Record<string, unknown>>;
    const allSubmitted = allParticipants.every((p) => !!p.submittedAt);

    if (allSubmitted) {
      session.status = "submitted";
      await session.save();
      await fireAllSubmittedNotification(clientId, allParticipants.length);
    }

    return NextResponse.json({ submitted: true, allSubmitted });
  } catch (error) {
    console.error("[RESPONSES SUBMIT]", error);
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
  }
}

async function fireAllSubmittedNotification(clientId: string, memberCount: number) {
  try {
    const client = await Client.findById(clientId)
      .populate("assignedConsultant", "name email")
      .lean() as Record<string, unknown> | null;

    if (!client?.assignedConsultant) return;

    const consultant = client.assignedConsultant as { _id: string; name: string; email: string };
    const businessName = client.businessName as string;

    await Notification.create({
      userId: consultant._id,
      type: "success",
      title: "All assessments submitted",
      message: `All ${memberCount} team members from ${businessName} have submitted their assessments. Ready for synthesis.`,
      link: `/admin/clients/${clientId}/synthesis`,
    });

    const synthesisUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/clients/${clientId}/synthesis`;
    await sendEmail({
      to: consultant.email,
      subject: `All assessments submitted — ${businessName}`,
      html: synthesisReadyEmail({
        consultantName: consultant.name,
        clientName: businessName,
        memberCount,
        synthesisUrl,
      }),
    });
  } catch (err) {
    console.error("[SUBMIT] Notification/email failed:", err);
  }
}
