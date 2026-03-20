export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prospect from "@/models/Prospect";
import Client from "@/models/Client";
import User from "@/models/User";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/sendgrid";
import { onboardingInviteEmail } from "@/lib/email-templates/onboarding-invite";
import { getGA4Settings, trackServerEvent } from "@/lib/analytics";

type Params = { params: Promise<{ id: string }> };

/* ── POST /api/prospects/[id]/convert ─────────────────────── */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    // 1. Fetch prospect — must be in "won" stage
    const prospect = await Prospect.findById(id);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }
    if (prospect.stage !== "won") {
      return NextResponse.json(
        { error: "Prospect must be in 'won' stage to convert" },
        { status: 400 }
      );
    }

    // 2. Check if already converted
    if (prospect.clientId) {
      return NextResponse.json(
        { error: "Prospect has already been converted to a client", clientId: String(prospect.clientId) },
        { status: 409 }
      );
    }

    // 3. Find or create User by email
    let clientUser = await User.findOne({ email: prospect.contactEmail });
    if (!clientUser) {
      clientUser = await User.create({
        email: prospect.contactEmail,
        name: prospect.contactName,
        role: "client",
      });
    }

    // 4. Create Client document pre-filled from prospect data
    const client = await Client.create({
      userId: clientUser._id,
      businessName: prospect.businessName,
      status: "invited",
      contactName: prospect.contactName,
      contactEmail: prospect.contactEmail,
      phone: prospect.phone,
      website: prospect.website,
      assignedConsultant: prospect.assignedConsultant,
    });

    // 5. Send onboarding invite email
    const portalUrl = `${process.env.NEXTAUTH_URL}/login`;
    try {
      await sendEmail({
        to: prospect.contactEmail,
        subject: `Welcome to Full Funnel — Your portal is ready`,
        html: onboardingInviteEmail({
          clientName: prospect.contactName,
          portalUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[PROSPECT CONVERT] Failed to send onboarding invite:", emailErr);
    }

    // 6. Update prospect with conversion data
    prospect.convertedAt = new Date();
    prospect.clientId = client._id;
    await prospect.save();

    // 7. Fire GA4 purchase event (non-blocking)
    void (async () => {
      try {
        const config = await getGA4Settings();
        if (!config || !config.trackedEvents.clientConverted) return;
        if (!prospect.gaClientId) return;
        await trackServerEvent({
          measurementId: config.measurementId,
          apiSecret: config.apiSecret,
          clientId: prospect.gaClientId,
          eventName: "purchase",
          params: {
            transaction_id: String(client._id),
            value: prospect.dealValue ? prospect.dealValue / 100 : 0,
            currency: "GBP",
            item_name: "Consulting Engagement",
            item_id: String(client._id),
          },
        });
      } catch (err) {
        // silent
      }
    })();

    return NextResponse.json(
      {
        clientId: String(client._id),
        message: "Client created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError("PROSPECT CONVERT", error);
  }
}
