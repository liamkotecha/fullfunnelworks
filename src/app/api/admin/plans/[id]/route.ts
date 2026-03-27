export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Plan from "@/models/Plan";
import Subscription from "@/models/Subscription";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { ModuleId } from "@/types";

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  description: z.string().max(300).optional().nullable(),
  monthlyPricePence: z.number().int().min(0).optional(),
  annualPricePence: z.number().int().min(0).optional(),
  maxActiveClients: z.number().int().min(1).max(100).optional(),
  maxProjectsPerClient: z.number().int().min(1).max(20).optional(),
  allowedModules: z.array(z.string()).optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
  isActive: z.boolean().optional(),
});

function adminGuard() {
  return requireAuth().then((u) => {
    if (u instanceof NextResponse) return u;
    if (u.role !== "admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return null;
  });
}

/* ── GET /api/admin/plans/[id] ─────────────────────────────── */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    await connectDB();

    const plan = (await Plan.findById(params.id).lean()) as unknown as Record<string, unknown> | null;
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const subCount = await Subscription.countDocuments({
      planId: plan._id,
      status: { $in: ["active", "trialing"] },
    });

    return NextResponse.json({
      data: {
        id: String(plan._id),
        name: plan.name,
        description: (plan.description as string | null | undefined) ?? null,
        monthlyPricePence: plan.monthlyPricePence,
        annualPricePence: plan.annualPricePence,
        maxActiveClients: plan.maxActiveClients,
        maxProjectsPerClient: plan.maxProjectsPerClient,
        allowedModules: ((plan.allowedModules as unknown[]) ?? []) as ModuleId[],
        trialDays: (plan.trialDays as number | undefined) ?? 0,
        isActive: plan.isActive,
        consultantCount: subCount,
        createdAt: plan.createdAt instanceof Date ? (plan.createdAt as Date).toISOString() : String(plan.createdAt),
      },
    });
  } catch (error) {
    return apiError("PLAN GET", error);
  }
}

/* ── PATCH /api/admin/plans/[id] ───────────────────────────── */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const plan = (await Plan.findByIdAndUpdate(
      params.id,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean()) as unknown as Record<string, unknown> | null;

    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      data: {
        id: String(plan._id),
        name: plan.name as string,
        description: (plan.description as string | null | undefined) ?? null,
        monthlyPricePence: plan.monthlyPricePence as number,
        annualPricePence: plan.annualPricePence as number,
        maxActiveClients: plan.maxActiveClients as number,
        maxProjectsPerClient: plan.maxProjectsPerClient as number,
        allowedModules: ((plan.allowedModules as unknown[]) ?? []) as ModuleId[],
        trialDays: (plan.trialDays as number | undefined) ?? 0,
        isActive: plan.isActive as boolean,
        createdAt: plan.createdAt instanceof Date ? (plan.createdAt as Date).toISOString() : String(plan.createdAt),
      },
    });
  } catch (error) {
    return apiError("PLAN PATCH", error);
  }
}

/* ── DELETE /api/admin/plans/[id] ──────────────────────────── */
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const guard = await adminGuard();
    if (guard) return guard;

    await connectDB();

    // Block deletion if consultants are on this plan
    const activeCount = await Subscription.countDocuments({
      planId: params.id,
      status: { $in: ["active", "trialing"] },
    });
    if (activeCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete — ${activeCount} consultant(s) still on this plan` },
        { status: 409 }
      );
    }

    const plan = await Plan.findByIdAndDelete(params.id);
    if (!plan) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ success: true });
  } catch (error) {
    return apiError("PLAN DELETE", error);
  }
}
