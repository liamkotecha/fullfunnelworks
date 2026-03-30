export const dynamic = "force-dynamic";
/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for consultant plan subscription.
 * Redirect to the returned URL to start the Stripe-hosted checkout.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import { getStripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { planId, email, name } = await req.json();
  if (!planId || !email) {
    return NextResponse.json({ error: "planId and email are required" }, { status: 400 });
  }

  await connectDB();
  const plan = await Plan.findById(planId).lean() as {
    _id: { toString: () => string };
    name: string;
    monthlyPricePence: number;
    description?: string;
    stripePriceId?: string;
  } | null;

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const stripe = getStripe();
  const baseUrl = process.env.NEXTAUTH_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  // Use stripePriceId if available (set this on plans in Stripe Dashboard),
  // otherwise create a price inline from the plan's monthlyPricePence.
  let priceId: string | undefined = plan.stripePriceId;

  if (!priceId) {
    // Create a recurring price inline — no permanent Stripe object created
    const price = await stripe.prices.create({
      currency: "gbp",
      unit_amount: plan.monthlyPricePence,
      recurring: { interval: "month" },
      product_data: {
        name: `Full Funnel — ${plan.name}`,
      },
    });
    priceId = price.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: email,
    metadata: {
      planId: plan._id.toString(),
      consultantEmail: email,
      consultantName: name ?? "",
    },
    subscription_data: {
      metadata: { planId: plan._id.toString(), consultantEmail: email },
    },
    success_url: `${baseUrl}/register/setup-passkey`,
    cancel_url: `${baseUrl}/register?role=consultant&cancelled=true`,
  });

  return NextResponse.json({ checkoutUrl: session.url });
}
