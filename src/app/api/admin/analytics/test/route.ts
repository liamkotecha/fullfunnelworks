/**
 * POST /api/admin/analytics/test — Send a test GA4 event via Measurement Protocol
 *
 * Sends a "test_connection" event to verify the GA4 configuration.
 * Note: Measurement Protocol always returns 204 regardless of success.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Settings from "@/models/Settings";
import { trackServerEvent } from "@/lib/analytics";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";

export async function POST() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const settings = await Settings.findOne();

    if (!settings?.ga4MeasurementId || !settings?.ga4ApiSecret) {
      return NextResponse.json(
        { error: "GA4 Measurement ID and API Secret are required. Save your settings first." },
        { status: 400 }
      );
    }

    await trackServerEvent({
      measurementId: settings.ga4MeasurementId,
      apiSecret: settings.ga4ApiSecret,
      clientId: "test_connection_client",
      eventName: "test_connection",
      params: {
        debug_mode: true,
        source: "full_funnel_admin",
      },
    });

    return NextResponse.json({
      sent: true,
      message:
        "Test event sent. Check GA4 DebugView (Admin → DebugView) within 60 seconds to confirm receipt. Note: Measurement Protocol always returns 204, so this confirmation only means the request was sent successfully.",
    });
  } catch (error) {
    return apiError("ANALYTICS TEST", error);
  }
}
