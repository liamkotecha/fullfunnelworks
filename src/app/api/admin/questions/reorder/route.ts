export const dynamic = "force-dynamic";
/**
 * POST /api/admin/questions/reorder
 * Bulk update question order within a section/subSection.
 * Body: { items: [{ id: string, order: number }] }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import FrameworkQuestion from "@/models/FrameworkQuestion";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      order: z.number(),
    })
  ),
});

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
    }

    await connectDB();

    const ops = parsed.data.items.map((item) => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { order: item.order } },
      },
    }));

    const result = await FrameworkQuestion.bulkWrite(ops);

    return NextResponse.json({
      modified: result.modifiedCount,
      total: parsed.data.items.length,
    });
  } catch (error) {
    console.error("[ADMIN QUESTIONS REORDER]", error);
    return NextResponse.json({ error: "Failed to reorder questions" }, { status: 500 });
  }
}
