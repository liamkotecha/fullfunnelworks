/**
 * GET  /api/modeller/scenarios       — list all scenarios for current client
 * POST /api/modeller/scenarios       — create new scenario (clones current base)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerBase from "@/models/ModellerBase";
import ModellerScenario from "@/models/ModellerScenario";
import { requireAuth, resolvePortalClient, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { defaultBase } from "@/lib/modeller/defaults";

async function resolveClientId(user: AuthenticatedUser, req: NextRequest): Promise<{ clientId: string | null; isViewAs: boolean }> {
  const resolved = await resolvePortalClient(user, req);
  if (resolved) return { clientId: resolved.clientId, isViewAs: resolved.isViewAs };
  return { clientId: null, isViewAs: false };
}

function uid() {
  return `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const { clientId } = await resolveClientId(user, req);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const docs = await ModellerScenario.find({ clientId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(
      docs.map((d: Record<string, any>) => ({
        id: String(d._id),
        name: d.name,
        type: d.type,
        description: d.description ?? "",
        data: d.data,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
      }))
    );
  } catch (err) {
    return apiError("MODELLER_SCENARIOS_GET", err);
  }
}

export async function POST(req: NextRequest) {
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
    const { type, name } = body as { type: string; name: string };

    // Clone current base (or defaults if none saved yet)
    const baseDoc = await ModellerBase.findOne({ clientId }).lean() as Record<string, any> | null;
    const baseData = baseDoc
      ? { revenue: baseDoc.revenue, people: baseDoc.people, overheads: baseDoc.overheads }
      : { ...defaultBase };

    // Deep-clone and give new IDs so scenario rows are independent
    const cloned = JSON.parse(JSON.stringify(baseData));
    cloned.revenue.forEach((r: any) => (r.id = uid()));
    cloned.people.forEach((p: any) => (p.id = uid()));
    cloned.overheads.forEach((o: any) => (o.id = uid()));

    const doc = await ModellerScenario.create({
      clientId,
      name: name || "New scenario",
      type: type || "revenue",
      data: cloned,
    });

    return NextResponse.json(
      {
        id: String(doc._id),
        name: doc.name,
        type: doc.type,
        description: doc.description ?? "",
        data: doc.data,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    return apiError("MODELLER_SCENARIOS_POST", err);
  }
}
