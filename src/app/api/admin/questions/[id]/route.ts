export const dynamic = "force-dynamic";
/**
 * GET    /api/admin/questions/[id]  — get single question
 * PATCH  /api/admin/questions/[id]  — update question fields
 * DELETE /api/admin/questions/[id]  — soft-delete (set active: false)
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const updateSchema = z.object({
  question: z.string().min(1).optional(),
  subPrompt: z.string().nullable().optional(),
  label: z.string().nullable().optional(),
  type: z.enum(["textarea", "text", "checkbox", "slider", "select"]).optional(),
  placeholder: z.string().nullable().optional(),
  order: z.number().optional(),
  active: z.boolean().optional(),
  group: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const question = await FrameworkQuestion.findById(id).lean();
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[ADMIN QUESTION GET]", error);
    return NextResponse.json({ error: "Failed to fetch question" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    const question = await FrameworkQuestion.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true }
    ).lean();

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("[ADMIN QUESTION PATCH]", error);
    return NextResponse.json({ error: "Failed to update question" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const question = await FrameworkQuestion.findByIdAndUpdate(
      id,
      { $set: { active: false } },
      { new: true }
    ).lean();

    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ question, message: "Question deactivated" });
  } catch (error) {
    console.error("[ADMIN QUESTION DELETE]", error);
    return NextResponse.json({ error: "Failed to deactivate question" }, { status: 500 });
  }
}
