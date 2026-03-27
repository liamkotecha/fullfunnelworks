export const dynamic = "force-dynamic";
/**
 * POST /api/consultant/billing/portal
 * Creates a Stripe billing portal session and returns the URL.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import { requireAuth } from "@/lib/api-helpers";
import { getStripe } from "@/lib/stripe";

export async function POST() {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  if (userOrRes.role !== "consultant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await connectDB();

  const user = await User.findById(userOrRes.id).select("email name").lean() as { email: string; name: string } | null;
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const sub = await Subscription.findOne({ consultantId: userOrRes.id }).lean() as { stripeSubscriptionId?: string } | null;

  const stripe = getStripe();
  const returnUrl = `${process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000"}/consultant/billing`;

  // Find or create Stripe customer by consultant email
  const existing = await stripe.customers.list({ email: user.email, limit: 1 });
  let customerId: string;
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({ email: user.email, name: user.name });
    customerId = customer.id;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: session.url });
}
