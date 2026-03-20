/**
 * GET /api/modeller/base   — fetch base model for current client
 * PUT /api/modeller/base   — save/replace entire base model
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerBase from "@/models/ModellerBase";
import { requireAuth, resolvePortalClient, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { defaultBase } from "@/lib/modeller/defaults";

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

    const doc = await ModellerBase.findOne({ clientId }).lean() as Record<string, any> | null;

    if (!doc) {
      // Return defaults (not yet persisted)
      return NextResponse.json({
        clientId,
        ...defaultBase,
        updatedAt: null,
      });
    }

    return NextResponse.json({
      clientId: String(doc.clientId),
      revenue: doc.revenue ?? [],
      people: doc.people ?? [],
      overheads: doc.overheads ?? [],
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_BASE_GET", err);
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
    const { revenue, people, overheads } = body;

    const doc = await ModellerBase.findOneAndUpdate(
      { clientId },
      { clientId, revenue, people, overheads, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean() as Record<string, any>;

    return NextResponse.json({
      clientId: String(doc.clientId),
      revenue: doc.revenue,
      people: doc.people,
      overheads: doc.overheads,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_BASE_PUT", err);
  }
}
