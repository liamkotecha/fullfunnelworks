export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    // Admin gets global settings (no consultantId); consultant gets their own
    const query = user.role === "consultant"
      ? { consultantId: user.id }
      : { consultantId: { $exists: false } };
    const settings = await Settings.findOne(query).lean();

    return NextResponse.json({
      data: settings ?? {
        leadNotificationEmail: "",
        autoResponseReplyTo: "",
        calendlyUrl: "",
        autoAssignEnabled: false,
        ga4MeasurementId: "",
        ga4ApiSecret: "",
        ga4Enabled: false,
        ga4TrackedEvents: {
          leadReceived: true,
          leadQualified: true,
          proposalSent: true,
          dealWon: true,
          dealLost: false,
          clientConverted: true,
          assessmentStarted: true,
          sectionCompleted: false,
          moduleCompleted: true,
          invoicePaid: true,
          reportDownloaded: false,
        },
      },
    });
  } catch (error) {
    return apiError("SETTINGS GET", error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    const body = await req.json();
    await connectDB();

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedFields = [
      "leadNotificationEmail",
      "autoResponseReplyTo",
      "calendlyUrl",
      "autoAssignEnabled",
      "ga4MeasurementId",
      "ga4ApiSecret",
      "ga4Enabled",
      "ga4TrackedEvents",
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) update[key] = body[key];
    }

    // Scope to consultant or global
    const filter = user.role === "consultant"
      ? { consultantId: user.id }
      : { consultantId: { $exists: false } };
    const upsertSet = user.role === "consultant"
      ? { ...update, consultantId: user.id }
      : update;

    const settings = await Settings.findOneAndUpdate(filter, upsertSet, {
      upsert: true,
      new: true,
    }).lean();

    return NextResponse.json({ data: settings });
  } catch (error) {
    return apiError("SETTINGS PATCH", error);
  }
}
