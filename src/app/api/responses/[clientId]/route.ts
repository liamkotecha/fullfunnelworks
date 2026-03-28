export const dynamic = "force-dynamic";
/**
 * GET /api/responses/[clientId]
 * Load all responses and progress for a client.
 *
 * Response: {
 *   responses: Record<string, unknown>,
 *   subSectionProgress: Record<string, { answeredCount, totalCount, lastSavedAt }>,
 *   lastActiveSub: string,
 *   overallProgress: number
 * }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getAllFieldIds, calculateProgress } from "@/lib/framework-nav";
import { requireAuth, assertClientAccess } from "@/lib/api-helpers";
import Client from "@/models/Client";

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

    const doc = (await IntakeResponse.findOne({ clientId }).lean()) as Record<string, unknown> | null;

    if (!doc) {
      return NextResponse.json({
        responses: {},
        subSectionProgress: {},
        lastActiveSub: "",
        overallProgress: 0,
        teamMode: false,
        teamMembers: [],
        allSubmitted: false,
        synthesisComplete: false,
      });
    }

    // .lean() returns plain objects, not Map instances — no instanceof Map check needed
    let responses = (doc.responses as Record<string, unknown>) ?? {};
    const subSectionProgress = (doc.subSectionProgress as Record<string, unknown>) ?? {};
    const teamMode = (doc.teamMode as boolean) ?? false;
    const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];
    const synthesisComplete = !!doc.synthesisCompletedAt;

    // Team mode: overlay assessment responses with the right source
    if (teamMode) {
      const individualResponses = (doc.individualResponses as Record<string, Record<string, unknown>>) ?? {};
      const synthesisResponses = (doc.synthesisResponses as Record<string, Record<string, unknown>>) ?? {};

      // Get assessment field IDs to know which keys to overlay
      const assessmentFieldIds = getAllFieldIds().filter(
        (id) =>
          id.startsWith("assessment_checklist") ||
          id.startsWith("swot-") ||
          id.startsWith("most-") ||
          id.startsWith("gap-") ||
          id.startsWith("lq-")
      );

      if (synthesisComplete) {
        // Use synthesis responses as canonical for assessment fields
        for (const fieldId of assessmentFieldIds) {
          const entry = synthesisResponses[fieldId] as Record<string, unknown> | undefined;
          if (entry?.value !== undefined) {
            responses = { ...responses, [fieldId]: entry.value };
          }
        }
      } else {
        // Use the requesting user's individual responses for assessment fields
        const userResponses = individualResponses[user.id] ?? {};
        for (const fieldId of assessmentFieldIds) {
          if (fieldId in userResponses) {
            responses = { ...responses, [fieldId]: userResponses[fieldId] };
          } else {
            // Remove any shared response for this field so they only see their own
            const copy = { ...responses };
            delete copy[fieldId];
            responses = copy;
          }
        }
      }
    }

    // Calculate overall progress
    const allFieldIds = getAllFieldIds();
    const overall = calculateProgress(allFieldIds, responses);

    const allSubmitted = teamMembers.length > 0 && teamMembers.every((m) => !!m.submittedAt);

    // Check if current user has submitted
    const currentMember = teamMembers.find(
      (m) => String(m.userId) === user.id
    );
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
  } catch (error) {
    console.error("[RESPONSES GET]", error);
    return NextResponse.json({ error: "Failed to load responses" }, { status: 500 });
  }
}
