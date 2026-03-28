export const dynamic = "force-dynamic";
/**
 * GET /api/notes/[clientId]
 * Returns all consultant notes for a client.
 * Auth: admin/consultant only — 403 for client role.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import ConsultantNote from "@/models/ConsultantNote";
import Client from "@/models/Client";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { clientId } = await params;
    await connectDB();

    if (user.role === "consultant") {
      const clientDoc = await Client.findById(clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const notes = await ConsultantNote.find({ clientId })
      .select("fieldId note updatedAt")
      .lean();

    return NextResponse.json(
      notes.map((n: Record<string, unknown>) => ({
        fieldId: n.fieldId,
        note: n.note,
        updatedAt: n.updatedAt
          ? new Date(n.updatedAt as string).toISOString()
          : null,
      }))
    );
  } catch (error) {
    return apiError("NOTES_GET", error);
  }
}
