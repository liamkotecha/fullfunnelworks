export const dynamic = "force-dynamic";
/**
 * GET /api/responses/[clientId]
 * Load all responses and progress for a client.
 *
 * Dual-path: if IntakeResponse.migratedAt is set → read from new Session/Response model.
 * Otherwise → legacy IntakeResponse path.
 *
 * Response shape is identical on both paths.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getAllFieldIds, calculateProgress, getSubSectionFieldIds, isFieldAnswered } from "@/lib/framework-nav";
import { requireAuth, assertClientAccess, resolveClientSession } from "@/lib/api-helpers";
import Client from "@/models/Client";

const EMPTY_RESPONSE = {
  responses: {},
  subSectionProgress: {},
  lastActiveSub: "",
  overallProgress: 0,
  teamMode: false,
  teamMembers: [],
  allSubmitted: false,
  synthesisComplete: false,
  userSubmitted: false,
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const { clientId } = await params;

    await connectDB();

    const guard = await assertClientAccess(user, clientId);
    if (guard) return guard;

    // ── Routing gate ─────────────────────────────────────────
    // resolveClientSession returns null when IntakeResponse.migratedAt is NOT set
    // (cutover guard) or when no project exists yet.
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ────────────────────────────────────────
      return legacyGet(clientId, user.id);
    }

    // ── New model path ───────────────────────────────────────
    const { session } = resolved;
    const { default: Response } = await import("@/models/Response");
    const { default: Participant } = await import("@/models/Participant");

    const [allResponses, participants] = await Promise.all([
      Response.find({ sessionId: session._id }).lean() as Promise<Array<Record<string, unknown>>>,
      Participant.find({ sessionId: session._id })
        .populate("userId", "name email")
        .lean() as Promise<Array<Record<string, unknown>>>,
    ]);

    const teamMode = session.teamMode;
    const synthesisComplete = !!session.synthesisCompletedAt;

    // Find this user's Participant record (if they are a team member)
    const myParticipant = participants.find((p) => String((p.userId as Record<string, unknown>)?._id ?? p.userId) === user.id);

    // Build response map — start with canonicals (participantId=null)
    let responses: Record<string, unknown> = {};
    for (const r of allResponses) {
      if (r.participantId == null) {
        responses[r.fieldKey as string] = r.value;
      }
    }

    if (teamMode && myParticipant && !synthesisComplete) {
      // Overlay with this user's individual responses for assessment fields
      const assessmentFieldIds = new Set(
        getAllFieldIds().filter(
          (id) =>
            id.startsWith("assessment_checklist") ||
            id.startsWith("swot-") ||
            id.startsWith("most-") ||
            id.startsWith("gap-") ||
            id.startsWith("lq-")
        )
      );

      // Remove canonical assessment fields first (user only sees their own)
      for (const fieldId of assessmentFieldIds) {
        delete responses[fieldId];
      }

      // Overlay individual
      for (const r of allResponses) {
        if (String(r.participantId) === String(myParticipant._id)) {
          responses[r.fieldKey as string] = r.value;
        }
      }
    }

    // Derive subSectionProgress from Response docs
    const allSubs = [
      ...new Set(getAllFieldIds().map((id) => {
        // fieldId → subSectionId mapping via framework-nav
        // We compute progress per subsection by counting answered fields
        return null; // placeholder — use direct computation below
      })),
    ];

    // Build subSectionProgress by grouping responses
    const subSectionProgress: Record<string, { answeredCount: number; totalCount: number; lastSavedAt: string | null }> = {};
    const subsToCheck = [
      "assessment-checklist","assessment-swot","assessment-most","assessment-gap","assessment-leadership",
      "people-team","people-structure","people-challenges","people-methodology",
      "product-challenges","product-outcomes",
      "process-checklist","process-methodology","process-builder",
      "roadmap-roadmap","kpis-kpis",
      "gtm-market","gtm-competition",
    ];
    for (const subId of subsToCheck) {
      const fieldIds = getSubSectionFieldIds(subId);
      if (fieldIds.length === 0) continue;
      const answered = fieldIds.filter((id) => isFieldAnswered(id, responses[id])).length;
      // Find most recent save in this subsection
      const subResponses = allResponses.filter(
        (r) => fieldIds.includes(r.fieldKey as string) && r.participantId == null
      );
      const lastSaved = subResponses.reduce<string | null>((max, r) => {
        const t = r.updatedAt ? new Date(r.updatedAt as string).toISOString() : null;
        return t && (!max || t > max) ? t : max;
      }, null);
      subSectionProgress[subId] = { answeredCount: answered, totalCount: fieldIds.length, lastSavedAt: lastSaved };
    }

    const allFieldIds = getAllFieldIds();
    const overall = calculateProgress(allFieldIds, responses);

    const allSubmitted = participants.length > 0 && participants.every((p) => !!p.submittedAt);
    const userSubmitted = myParticipant ? !!myParticipant.submittedAt : false;

    return NextResponse.json({
      responses,
      subSectionProgress,
      lastActiveSub: session.lastActiveSub ?? "",
      overallProgress: overall.percent,
      teamMode,
      teamMembers: participants.map((p) => {
        const u = p.userId as Record<string, unknown>;
        return {
          userId: String(u?._id ?? p.userId),
          name: u?.name ?? "",
          email: u?.email ?? "",
          role: p.role,
          submittedAt: p.submittedAt ? new Date(p.submittedAt as string).toISOString() : null,
          isComplete: !!p.submittedAt,
        };
      }),
      allSubmitted,
      synthesisComplete,
      userSubmitted,
    });
  } catch (error) {
    console.error("[RESPONSES GET]", error);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}

/** @legacy */
async function legacyGet(clientId: string, userId: string) {
  const doc = (await IntakeResponse.findOne({ clientId }).lean()) as Record<string, unknown> | null;

  if (!doc) return NextResponse.json(EMPTY_RESPONSE);

  let responses = (doc.responses as Record<string, unknown>) ?? {};
  const subSectionProgress = (doc.subSectionProgress as Record<string, unknown>) ?? {};
  const teamMode = (doc.teamMode as boolean) ?? false;
  const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];
  const synthesisComplete = !!doc.synthesisCompletedAt;

  if (teamMode) {
    const individualResponses = (doc.individualResponses as Record<string, Record<string, unknown>>) ?? {};
    const synthesisResponses = (doc.synthesisResponses as Record<string, Record<string, unknown>>) ?? {};
    const assessmentFieldIds = getAllFieldIds().filter(
      (id) =>
        id.startsWith("assessment_checklist") ||
        id.startsWith("swot-") ||
        id.startsWith("most-") ||
        id.startsWith("gap-") ||
        id.startsWith("lq-")
    );
    if (synthesisComplete) {
      for (const fieldId of assessmentFieldIds) {
        const entry = synthesisResponses[fieldId] as Record<string, unknown> | undefined;
        if (entry?.value !== undefined) responses = { ...responses, [fieldId]: entry.value };
      }
    } else {
      const userResponses = individualResponses[userId] ?? {};
      for (const fieldId of assessmentFieldIds) {
        if (fieldId in userResponses) {
          responses = { ...responses, [fieldId]: userResponses[fieldId] };
        } else {
          const copy = { ...responses };
          delete copy[fieldId];
          responses = copy;
        }
      }
    }
  }

  const allFieldIds = getAllFieldIds();
  const overall = calculateProgress(allFieldIds, responses);
  const allSubmitted = teamMembers.length > 0 && teamMembers.every((m) => !!m.submittedAt);
  const currentMember = teamMembers.find((m) => String(m.userId) === userId);
  const userSubmitted = !!currentMember?.submittedAt;

  return NextResponse.json({
    responses,
    subSectionProgress,
    lastActiveSub: doc.lastActiveSub ?? "",
    overallProgress: overall.percent,
    teamMode,
    teamMembers: teamMembers.map((m) => ({
      userId: String(m.userId),
      name: m.name,
      email: m.email,
      role: m.role,
      submittedAt: m.submittedAt ? new Date(m.submittedAt as string).toISOString() : null,
      isComplete: !!m.submittedAt,
    })),
    allSubmitted,
    synthesisComplete,
    userSubmitted,
  });
}
