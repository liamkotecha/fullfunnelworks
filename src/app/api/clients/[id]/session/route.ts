export const dynamic = "force-dynamic";
/**
 * PATCH /api/clients/[id]/session
 * Update the client's last active sub-section.
 *
 * Body: { lastActiveSub: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import IntakeResponse from "@/models/IntakeResponse";
import { z } from "zod";
import { requireAuth } from "@/lib/api-helpers";

const bodySchema = z.object({
  lastActiveSub: z.string().min(1),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userOrRes = await requireAuth();
  if (userOrRes instanceof NextResponse) return userOrRes;

  const { id: clientId } = await params;
  const body = await req.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await connectDB();

  await IntakeResponse.updateOne(
    { clientId },
    { $set: { lastActiveSub: parsed.data.lastActiveSub } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}
