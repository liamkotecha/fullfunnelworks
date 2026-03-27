export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Subscription from "@/models/Subscription";
import Plan from "@/models/Plan";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { Types } from "mongoose";

/* ── GET /api/admin/consultants/[id] ───────────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const user = await User.findOne({ _id: id, role: "consultant" }).lean();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const doc = user as Record<string, unknown>;
    const profile = (doc.consultantProfile as Record<string, unknown>) ?? {};

    const sub = (await Subscription.findOne({
      consultantId: new Types.ObjectId(id),
    }).lean()) as unknown as Record<string, unknown> | null;
    const plan = sub ? (await Plan.findById(sub.planId as string).lean()) as unknown as Record<string, unknown> | null : null;

    const maxActive = plan
      ? (plan.maxActiveClients as number)
      : (profile.maxActiveClients as number) ?? 5;

    return NextResponse.json({
      data: {
        id: String(doc._id),
        name: String(doc.name ?? ""),
        email: String(doc.email ?? ""),
        createdAt: (doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt as string)).toISOString(),
        profile: {
          maxActiveClients: maxActive,
          specialisms: (profile.specialisms as string[]) ?? [],
          totalLeadsAssigned: (profile.totalLeadsAssigned as number) ?? 0,
          plan: plan
            ? {
                id: String(plan._id),
                name: plan.name as string,
                maxActiveClients: plan.maxActiveClients as number,
                maxProjectsPerClient: plan.maxProjectsPerClient as number,
                allowedModules: plan.allowedModules ?? [],
                trialDays: (plan.trialDays as number) ?? 0,
                monthlyPricePence: plan.monthlyPricePence as number,
                annualPricePence: plan.annualPricePence as number,
              }
            : null,
          subscription: sub
            ? {
                id: String(sub._id),
                status: sub.status as string,
                currentPeriodStart: (sub.currentPeriodStart as Date | null | undefined)?.toISOString() ?? null,
                currentPeriodEnd: (sub.currentPeriodEnd as Date | null | undefined)?.toISOString() ?? null,
                trialEndsAt: (sub.trialEndsAt as Date | null | undefined)?.toISOString() ?? null,
                canceledAt: (sub.canceledAt as Date | null | undefined)?.toISOString() ?? null,
                notes: (sub.notes as string | null | undefined) ?? null,
              }
            : null,
        },
      },
    });
  } catch (error) {
    return apiError("CONSULTANT GET", error);
  }
}

/* ── PATCH /api/admin/consultants/[id] ─────────────────────── */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectDB();

    const consultant = await User.findOne({ _id: id, role: "consultant" });
    if (!consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }

    const updateFields: Record<string, unknown> = {};

    if (body.specialisms !== undefined) {
      updateFields["consultantProfile.specialisms"] = Array.isArray(body.specialisms)
        ? body.specialisms.map((s: string) => String(s).trim()).filter(Boolean)
        : [];
    }

    // Assign plan — updates subscription + mirrors limits on user doc
    if (body.planId !== undefined && body.planId !== null) {
      const plan = (await Plan.findById(body.planId).lean()) as unknown as Record<string, unknown> | null;
      if (!plan) {
        return NextResponse.json({ error: "Plan not found" }, { status: 404 });
      }

      const subStatus = body.subscriptionStatus ?? "active";
      const trialDays = (plan.trialDays as number) ?? 0;
      const now = new Date();
      const trialEndsAt =
        subStatus === "trialing" && trialDays > 0
          ? new Date(now.getTime() + trialDays * 86_400_000)
          : undefined;

      await Subscription.findOneAndUpdate(
        { consultantId: new Types.ObjectId(id) },
        {
          $set: {
            planId: new Types.ObjectId(body.planId as string),
            status: subStatus,
            ...(trialEndsAt ? { trialEndsAt } : {}),
          },
        },
        { upsert: true }
      );

      updateFields["consultantProfile.maxActiveClients"] = plan.maxActiveClients;
      updateFields["consultantProfile.allowedModules"] = plan.allowedModules ?? [];
      updateFields["consultantProfile.planId"] = new Types.ObjectId(body.planId as string);
      if (trialEndsAt) {
        updateFields["consultantProfile.trialEndsAt"] = trialEndsAt;
      }
    }

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(id, { $set: updateFields });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError("CONSULTANT PATCH", error);
  }
}
