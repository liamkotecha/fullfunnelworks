export const dynamic = "force-dynamic";
/**
 * GET /api/consultant/billing
 * Returns the consultant's current plan, subscription details, and usage.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import Client from "@/models/Client";
import User from "@/models/User";
import { requireAuth } from "@/lib/api-helpers";
import type { IPlan } from "@/models/Plan";
import type { ISubscription } from "@/models/Subscription";

type PopulatedSubscription = Omit<ISubscription, "planId"> & { planId: IPlan };

export async function GET() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  if (userOrRes.role !== "consultant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const sub = (await Subscription.findOne({ consultantId: userOrRes.id })
    .populate("planId")
    .lean()) as PopulatedSubscription | null;

  // Get consultant's maxActiveClients from their profile (cached value)
  const user = await User.findById(userOrRes.id)
    .select("consultantProfile")
    .lean() as { consultantProfile?: { maxActiveClients?: number } } | null;

  const activeClientCount = await Client.countDocuments({
    assignedConsultant: userOrRes.id,
    status: { $in: ["active", "onboarding"] },
  });

  const maxActiveClients =
    (sub?.planId as IPlan | null)?.maxActiveClients ??
    user?.consultantProfile?.maxActiveClients ??
    5;

  return NextResponse.json({
    plan: sub?.planId
      ? {
          id: (sub.planId as unknown as { _id: { toString: () => string } })._id.toString(),
          name: sub.planId.name,
          description: sub.planId.description ?? null,
          monthlyPricePence: sub.planId.monthlyPricePence,
          maxActiveClients: sub.planId.maxActiveClients,
          allowedModules: sub.planId.allowedModules,
        }
      : null,
    subscription: sub
      ? {
          id: sub._id.toString(),
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart?.toISOString() ?? null,
          currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
          trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
          stripeSubscriptionId: sub.stripeSubscriptionId ?? null,
        }
      : null,
    activeClients: activeClientCount,
    maxActiveClients,
  });
}
