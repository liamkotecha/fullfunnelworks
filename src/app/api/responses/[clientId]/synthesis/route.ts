export const dynamic = "force-dynamic";
/**
 * GET  /api/responses/[clientId]/synthesis — all individual responses side by side (admin only)
 * POST /api/responses/[clientId]/synthesis — save synthesis answers (admin only)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth } from "@/lib/api-helpers";
import IntakeResponse from "@/models/IntakeResponse";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { calculateDivergence } from "@/lib/divergence";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId } = await params;

    await connectDB();

    const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
    if (!doc) {
      return NextResponse.json({ error: "No responses found" }, { status: 404 });
    }

    // Get all assessment questions from the DB
    const questions = await FrameworkQuestion.find({
      section: "assessment",
      active: true,
    })
      .sort({ subSection: 1, group: 1, order: 1 })
      .lean() as Array<Record<string, unknown>>;

    const individualResponses = (doc.individualResponses as Record<string, Record<string, unknown>>) ?? {};
    const synthesisResponses = (doc.synthesisResponses as Record<string, Record<string, unknown>>) ?? {};
    const teamMembers = (doc.teamMembers as Array<Record<string, unknown>>) ?? [];

    // Build per-question synthesis data
    const result = questions.map((q) => {
      const fieldId = q.fieldId as string;
      const fieldType = (q.type as string) ?? "textarea";

      // Collect each member's answer
      const answers = teamMembers.map((m) => {
        const userId = String(m.userId);
        const userResponses = individualResponses[userId] ?? {};
        return {
          userId,
          name: m.name as string,
          role: m.role as string,
          value: userResponses[fieldId] ?? null,
        };
      });

      // Calculate divergence
      const values = answers.map((a) => a.value);
      const divergence = calculateDivergence(
        values,
        fieldType as "textarea" | "text" | "checkbox" | "slider" | "select"
      );

      // Existing synthesis
      const existing = synthesisResponses[fieldId] as Record<string, unknown> | undefined;

      return {
        fieldId,
        question: q.question as string,
        subSection: q.subSection as string,
        group: q.group as string | null,
        type: fieldType,
        answers,
        divergence,
        existingSynthesis: existing?.value ?? null,
        synthesisSource: existing?.source ?? null,
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

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId } = await params;
    const body = await req.json();
    const parsed = synthesisBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    const entries = parsed.data;

    await connectDB();

    // Build $set for each synthesis entry
    const $set: Record<string, unknown> = {};
    const now = new Date();
    for (const entry of entries) {
      $set[`synthesisResponses.${entry.fieldId}`] = {
        value: entry.value,
        source: entry.source,
        writtenBy: user.id,
        writtenAt: now,
      };
    }

    await IntakeResponse.updateOne({ clientId }, { $set });

    // Check if all assessment fields now have synthesis entries
    const doc = await IntakeResponse.findOne({ clientId }).lean() as Record<string, unknown> | null;
    const synthesisMap = (doc?.synthesisResponses as Record<string, unknown>) ?? {};

    // Get total assessment question count
    const totalQuestions = await FrameworkQuestion.countDocuments({
      section: "assessment",
      active: true,
    });

    const synthesisedCount = Object.keys(synthesisMap).length;
    const allComplete = synthesisedCount >= totalQuestions;

    if (allComplete && !doc?.synthesisCompletedAt) {
      await IntakeResponse.updateOne(
        { clientId },
        { $set: { synthesisCompletedAt: now, synthesisCompletedBy: user.id } }
      );
    }

    return NextResponse.json({
      saved: entries.length,
      synthesisedCount,
      totalQuestions,
      allComplete,
    });
  } catch (error) {
    console.error("[SYNTHESIS POST]", error);
    return NextResponse.json({ error: "Failed to save synthesis" }, { status: 500 });
  }
}
