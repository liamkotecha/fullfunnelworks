export const dynamic = "force-dynamic";
/**
 * PUT    /api/notes/[clientId]/[fieldId] — upsert a consultant note
 * DELETE /api/notes/[clientId]/[fieldId] — delete a consultant note
 *
 * Auth: admin/consultant only — 403 for client role.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ConsultantNote from "@/models/ConsultantNote";
import Client from "@/models/Client";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { z } from "zod";

const putSchema = z.object({ note: z.string().min(1) });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ clientId: string; fieldId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId, fieldId } = await params;
    await connectDB();

    if (user.role === "consultant") {
      const clientDoc = await Client.findById(clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const doc = await ConsultantNote.findOneAndUpdate(
      { clientId, fieldId },
      {
        clientId,
        fieldId,
        note: parsed.data.note,
        updatedBy: user.id,
        $setOnInsert: { createdBy: user.id },
      },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({
      fieldId: (doc as Record<string, unknown>).fieldId,
      note: (doc as Record<string, unknown>).note,
      updatedAt: (doc as Record<string, unknown>).updatedAt
        ? new Date((doc as Record<string, unknown>).updatedAt as string).toISOString()
        : null,
    });
  } catch (error) {
    return apiError("NOTES_PUT", error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string; fieldId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId, fieldId } = await params;
    await connectDB();

    if (user.role === "consultant") {
      const clientDoc = await Client.findById(clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    await ConsultantNote.deleteOne({ clientId, fieldId });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError("NOTES_DELETE", error);
  }
}
