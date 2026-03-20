/**
 * PUT    /api/modeller/scenarios/[id]  — update scenario
 * DELETE /api/modeller/scenarios/[id]  — delete scenario
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import ModellerScenario from "@/models/ModellerScenario";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

async function resolveClientId(user: AuthenticatedUser): Promise<string | null> {
  const client = await Client.findOne(
    user.role === "admin" ? {} : { userId: user.id }
  )
    .sort({ createdAt: 1 })
    .select("_id")
    .lean() as { _id: unknown } | null;
  return client ? String(client._id) : null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const { id } = await params;
    const body = await req.json();

    // Accept data either wrapped as { data: { revenue, people, overheads } }
    // or flat { revenue, people, overheads } (from autosave)
    const dataPayload = body.data ?? (body.revenue ? { revenue: body.revenue, people: body.people, overheads: body.overheads } : undefined);

    const doc = await ModellerScenario.findOneAndUpdate(
      { _id: id, clientId },
      {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.type !== undefined && { type: body.type }),
        ...(dataPayload !== undefined && { data: dataPayload }),
        updatedAt: new Date(),
      },
      { new: true }
    ).lean() as Record<string, any> | null;

    if (!doc) return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    return NextResponse.json({
      id: String(doc._id),
      name: doc.name,
      type: doc.type,
      description: doc.description ?? "",
      data: doc.data,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("MODELLER_SCENARIO_PUT", err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();
    const clientId = await resolveClientId(user);
    if (!clientId) return NextResponse.json({ error: "No client found" }, { status: 404 });

    const { id } = await params;
    const result = await ModellerScenario.deleteOne({ _id: id, clientId });

    if (result.deletedCount === 0)
      return NextResponse.json({ error: "Scenario not found" }, { status: 404 });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return apiError("MODELLER_SCENARIO_DELETE", err);
  }
}
