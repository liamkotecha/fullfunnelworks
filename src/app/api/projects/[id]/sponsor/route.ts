export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import { sendEmail } from "@/lib/sendgrid";
import { sponsorInviteEmail } from "@/lib/email-templates/sponsor-invite";
import { requireAuth } from "@/lib/api-helpers";

const schema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase().trim(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin" && userOrRes.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = schema.parse(await req.json());
    await connectDB();

    const projectRaw = await Project.findById(params.id)
      .populate("clientId", "businessName")
      .lean();

    if (!projectRaw) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const project = projectRaw as unknown as Record<string, unknown>;
    const clientName =
      (project.clientId as { businessName?: string } | null)?.businessName ??
      "Your Client";
    const projectTitle = project.title as string;

    // Find or create the sponsor user
    let sponsor = await User.findOne({ email: body.email }).lean();
    const isNew = !sponsor;

    if (!sponsor) {
      sponsor = await User.create({
        name: body.name,
        email: body.email,
        role: "sponsor",
      });
    } else if ((sponsor as Record<string, unknown>).role !== "sponsor") {
      // Don't downgrade an existing admin/consultant/client to sponsor
      return NextResponse.json(
        { error: "A user with this email already exists with a different role" },
        { status: 409 }
      );
    }

    const sponsorId = (sponsor as Record<string, unknown>)._id;

    // Link sponsor to project
    await Project.findByIdAndUpdate(params.id, { sponsorId });

    const baseUrl = process.env.NEXTAUTH_URL ?? "";
    const loginUrl = `${baseUrl}/login?callbackUrl=/sponsor`;

    // Send invite email (skip in dev)
    if (process.env.NODE_ENV !== "development") {
      try {
        await sendEmail({
          to: body.email,
          subject: `You've been added as a sponsor: ${projectTitle}`,
          html: sponsorInviteEmail({
            sponsorName: body.name,
            projectTitle,
            clientName,
            loginUrl,
          }),
        });
      } catch (emailErr) {
        console.error("[SPONSOR INVITE] Email failed:", emailErr);
      }
    } else {
      console.log(`\n📧  DEV sponsor invite for ${body.email}: ${loginUrl}\n`);
    }

    return NextResponse.json({
      success: true,
      sponsorId: String(sponsorId),
      isNew,
    });
  } catch (error) {
    console.error("[SPONSOR INVITE]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to invite sponsor" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin" && userOrRes.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    await Project.findByIdAndUpdate(params.id, { $unset: { sponsorId: 1 } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[SPONSOR REMOVE]", error);
    return NextResponse.json({ error: "Failed to remove sponsor" }, { status: 500 });
  }
}
