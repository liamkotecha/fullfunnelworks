export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import Client from "@/models/Client";
import { requireAuth, assertClientAccess, resolveClientSession } from "@/lib/api-helpers";

const saveSchema = z.object({
  clientId: z.string(),
  completedBy: z.enum(["client", "admin"]),
  responses: z.record(z.unknown()),
  sectionProgress: z.record(z.boolean()),
  submit: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "clientId required" }, { status: 400 });
    }

    const guard = await assertClientAccess(userOrRes, clientId);
    if (guard) return guard;

    // ── Dual-path ────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);
    if (resolved) {
      const { default: SessionResponse } = await import("@/models/Response");
      const respDocs = await SessionResponse.find({
        sessionId: resolved.session._id,
        participantId: null,
      }).select("fieldKey value").lean() as unknown as Array<{ fieldKey: string; value: unknown }>;
      const responses: Record<string, unknown> = {};
      for (const r of respDocs) responses[r.fieldKey] = r.value;
      return NextResponse.json({
        data: { clientId, responses, teamMode: resolved.session.teamMode, status: resolved.session.status },
      }, { status: 200 });
    }

    const intake = await IntakeResponse.findOne({ clientId }).lean();
    return NextResponse.json({ data: intake ?? null }, { status: 200 });
  } catch (error) {
    console.error("[INTAKE GET]", error);
    return NextResponse.json({ error: "Failed to fetch intake" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { clientId, completedBy, responses, sectionProgress, submit } = saveSchema.parse(body);

    await connectDB();

    const guard = await assertClientAccess(userOrRes, clientId);
    if (guard) return guard;

    const now = new Date();

    // ── Dual-path ────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);
    if (resolved) {
      const { default: SessionResponse } = await import("@/models/Response");
      // Upsert each response field as a canonical Response doc
      await Promise.all(
        Object.entries(responses).map(([fieldKey, value]) =>
          SessionResponse.findOneAndUpdate(
            { sessionId: resolved.session._id, participantId: null, fieldKey },
            { $set: { value, source: completedBy } },
            { upsert: true, new: true }
          )
        )
      );
      resolved.session.lastActiveSub = "";
      if (submit) resolved.session.status = "submitted";
      await resolved.session.save();
      if (submit) {
        await Client.findByIdAndUpdate(clientId, { status: "active", onboardingCompletedAt: now });
      }
      return NextResponse.json({ data: { success: true } }, { status: 200 });
    }

    // ── Legacy path ────────────────────────────────────────────────────
    // Build $set for atomic partial update (avoids overwriting entire map)
    const responseEntries: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(responses)) {
      responseEntries[`responses.${key}`] = val;
    }
    const progressEntries: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(sectionProgress)) {
      progressEntries[`sectionProgress.${key}`] = val;
    }

    const submitFields: Record<string, unknown> = submit
      ? { submittedAt: now }
      : {};

    const doc = await IntakeResponse.findOneAndUpdate(
      { clientId },
      {
        $set: {
          ...responseEntries,
          ...progressEntries,
          ...submitFields,
          lastSavedAt: now,
          completedBy,
        },
      },
      { upsert: true, new: true }
    );

    if (submit) {
      await Client.findByIdAndUpdate(clientId, { status: "active", onboardingCompletedAt: now });
    }

    return NextResponse.json({ data: doc }, { status: 200 });
  } catch (error) {
    console.error("[INTAKE POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save intake" }, { status: 500 });
  }
}
