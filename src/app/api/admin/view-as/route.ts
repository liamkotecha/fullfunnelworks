export const dynamic = "force-dynamic";
/**
 * POST   /api/admin/view-as — set view-as mode cookie
 * DELETE /api/admin/view-as — clear view-as mode cookie
 *
 * Auth: admin/consultant only.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import { z } from "zod";

const postSchema = z.object({ clientId: z.string().min(1) });

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    if (user.role === "client") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the client exists
    const client = await Client.findById(parsed.data.clientId)
      .select("_id businessName assignedConsultant")
      .lean() as Record<string, unknown> | null;
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Consultants may only view-as their own clients
    if (user.role === "consultant" && String(client.assignedConsultant) !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const res = NextResponse.json({ ok: true, clientId: parsed.data.clientId });
    res.cookies.set("view-as-client-id", parsed.data.clientId, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 3600,
      path: "/",
    });

    return res;
  } catch (error) {
    return apiError("VIEW_AS_POST", error);
  }
}

export async function DELETE() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const res = NextResponse.json({ ok: true });
    res.cookies.set("view-as-client-id", "", {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return res;
  } catch (error) {
    return apiError("VIEW_AS_DELETE", error);
  }
}
