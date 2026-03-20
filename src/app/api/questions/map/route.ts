export const dynamic = "force-dynamic";
/**
 * GET /api/questions/map
 * Returns a flat { fieldId: questionText } map of all active questions.
 * Used by admin responses viewer to display human-readable labels.
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { requireAuth } from "@/lib/api-helpers";

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();

    const questions = await FrameworkQuestion.find({ active: true })
      .select("fieldId question")
      .lean();

    const map: Record<string, string> = {};
    for (const q of questions) {
      map[q.fieldId] = q.question;
    }

    return NextResponse.json(map, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("[QUESTIONS MAP]", error);
    return NextResponse.json({ error: "Failed to load questions map" }, { status: 500 });
  }
}
