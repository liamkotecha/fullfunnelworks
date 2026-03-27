export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import Subscription from "@/models/Subscription";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { ModuleId } from "@/types";

const planSchema = z.object({
  name: z.string().min(1).max(60),
  description: z.string().max(300).optional(),
  monthlyPricePence: z.number().int().min(0),
  annualPricePence: z.number().int().min(0),
  maxActiveClients: z.number().int().min(1).max(100),
  maxProjectsPerClient: z.number().int().min(1).max(20),
  allowedModules: z.array(z.string()).default([]),
  trialDays: z.number().int().min(0).max(365).default(0),
  isActive: z.boolean().default(true),
});

/* ── GET /api/admin/plans ──────────────────────────────────── */
export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const plans = await Plan.find().sort({ monthlyPricePence: 1 }).lean();

    // Count consultants per plan
    const planIds = plans.map((p) => p._id);
    const counts = await Subscription.aggregate([
      { $match: { planId: { $in: planIds }, status: { $in: ["active", "trialing"] } } },
      { $group: { _id: "$planId", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(
      counts.map((c: { _id: unknown; count: number }) => [String(c._id), c.count])
    );

    const data = plans.map((p) => ({
      id: String(p._id),
      name: p.name,
      description: p.description ?? null,
      monthlyPricePence: p.monthlyPricePence,
      annualPricePence: p.annualPricePence,
      maxActiveClients: p.maxActiveClients,
      maxProjectsPerClient: p.maxProjectsPerClient,
      allowedModules: (p.allowedModules ?? []) as ModuleId[],
      trialDays: p.trialDays ?? 0,
      isActive: p.isActive,
      consultantCount: countMap.get(String(p._id)) ?? 0,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return apiError("PLANS GET", error);
  }
}

/* ── POST /api/admin/plans ─────────────────────────────────── */
export async function POST(req: Request) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = planSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const plan = await Plan.create(parsed.data);

    return NextResponse.json(
      {
        data: {
          id: String(plan._id),
          name: plan.name,
          description: plan.description ?? null,
          monthlyPricePence: plan.monthlyPricePence,
          annualPricePence: plan.annualPricePence,
          maxActiveClients: plan.maxActiveClients,
          maxProjectsPerClient: plan.maxProjectsPerClient,
          allowedModules: plan.allowedModules as ModuleId[],
          trialDays: plan.trialDays,
          isActive: plan.isActive,
          consultantCount: 0,
          createdAt: plan.createdAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return apiError("PLANS POST", error);
  }
}
