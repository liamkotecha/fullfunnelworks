export const dynamic = "force-dynamic";
/**
 * POST /api/admin/consultants/invite
 * Create a new consultant account and send them a welcome email with their OTP.
 *
 * Body: { email, name }
 * Auth: admin only.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { generateAndStoreOTP } from "@/lib/otp";
import { sendEmail } from "@/lib/sendgrid";
import { consultantWelcomeEmail } from "@/lib/email-templates/consultant-welcome";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, name } = parsed.data;
    const normEmail = email.toLowerCase();

    await connectDB();

    // Check for existing user
    const existing = await User.findOne({ email: normEmail });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create consultant account
    const consultant = await User.create({
      email: normEmail,
      name,
      role: "consultant",
      consultantProfile: {
        maxActiveClients: 5,
        allowedModules: [],
        availabilityStatus: "available",
        specialisms: [],
        roundRobinWeight: 1,
        totalLeadsAssigned: 0,
      },
    });

    // Generate OTP so they can sign in immediately
    const otp = await generateAndStoreOTP(normEmail);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const loginUrl = `${appUrl}/login?email=${encodeURIComponent(normEmail)}&code=${otp}`;
    const dashboardUrl = `${appUrl}/consultant/dashboard`;

    // Send welcome email — include OTP in the dashboard URL as a one-time auto-login link
    try {
      await sendEmail({
        to: normEmail,
        subject: "Welcome to Full Funnel Works — your consultant account is ready",
        html: consultantWelcomeEmail({ name, dashboardUrl: loginUrl }),
      });
    } catch (emailErr) {
      console.error("[CONSULTANT INVITE] Email send failed:", emailErr);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json(
      {
        id: consultant._id.toString(),
        name: consultant.name,
        email: consultant.email,
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError("CONSULTANT_INVITE", error);
  }
}
