/**
 * PATCH /api/responses/[clientId]/[section]/[sub]
 * Save a single field response and recalculate sub-section progress.
 *
 * Body: { fieldId: string, value: string | number | boolean }
 * Response: { answeredCount, totalCount, lastSavedAt }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { getSubSectionFieldIds, isFieldAnswered, calculateProgress } from "@/lib/framework-nav";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

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
      return NextResponse.json(
        { error: "View-as mode is read-only" },
        { status: 403 }
      );
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

    // Check if team mode + assessment section → save to individualResponses
    const now = new Date();
    const existing = await IntakeResponse.findOne({ clientId });
    const isTeamAssessment = existing?.teamMode === true && section === "assessment";

    let doc;
    if (isTeamAssessment) {
      // Save to individualResponses.[userId].[fieldId]
      doc = await IntakeResponse.findOneAndUpdate(
        { clientId },
        {
          $set: {
            [`individualResponses.${user.id}.${fieldId}`]: value,
            lastSavedAt: now,
            lastActiveSub: `${section}/${sub}`,
          },
        },
        { upsert: true, new: true }
      );
    } else {
      // Default: save to responses.[fieldId]
      doc = await IntakeResponse.findOneAndUpdate(
        { clientId },
        {
          $set: {
            [`responses.${fieldId}`]: value,
            lastSavedAt: now,
            lastActiveSub: `${section}/${sub}`,
          },
        },
        { upsert: true, new: true }
      );
    }

    // Recalculate sub-section progress
    const fieldIds = getSubSectionFieldIds(subSectionId);
    const responses: Record<string, unknown> = {};

    if (isTeamAssessment) {
      // Progress is per-user for team mode
      const userResponses = doc.individualResponses?.get(user.id);
      if (userResponses) {
        for (const [k, v] of userResponses.entries()) {
          responses[k] = v;
        }
      }
    } else {
      if (doc.responses) {
        for (const [k, v] of doc.responses.entries()) {
          responses[k] = v;
        }
      }
    }

    const progress = calculateProgress(fieldIds, responses);

    // Store sub-section progress in the same document (single atomic operation)
    await IntakeResponse.updateOne(
      { clientId },
      {
        $set: {
          [`subSectionProgress.${subSectionId}`]: {
            answeredCount: progress.answered,
            totalCount: progress.total,
            lastSavedAt: now,
          },
        },
      }
    );

    return NextResponse.json({
      answeredCount: progress.answered,
      totalCount: progress.total,
      lastSavedAt: now.toISOString(),
      justCompleted: progress.answered === progress.total && progress.total > 0,
    });
  } catch (error) {
    console.error("[RESPONSES PATCH]", error);
    return NextResponse.json({ error: "Failed to save response" }, { status: 500 });
  }
}
