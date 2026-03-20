export const dynamic = "force-dynamic";
/**
 * GET /api/questions?section=&subSection=
 * Public (authenticated) endpoint — returns active questions for portal pages.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { searchParams } = new URL(req.url);
    const section = searchParams.get("section");
    const subSection = searchParams.get("subSection");

    if (!section || !subSection) {
      return NextResponse.json({ error: "section and subSection are required" }, { status: 400 });
    }

    await connectDB();

    const questions = await FrameworkQuestion.find({
      section,
      subSection,
      active: true,
    })
      .sort({ group: 1, order: 1 })
      .select("fieldId group question subPrompt label type placeholder weightFieldId order metadata")
      .lean();

    return NextResponse.json(
      {
        questions: questions.map((q) => ({
          _id: q._id,
          fieldId: q.fieldId,
          group: q.group,
          question: q.question,
          subPrompt: q.subPrompt,
          label: q.label,
          type: q.type,
          placeholder: q.placeholder,
          weightFieldId: q.weightFieldId,
          order: q.order,
          metadata: q.metadata,
        })),
      },
      {
        headers: {
          // Questions change infrequently — cache for 60s, revalidate in background
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (error) {
    console.error("[QUESTIONS GET]", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}
