export const dynamic = "force-dynamic";
/**
 * POST /api/team/invite
 * Invite a team member to collaborate on the assessment.
 *
 * Body: { clientId, email, name, role }
 * - Admin/consultant only
 * - Find or create User
 * - Add to Client.teamUserIds (access gating — always kept in sync)
 * - New model path: create Participant, set Session.teamMode = true
 * - Legacy path: upsert IntakeResponse.teamMembers
 * - Send invite email
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, resolveClientSession } from "@/lib/api-helpers";
import User from "@/models/User";
import Client from "@/models/Client";
import IntakeResponse from "@/models/IntakeResponse";
import { sendEmail } from "@/lib/sendgrid";
import { teamInviteEmail } from "@/lib/email-templates/team-invite";
import { z } from "zod";

const bodySchema = z.object({
  clientId: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.string().default(""),
});

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const admin = userOrRes;

    if (admin.role !== "admin" && admin.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { clientId, email, name, role } = parsed.data;

    await connectDB();

    // 1. Find or create user
    let teamUser = await User.findOne({ email: email.toLowerCase() });
    if (!teamUser) {
      teamUser = await User.create({
        email: email.toLowerCase(),
        name,
        role: "client",
      });
    }

    // 2. Find client
    const client = await Client.findById(clientId).populate("userId", "name email");
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Consultants can only invite to their own clients
    if (admin.role === "consultant" && String(client.assignedConsultant) !== admin.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3. Add to Client.teamUserIds (idempotent)
    const alreadyLinked = client.teamUserIds?.some(
      (uid: { toString: () => string }) => uid.toString() === teamUser!._id.toString()
    );
    if (!alreadyLinked) {
      await Client.updateOne(
        { _id: clientId },
        { $addToSet: { teamUserIds: teamUser._id } }
      );
    }

    // 4. Add to session or legacy IntakeResponse
    const resolved = await resolveClientSession(clientId);

    if (resolved) {
      // ── New model path ───────────────────────────────────────
      const { session } = resolved;
      const { default: Participant } = await import("@/models/Participant");

      const alreadyParticipant = await Participant.exists({ sessionId: session._id, userId: teamUser._id });
      if (alreadyParticipant) {
        return NextResponse.json({ error: "User is already a participant in this session" }, { status: 409 });
      }

      await Participant.create({
        sessionId: session._id,
        userId: teamUser._id,
        role,
        invitedAt: new Date(),
        invitedBy: admin.id,
      });

      if (!session.teamMode) {
        session.teamMode = true;
        await session.save();
      }
    } else {
      // ── Legacy path ───────────────────────────────────────
      const memberEntry = {
        userId: teamUser._id,
        name,
        email: email.toLowerCase(),
        role,
        invitedAt: new Date(),
        invitedBy: admin.id,
      };

      const existingIntake = await IntakeResponse.findOne({ clientId, "teamMembers.userId": teamUser._id });
      if (!existingIntake) {
        await IntakeResponse.findOneAndUpdate(
          { clientId },
          { $set: { teamMode: true }, $push: { teamMembers: memberEntry } },
          { upsert: true, new: true }
        );
      } else {
        await IntakeResponse.updateOne({ clientId }, { $set: { teamMode: true } });
      }
    }

    // 5. Send invite email
    const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/portal/assessment`;
    const inviterName = admin.name ?? "Your consultant";
    const clientName = client.businessName;

    try {
      await sendEmail({
        to: email.toLowerCase(),
        subject: `You've been invited to complete an assessment — ${clientName}`,
        html: teamInviteEmail({
          recipientName: name,
          clientName,
          inviterName,
          role,
          portalUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[TEAM INVITE] Email send failed:", emailErr);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      userId: teamUser._id.toString(),
      name,
      email: email.toLowerCase(),
      role,
    });
  } catch (error) {
    console.error("[TEAM INVITE]", error);
    return NextResponse.json({ error: "Failed to invite team member" }, { status: 500 });
  }
}
