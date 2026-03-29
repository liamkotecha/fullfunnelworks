export const dynamic = "force-dynamic";
/**
 * GET  /api/admin/questions           — list all questions (with optional filters)
 * POST /api/admin/questions           — create a new question
 *
 * Query params: ?section=&subSection=&group=&active=true
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  fieldId: z.string().min(1),
  section: z.string().min(1),
  subSection: z.string().min(1),
  group: z.string().optional(),
  question: z.string().min(1),
  subPrompt: z.string().optional(),
  label: z.string().optional(),
  type: z.enum(["textarea", "text", "checkbox", "slider", "select"]).default("textarea"),
  placeholder: z.string().optional(),
  weightFieldId: z.string().optional(),
  order: z.number().default(0),
  active: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const filter: Record<string, unknown> = {};

    const section = searchParams.get("section");
    const subSection = searchParams.get("subSection");
    const group = searchParams.get("group");
    const active = searchParams.get("active");

    if (section) filter.section = section;
    if (subSection) filter.subSection = subSection;
    if (group) filter.group = group;
    if (active !== null) filter.active = active !== "false";

    await connectDB();

    const questions = await FrameworkQuestion.find(filter)
      .sort({ section: 1, subSection: 1, group: 1, order: 1 })
      .lean();

    // Build summary stats
    const stats = {
      total: questions.length,
      active: questions.filter((q) => q.active).length,
      sections: Array.from(new Set(questions.map((q) => q.section))),
    };

    return NextResponse.json({ questions, stats });
  } catch (error) {
    console.error("[ADMIN QUESTIONS GET]", error);
    return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    // Check for duplicate fieldId
    const exists = await FrameworkQuestion.findOne({ fieldId: parsed.data.fieldId });
    if (exists) {
      return NextResponse.json({ error: "A question with this fieldId already exists" }, { status: 409 });
    }

    const question = await FrameworkQuestion.create(parsed.data);
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    console.error("[ADMIN QUESTIONS POST]", error);
    return NextResponse.json({ error: "Failed to create question" }, { status: 500 });
  }
}
