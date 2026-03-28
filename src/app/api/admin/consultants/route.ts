export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Client from "@/models/Client";
import Subscription from "@/models/Subscription";
import Plan from "@/models/Plan";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { ConsultantDTO } from "@/types";

/* ── GET /api/admin/consultants ────────────────────────────── */
export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const consultants = await User.find({ role: "consultant" }).lean();

    // Calculate currentActiveClients for each consultant
    const consultantIds = consultants.map((c) => (c as Record<string, unknown>)._id);
    const [counts, subscriptions] = await Promise.all([
      Client.aggregate([
        {
          $match: {
            assignedConsultant: { $in: consultantIds },
            status: { $in: ["onboarding", "active"] },
          },
        },
        { $group: { _id: "$assignedConsultant", count: { $sum: 1 } } },
      ]),
      Subscription.find({ consultantId: { $in: consultantIds } }).lean(),
    ]);

    const countMap = new Map<string, number>(
      counts.map((c: { _id: unknown; count: number }) => [String(c._id), c.count])
    );
    const subMap = new Map(
      subscriptions.map((s) => [String(s.consultantId), s])
    );

    // Fetch plans for subscriptions
    const planIds = [...new Set(subscriptions.map((s) => String(s.planId)).filter(Boolean))];
    const plans = planIds.length > 0 ? await Plan.find({ _id: { $in: planIds } }).lean() : [];
    const planMap = new Map(plans.map((p) => [String(p._id), p]));

    const data: ConsultantDTO[] = consultants.map((c) => {
      const doc = c as Record<string, unknown>;
      const profile = (doc.consultantProfile as Record<string, unknown>) ?? {};
      const currentActive = countMap.get(String(doc._id)) ?? 0;
      const sub = subMap.get(String(doc._id));
      const plan = sub ? planMap.get(String(sub.planId)) : null;

      const maxActive = plan
        ? (plan.maxActiveClients as number)
        : (profile.maxActiveClients as number) ?? 5;
      const capacityPercent = maxActive > 0 ? Math.round((currentActive / maxActive) * 100) : 0;

      return {
        id: String(doc._id),
        name: String(doc.name ?? ""),
        email: String(doc.email ?? ""),
        createdAt: (doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt as string)).toISOString(),
        lastLoginAt: (doc.lastLoginAt as Date | undefined)?.toISOString() ?? null,
        profile: {
          maxActiveClients: maxActive,
          currentActiveClients: currentActive,
          capacityPercent,
          specialisms: (profile.specialisms as string[]) ?? [],
          subscriptionStatus: (sub?.status as string) ?? null,
          planName: plan ? (plan.name as string) : null,
          plan: plan
            ? {
                id: String(plan._id),
                name: plan.name as string,
                maxActiveClients: plan.maxActiveClients as number,
                maxProjectsPerClient: plan.maxProjectsPerClient as number,
                allowedModules: (plan.allowedModules ?? []) as import("@/types").ModuleId[],
                trialDays: (plan.trialDays as number) ?? 0,
                monthlyPricePence: plan.monthlyPricePence as number,
                annualPricePence: plan.annualPricePence as number,
              }
            : null,
          planStartedAt: (profile.planStartedAt as Date | undefined)?.toISOString() ?? null,
          trialEndsAt: (profile.trialEndsAt as Date | undefined)?.toISOString() ??
            (sub?.trialEndsAt ? (sub.trialEndsAt as Date).toISOString() : null),
          subscription: sub
            ? {
                status: sub.status as string,
                cardExpMonth: (sub.cardExpMonth as number | null) ?? null,
                cardExpYear: (sub.cardExpYear as number | null) ?? null,
                trialEndsAt: (sub.trialEndsAt as Date | undefined)?.toISOString() ?? null,
              }
            : null,
          healthOverride: ((profile.healthOverride as "healthy" | null | undefined) ?? null),
          healthOverrideNote: (profile.healthOverrideNote as string | undefined) ?? null,
          healthOverrideAt: (profile.healthOverrideAt as Date | undefined)?.toISOString() ?? null,
        },
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return apiError("CONSULTANTS GET", error);
  }
}
