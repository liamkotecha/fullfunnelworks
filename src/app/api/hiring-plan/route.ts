export const dynamic = "force-dynamic";
/**
 * GET /api/hiring-plan   — fetch plan for current client
 * PUT /api/hiring-plan   — save/replace entire plan (autosave)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import HiringPlan from "@/models/HiringPlan";
import { requireAuth, resolvePortalClient, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

async function resolveClientId(user: AuthenticatedUser, req: NextRequest): Promise<{ clientId: string | null; isViewAs: boolean }> {
  const resolved = await resolvePortalClient(user, req);
  if (resolved) return { clientId: resolved.clientId, isViewAs: resolved.isViewAs };
  return { clientId: null, isViewAs: false };
}

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const { clientId } = await resolveClientId(user, req);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const doc = await HiringPlan.findOne({ clientId }).lean() as Record<string, any> | null;

    if (!doc) {
      return NextResponse.json({
        clientId,
        hires: [],
        useModeller: true,
        baseOverride: {
          monthlyRevenue: 0,
          grossMarginPct: 60,
          existingPeopleMonthly: 0,
          monthlyOverheads: 0,
        },
        updatedAt: null,
      });
    }

    return NextResponse.json({
      clientId: String(doc.clientId),
      hires: doc.hires ?? [],
      useModeller: doc.useModeller ?? true,
      baseOverride: doc.baseOverride ?? {
        monthlyRevenue: 0,
        grossMarginPct: 60,
        existingPeopleMonthly: 0,
        monthlyOverheads: 0,
      },
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("HIRING_PLAN_GET", err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    // Block saves in view-as mode
    const viewAsCookie = req.cookies.get("view-as-client-id")?.value;
    if (viewAsCookie) {
      return NextResponse.json({ error: "View-as mode is read-only" }, { status: 403 });
    }

    await connectDB();
    const { clientId } = await resolveClientId(user, req);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const body = await req.json();
    const { hires, useModeller, baseOverride } = body;

    const doc = await HiringPlan.findOneAndUpdate(
      { clientId },
      { clientId, hires, useModeller, baseOverride, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as Record<string, any>;

    return NextResponse.json({
      clientId: String(doc.clientId),
      hires: doc.hires,
      useModeller: doc.useModeller,
      baseOverride: doc.baseOverride,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("HIRING_PLAN_PUT", err);
  }
}
