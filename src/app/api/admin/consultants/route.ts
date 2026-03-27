export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Client from "@/models/Client";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { ConsultantDTO, ModuleId } from "@/types";

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

    // Auto-clear expired holidays
    const now = new Date();
    for (const c of consultants) {
      const doc = c as Record<string, unknown>;
      const profile = doc.consultantProfile as Record<string, unknown> | undefined;
      if (
        profile?.holidayUntil &&
        new Date(profile.holidayUntil as string) < now
      ) {
        await User.findByIdAndUpdate(doc._id, {
          $unset: { "consultantProfile.holidayUntil": 1 },
          $set: { "consultantProfile.availabilityStatus": "available" },
        });
        // Update in-memory for response
        profile.holidayUntil = undefined;
        profile.availabilityStatus = "available";
      }
    }

    // Calculate currentActiveClients for each consultant
    const consultantIds = consultants.map((c) => (c as Record<string, unknown>)._id);
    const counts = await Client.aggregate([
      {
        $match: {
          assignedConsultant: { $in: consultantIds },
          status: { $in: ["onboarding", "active"] },
        },
      },
      { $group: { _id: "$assignedConsultant", count: { $sum: 1 } } },
    ]);
    const countMap = new Map<string, number>(
      counts.map((c: { _id: unknown; count: number }) => [String(c._id), c.count])
    );

    const data: ConsultantDTO[] = consultants.map((c) => {
      const doc = c as Record<string, unknown>;
      const profile = (doc.consultantProfile as Record<string, unknown>) ?? {};
      const maxActive = (profile.maxActiveClients as number) ?? 5;
      const currentActive = countMap.get(String(doc._id)) ?? 0;
      const capacityPercent = maxActive > 0 ? Math.round((currentActive / maxActive) * 100) : 0;

      return {
        id: String(doc._id),
        name: String(doc.name ?? ""),
        email: String(doc.email ?? ""),
        profile: {
          maxActiveClients: maxActive,
          availabilityStatus:
            (profile.availabilityStatus as ConsultantDTO["profile"]["availabilityStatus"]) ?? "available",
          holidayUntil: profile.holidayUntil
            ? new Date(profile.holidayUntil as string).toISOString()
            : null,
          specialisms: (profile.specialisms as string[]) ?? [],
          roundRobinWeight: (profile.roundRobinWeight as number) ?? 1,
          lastAssignedAt: profile.lastAssignedAt
            ? new Date(profile.lastAssignedAt as string).toISOString()
            : null,
          totalLeadsAssigned: (profile.totalLeadsAssigned as number) ?? 0,
          currentActiveClients: currentActive,
          capacityPercent,
          allowedModules: ((profile.allowedModules as string[]) ?? []) as ModuleId[],
        },
      };
    });

    return NextResponse.json({ data });
  } catch (error) {
    return apiError("CONSULTANTS GET", error);
  }
}
