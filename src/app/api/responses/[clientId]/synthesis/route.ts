export const dynamic = "force-dynamic";
/**
 * GET  /api/responses/[clientId]/synthesis — all individual responses side by side (admin/consultant only)
 * POST /api/responses/[clientId]/synthesis — save synthesis answers (admin/consultant only)
 *
 * Dual-path: if IntakeResponse.migratedAt is set → read/write new Response model.
 * Otherwise → legacy IntakeResponse path.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, resolveClientSession } from "@/lib/api-helpers";
import Client from "@/models/Client";
import IntakeResponse from "@/models/IntakeResponse";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { calculateDivergence } from "@/lib/divergence";
import { z } from "zod";

async function assertSynthesisAccess(user: { id: string; role?: string }, clientId: string) {
  if (user.role !== "admin" && user.role !== "consultant") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "consultant") {
    const clientDoc = await Client.findById(clientId).select("assignedConsultant").lean();
    if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
  return null;
}

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

    const accessErr = await assertSynthesisAccess(user, clientId);
    if (accessErr) return accessErr;

    const questions = await FrameworkQuestion.find({ section: "assessment", active: true })
      .sort({ subSection: 1, group: 1, order: 1 })
      .lean() as Array<Record<string, unknown>>;

    // ── Routing gate ────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ───────────────────────────────────────────────────────
      const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
      if (!doc) return NextResponse.json({ error: "No responses found" }, { status: 404 });

      const individualResponses = (doc.individualResponses as Record<string, Record<string, unknown>>) ?? {};
      const synthesisResponses = (doc.synthesisResponses as Record<string, Record<string, unknown>>) ?? {};
      const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];

      const result = questions.map((q) => {
        const fieldId = q.fieldId as string;
        const fieldType = (q.type as string) ?? "textarea";
        const answers = teamMembers.map((m) => {
          const userId = String(m.userId);
          const userResponses = individualResponses[userId] ?? {};
          return { userId, name: m.name as string, role: m.role as string, value: userResponses[fieldId] ?? null };
        });
        const divergence = calculateDivergence(answers.map((a) => a.value), fieldType as "textarea" | "text" | "checkbox" | "slider" | "select");
        const existing = synthesisResponses[fieldId] as Record<string, unknown> | undefined;
        return { fieldId, question: q.question as string, subSection: q.subSection as string, group: (q.group as string | null) ?? null, type: fieldType, answers, divergence, existingSynthesis: existing?.value ?? null, synthesisSource: existing?.source ?? null };
      });

      return NextResponse.json({ questions: result });
    }

    // ── New model path ──────────────────────────────────────────────────────
    const { session } = resolved;
    const { default: Response } = await import("@/models/Response");
    const { default: Participant } = await import("@/models/Participant");

    const [allResponses, participants] = await Promise.all([
      Response.find({ sessionId: session._id }).lean() as Promise<Array<Record<string, unknown>>>,
      Participant.find({ sessionId: session._id }).populate("userId", "name email role").lean() as Promise<Array<Record<string, unknown>>>,
    ]);

    const result = questions.map((q) => {
      const fieldId = q.fieldId as string;
      const fieldType = (q.type as string) ?? "textarea";

      const answers = participants.map((p) => {
        const u = p.userId as Record<string, unknown>;
        const participantId = String(p._id);
        const responseDoc = allResponses.find(
          (r) => String(r.participantId) === participantId && r.fieldKey === fieldId
        );
        return {
          userId: String(u?._id ?? p.userId),
          name: (u?.name as string) ?? "",
          role: (p.role as string) ?? "",
          value: responseDoc?.value ?? null,
        };
      });

      const divergence = calculateDivergence(
        answers.map((a) => a.value),
        fieldType as "textarea" | "text" | "checkbox" | "slider" | "select"
      );

      const canonicalDoc = allResponses.find(
        (r) => r.participantId == null && r.fieldKey === fieldId
      );

      return {
        fieldId,
        question: q.question as string,
        subSection: q.subSection as string,
        group: (q.group as string | null) ?? null,
        type: fieldType,
        answers,
        divergence,
        existingSynthesis: canonicalDoc?.value ?? null,
        synthesisSource: canonicalDoc?.source ?? null,
      };
    });

    return NextResponse.json({ questions: result });
  } catch (error) {
    console.error("[SYNTHESIS GET]", error);
    return NextResponse.json({ error: "Failed to load synthesis data" }, { status: 500 });
  }
}

const synthesisBodySchema = z.array(
  z.object({
    fieldId: z.string().min(1),
    value: z.unknown(),
    source: z.enum(["consultant", "consensus"]).default("consultant"),
  })
);

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const { clientId } = await params;

    await connectDB();

    const accessErr = await assertSynthesisAccess(user, clientId);
    if (accessErr) return accessErr;

    const body = await req.json();
    const parsed = synthesisBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const entries = parsed.data;
    const now = new Date();

    // ── Routing gate ────────────────────────────────────────────────────────
    const resolved = await resolveClientSession(clientId);

    if (!resolved) {
      // ── Legacy path ───────────────────────────────────────────────────────
      const $set: Record<string, unknown> = {};
      for (const entry of entries) {
        $set[`synthesisResponses.${entry.fieldId}`] = { value: entry.value, source: entry.source, writtenBy: user.id, writtenAt: now };
      }
      await IntakeResponse.updateOne({ clientId }, { $set });

      const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
      const synthesisMap = (doc?.synthesisResponses as Record<string, unknown>) ?? {};
      const totalQuestions = await FrameworkQuestion.countDocuments({ section: "assessment", active: true });
      const synthesisedCount = Object.keys(synthesisMap).length;
      const allComplete = synthesisedCount >= totalQuestions;

      if (allComplete && !doc?.synthesisCompletedAt) {
        await IntakeResponse.updateOne({ clientId }, { $set: { synthesisCompletedAt: now, synthesisCompletedBy: user.id } });
      }
      return NextResponse.json({ saved: entries.length, synthesisedCount, totalQuestions, allComplete });
    }

    // ── New model path ──────────────────────────────────────────────────────
    const { session } = resolved;
    const { default: Response } = await import("@/models/Response");

    for (const entry of entries) {
      await Response.findOneAndUpdate(
        { sessionId: session._id, participantId: null, fieldKey: entry.fieldId },
        { $set: { value: entry.value, source: entry.source, updatedAt: now } },
        { upsert: true, new: true }
      );
    }

    // Synthesis completion: count canonical Responses for assessment fieldKeys
    const totalQuestions = await FrameworkQuestion.countDocuments({ section: "assessment", active: true });
    const synthesisedCount = await Response.countDocuments({ sessionId: session._id, participantId: null });
    const allComplete = synthesisedCount >= totalQuestions;

    if (allComplete && !session.synthesisCompletedAt) {
      session.synthesisCompletedAt = now;
      session.synthesisCompletedBy = user.id as unknown as import("mongoose").Types.ObjectId;
      session.status = "synthesised";
      await session.save();
    }

    return NextResponse.json({ saved: entries.length, synthesisedCount, totalQuestions, allComplete });
  } catch (error) {
    console.error("[SYNTHESIS POST]", error);
    return NextResponse.json({ error: "Failed to save synthesis" }, { status: 500 });
  }
}

