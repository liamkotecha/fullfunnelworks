export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import { requireAuth, apiError } from "@/lib/api-helpers";

const updateSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(["trialing", "active", "past_due", "canceled", "paused"]).optional(),
  currentPeriodStart: z.string().datetime().optional().nullable(),
  currentPeriodEnd: z.string().datetime().optional().nullable(),
  trialEndsAt: z.string().datetime().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  stripeSubscriptionId: z.string().optional().nullable(),
});

/* ── PATCH /api/admin/subscriptions/[id] ──────────────────── */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const update: Record<string, unknown> = {};
    const unset: Record<string, 1> = {};

    if (parsed.data.status) update.status = parsed.data.status;
    if (parsed.data.planId) update.planId = parsed.data.planId;
    if (parsed.data.stripeSubscriptionId !== undefined) {
      if (parsed.data.stripeSubscriptionId) update.stripeSubscriptionId = parsed.data.stripeSubscriptionId;
      else unset.stripeSubscriptionId = 1;
    }
    if (parsed.data.currentPeriodStart !== undefined) {
      if (parsed.data.currentPeriodStart) update.currentPeriodStart = new Date(parsed.data.currentPeriodStart);
      else unset.currentPeriodStart = 1;
    }
    if (parsed.data.currentPeriodEnd !== undefined) {
      if (parsed.data.currentPeriodEnd) update.currentPeriodEnd = new Date(parsed.data.currentPeriodEnd);
      else unset.currentPeriodEnd = 1;
    }
    if (parsed.data.trialEndsAt !== undefined) {
      if (parsed.data.trialEndsAt) update.trialEndsAt = new Date(parsed.data.trialEndsAt);
      else unset.trialEndsAt = 1;
    }
    if (parsed.data.notes !== undefined) {
      if (parsed.data.notes) update.notes = parsed.data.notes;
      else unset.notes = 1;
    }

    if (parsed.data.status === "canceled") {
      update.canceledAt = new Date();
    }

    const mongoUpdate: Record<string, Record<string, unknown>> = { $set: update };
    if (Object.keys(unset).length > 0) mongoUpdate.$unset = unset;

    const sub = (await Subscription.findByIdAndUpdate(params.id, mongoUpdate, {
      new: true,
      runValidators: true,
    }).lean()) as unknown as Record<string, unknown> | null;

    if (!sub) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ data: { id: String(sub._id), status: sub.status as string } });
  } catch (error) {
    return apiError("SUBSCRIPTION PATCH", error);
  }
}
