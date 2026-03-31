export const dynamic = "force-dynamic";
/**
 * PATCH /api/responses/[clientId]/[section]/[sub]
 * Save a single field response and recalculate sub-section progress.
 *
 * Dual-path: if IntakeResponse.migratedAt is set → write to new Response model.
 * Otherwise → legacy IntakeResponse path.
 *
 * Body: { fieldId: string, value: string | number | boolean }
 * Response: { answeredCount, totalCount, lastSavedAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getSubSectionFieldIds, isFieldAnswered, calculateProgress } from "@/lib/framework-nav";
import { z } from "zod";
import { requireAuth, assertClientAccess, resolveClientSession } from "@/lib/api-helpers";

const bodySchema = z.object({
  fieldId: z.string().min(1),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; section: string; sub: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    // Block saves in view-as mode
    const viewAsCookie = req.cookies.get("view-as-client-id")?.value;
    if (viewAsCookie) {
      return NextResponse.json({ error: "View-as mode is read-only" }, { status: 403 });
    }

    const { clientId, section, sub } = await params;
    const subSectionId = `${section}-${sub}`;

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const { fieldId, value } = parsed.data;
    const user = userOrRes;

    await connectDB();

    const guard = await assertClientAccess(user, clientId);
    if (guard) return guard;

    const now = new Date();

    // ── Routing gate ──────────────────────────────────────────────────────────
    // resolveClientSession returns null when IntakeResponse.migratedAt is NOT
    // set — the cutover guard. In that case we fall back to the legacy path.
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ───────────────────────────────────────────────────────
      return legacyPatch({ clientId, section, sub, subSectionId, fieldId, value, userId: user.id, now });
    }

    // ── New model path ────────────────────────────────────────────────────────
    const { session } = resolved;
    const { default: Response } = await import("@/models/Response");
    const { default: Participant } = await import("@/models/Participant");

    // Determine participantId: team assessment → individual; everything else → canonical
    const isTeamAssessment = session.teamMode && section === "assessment";
    let participantId: string | null = null;

    if (isTeamAssessment) {
      const participant = await Participant.findOne({ sessionId: session._id, userId: user.id })
        .select("_id")
        .lean() as Record<string, unknown> | null;
      if (participant) participantId = String(participant._id);
    }

    await Response.findOneAndUpdate(
      { sessionId: session._id, participantId, fieldKey: fieldId },
      { $set: { value, updatedAt: now } },
      { upsert: true, new: true }
    );

    // Update session's last active sub
    await session.updateOne({ $set: { lastActiveSub: `${section}/${sub}` } });

    // Derive progress: count answered fields in this subsection for the same participantId
    const fieldIds = getSubSectionFieldIds(subSectionId);
    let answeredCount = 0;

    if (fieldIds.length > 0) {
      const subsectionResponses = await Response.find({
        sessionId: session._id,
        participantId,
        fieldKey: { $in: fieldIds },
      })
        .select("fieldKey value")
        .lean() as Array<Record<string, unknown>>;

      const responseMap: Record<string, unknown> = {};
      for (const r of subsectionResponses) {
        responseMap[r.fieldKey as string] = r.value;
      }
      answeredCount = fieldIds.filter((id) => isFieldAnswered(id, responseMap[id])).length;
    }

    return NextResponse.json({
      answeredCount,
      totalCount: fieldIds.length,
      lastSavedAt: now.toISOString(),
      justCompleted: answeredCount === fieldIds.length && fieldIds.length > 0,
    });
  } catch (error) {
    console.error("[RESPONSES PATCH]", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}

/** @legacy */
async function legacyPatch(args: {
  clientId: string; section: string; sub: string; subSectionId: string;
  fieldId: string; value: unknown; userId: string; now: Date;
}) {
  const { clientId, section, sub, subSectionId, fieldId, value, userId, now } = args;

  const existing = await IntakeResponse.findOne({ clientId });
  const isTeamAssessment = existing?.teamMode === true && section === "assessment";

  let doc;
  if (isTeamAssessment) {
    doc = await IntakeResponse.findOneAndUpdate(
      { clientId },
      { $set: { [`individualResponses.${userId}.${fieldId}`]: value, lastSavedAt: now, lastActiveSub: `${section}/${sub}` } },
      { upsert: true, new: true }
    );
  } else {
    doc = await IntakeResponse.findOneAndUpdate(
      { clientId },
      { $set: { [`responses.${fieldId}`]: value, lastSavedAt: now, lastActiveSub: `${section}/${sub}` } },
      { upsert: true, new: true }
    );
  }

  const fieldIds = getSubSectionFieldIds(subSectionId);
  const responses: Record<string, unknown> = {};
  if (isTeamAssessment) {
    const userResponses = doc.individualResponses?.get(userId);
    if (userResponses) {
      for (const [k, v] of userResponses.entries()) responses[k] = v;
    }
  } else {
    if (doc.responses) {
      for (const [k, v] of doc.responses.entries()) responses[k] = v;
    }
  }

  const progress = calculateProgress(fieldIds, responses);

  await IntakeResponse.updateOne(
    { clientId },
    { $set: { [`subSectionProgress.${subSectionId}`]: { answeredCount: progress.answered, totalCount: progress.total, lastSavedAt: now } } }
  );

  return NextResponse.json({
    answeredCount: progress.answered,
    totalCount: progress.total,
    lastSavedAt: now.toISOString(),
    justCompleted: progress.answered === progress.total && progress.total > 0,
  });
}

