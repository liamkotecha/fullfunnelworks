/**
 * POST /api/responses/[clientId]/submit
 * Marks the current user's assessment as submitted.
 * When all members have submitted: notifies the assigned consultant.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
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

    // Mark the current user's submittedAt
    const now = new Date();
    const result = await IntakeResponse.findOneAndUpdate(
      { clientId, "teamMembers.userId": user.id },
      { $set: { "teamMembers.$.submittedAt": now } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json({ error: "Not found or not a team member" }, { status: 404 });
    }

    // Check if all members have now submitted
    const allSubmitted = result.teamMembers.every(
      (m: { submittedAt?: Date }) => !!m.submittedAt
    );

    if (allSubmitted) {
      // Notify the assigned consultant
      const client = await Client.findById(clientId)
        .populate("assignedConsultant", "name email")
        .lean() as Record<string, unknown> | null;

      if (client?.assignedConsultant) {
        const consultant = client.assignedConsultant as { _id: string; name: string; email: string };
        const businessName = client.businessName as string;

        // Create in-app notification
        await Notification.create({
          userId: consultant._id,
          type: "success",
          title: "All assessments submitted",
          message: `All ${result.teamMembers.length} team members from ${businessName} have submitted their assessments. Ready for synthesis.`,
          link: `/admin/clients/${clientId}/synthesis`,
        });

        // Send email
        try {
          const synthesisUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/admin/clients/${clientId}/synthesis`;
          await sendEmail({
            to: consultant.email,
            subject: `All assessments submitted — ${businessName}`,
            html: synthesisReadyEmail({
              consultantName: consultant.name,
              clientName: businessName,
              memberCount: result.teamMembers.length,
              synthesisUrl,
            }),
          });
        } catch (emailErr) {
          console.error("[SUBMIT] Email send failed:", emailErr);
        }
      }
    }

    return NextResponse.json({
      submitted: true,
      allSubmitted,
    });
  } catch (error) {
    console.error("[RESPONSES SUBMIT]", error);
    return NextResponse.json({ error: "Failed to submit assessment" }, { status: 500 });
  }
}
