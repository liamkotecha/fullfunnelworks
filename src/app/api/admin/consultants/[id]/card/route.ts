export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { getStripe } from "@/lib/stripe";
import { Types } from "mongoose";

/* ── GET /api/admin/consultants/[id]/card ───────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await connectDB();

    const sub = await Subscription.findOne({
      consultantId: new Types.ObjectId(id),
    }).lean();

    const stripeSubId = (sub as Record<string, unknown> | null)?.stripeSubscriptionId as string | undefined;
    if (!sub || !stripeSubId) {
      return NextResponse.json({ data: null });
    }

    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(stripeSubId, {
      expand: ["default_payment_method"],
    });

    const pm = stripeSub.default_payment_method;
    if (!pm || typeof pm === "string" || pm.type !== "card" || !pm.card) {
      return NextResponse.json({ data: null });
    }

    return NextResponse.json({
      data: {
        brand: pm.card.brand,
        last4: pm.card.last4,
        expMonth: pm.card.exp_month,
        expYear: pm.card.exp_year,
      },
    });
  } catch (error) {
    return apiError("CONSULTANT CARD GET", error);
  }
}
