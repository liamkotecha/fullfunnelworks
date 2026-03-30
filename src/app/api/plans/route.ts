export const dynamic = "force-dynamic";
/**
 * GET /api/plans
 * Public endpoint — returns all active plans for display on the registration page.
 * No auth required; only exposes fields needed for the pricing display.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";

export async function GET() {
  try {
    await connectDB();
    const plans = await Plan.find({ isActive: true })
      .sort({ monthlyPricePence: 1 })
      .lean();

    const data = plans.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description ?? null,
      monthlyPricePence: p.monthlyPricePence,
      annualPricePence: p.annualPricePence,
      maxActiveClients: p.maxActiveClients,
      allowedModules: p.allowedModules ?? [],
      trialDays: p.trialDays ?? 0,
    }));

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Failed to load plans" }, { status: 500 });
  }
}
