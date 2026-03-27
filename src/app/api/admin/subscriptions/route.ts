export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Subscription from "@/models/Subscription";
import User from "@/models/User";
import Plan from "@/models/Plan";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { Types } from "mongoose";

const createSchema = z.object({
  consultantId: z.string().min(1),
  planId: z.string().min(1),
  status: z.enum(["trialing", "active", "past_due", "canceled", "paused"]).default("active"),
  currentPeriodStart: z.string().datetime().optional(),
  currentPeriodEnd: z.string().datetime().optional(),
  trialEndsAt: z.string().datetime().optional(),
  notes: z.string().max(500).optional(),
});

/* ── GET /api/admin/subscriptions ──────────────────────────── */
export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const subs = await Subscription.find()
      .sort({ createdAt: -1 })
      .lean();

    const consultantIds = subs.map((s) => s.consultantId);
    const planIds = subs.map((s) => s.planId);

    const [consultants, plans] = await Promise.all([
      User.find({ _id: { $in: consultantIds } }).select("name email").lean(),
      Plan.find({ _id: { $in: planIds } }).select("name monthlyPricePence").lean(),
    ]);

    const consultantMap = new Map(
      consultants.map((c) => [String(c._id), { name: c.name as string, email: c.email as string }])
    );
    const planMap = new Map(
      plans.map((p) => [
        String(p._id),
        { name: p.name as string, monthlyPricePence: p.monthlyPricePence as number },
      ])
    );

    const data = subs.map((s) => {
      const consultant = consultantMap.get(String(s.consultantId));
      const plan = planMap.get(String(s.planId));
      return {
        id: String(s._id),
        consultantId: String(s.consultantId),
        consultantName: consultant?.name ?? "Unknown",
        consultantEmail: consultant?.email ?? "",
        planId: String(s.planId),
        planName: plan?.name ?? "Unknown",
        monthlyPricePence: plan?.monthlyPricePence ?? 0,
        status: s.status,
        currentPeriodStart: s.currentPeriodStart?.toISOString() ?? null,
        currentPeriodEnd: s.currentPeriodEnd?.toISOString() ?? null,
        trialEndsAt: s.trialEndsAt?.toISOString() ?? null,
        canceledAt: s.canceledAt?.toISOString() ?? null,
        stripeSubscriptionId: s.stripeSubscriptionId ?? null,
        notes: s.notes ?? null,
        createdAt: s.createdAt instanceof Date ? s.createdAt.toISOString() : String(s.createdAt),
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return apiError("SUBSCRIPTIONS GET", error);
  }
}

/* ── POST /api/admin/subscriptions ─────────────────────────── */
export async function POST(req: Request) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    await connectDB();

    const { consultantId, planId, status, currentPeriodStart, currentPeriodEnd, trialEndsAt, notes } = parsed.data;

    // Verify consultant + plan exist
    const [consultant, plan] = await Promise.all([
      User.findOne({ _id: consultantId, role: "consultant" }).lean(),
      Plan.findById(planId).lean(),
    ]);
    if (!consultant) {
      return NextResponse.json({ error: "Consultant not found" }, { status: 404 });
    }
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Upsert — one subscription per consultant
    const sub = (await Subscription.findOneAndUpdate(
      { consultantId: new Types.ObjectId(consultantId) },
      {
        $set: {
          planId: new Types.ObjectId(planId),
          status,
          ...(currentPeriodStart && { currentPeriodStart: new Date(currentPeriodStart) }),
          ...(currentPeriodEnd && { currentPeriodEnd: new Date(currentPeriodEnd) }),
          ...(trialEndsAt && { trialEndsAt: new Date(trialEndsAt) }),
          ...(notes !== undefined && { notes }),
        },
      },
      { upsert: true, new: true }
    ).lean()) as unknown as Record<string, unknown> | null;

    return NextResponse.json({ data: { id: String(sub!._id) } }, { status: 201 });
  } catch (error) {
    return apiError("SUBSCRIPTIONS POST", error);
  }
}
