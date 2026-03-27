export const dynamic = "force-dynamic";
/**
 * GET /api/me/client
 * Returns the Client record associated with the logged-in user.
 * Supports view-as mode: when a view-as cookie is set, returns the
 * target client with isViewAs=true and viewingAs metadata.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, resolvePortalClient, type AuthenticatedUser } from "@/lib/api-helpers";

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    await connectDB();

    const resolved = await resolvePortalClient(user, req);
    if (!resolved) {
      return NextResponse.json({ error: "No client found" }, { status: 404 });
    }

    const client = await Client.findById(resolved.clientId).lean() as Record<string, unknown> | null;
    if (!client) {
      return NextResponse.json({ error: "No client found" }, { status: 404 });
    }

    return NextResponse.json({
      clientId: String(client._id),
      businessName: client.businessName,
      status: client.status,
      plan: client.plan ?? "standard",
      activeModules: (client.activeModules as string[]) ?? [],
      isViewAs: resolved.isViewAs,
      ...(resolved.isViewAs
        ? {
            viewingAs: {
              businessName: client.businessName as string,
              contactName: (client.contactName as string) ?? undefined,
            },
          }
        : {}),
    });
  } catch (error) {
    console.error("[ME CLIENT]", error);
    return NextResponse.json({ error: "Failed to fetch client" }, { status: 500 });
  }
}
