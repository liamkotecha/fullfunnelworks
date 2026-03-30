export const dynamic = "force-dynamic";
/**
 * GET /api/clients/search?q=term
 * Lightweight search-only endpoint — returns the bare minimum fields
 * needed for the search UI. Requires an authenticated admin/consultant session.
 * Never exposes contact details, address, notes, or invoicing data.
 */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import { requireAuth, escapeRegex } from "@/lib/api-helpers";

interface SearchResult {
  id: string;
  businessName: string;
  status: string;
}

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    // Only admins and consultants should hit this endpoint
    if (userOrRes.role !== "admin" && userOrRes.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (!q) return NextResponse.json({ data: [] });

    await connectDB();

    const nameFilter = { businessName: { $regex: escapeRegex(q), $options: "i" } };
    // Consultants can only search within their own assigned clients
    const scopeFilter = userOrRes.role === "consultant"
      ? { assignedConsultant: userOrRes.id }
      : {};

    const clients = await Client.find(
      { ...nameFilter, ...scopeFilter },
      { _id: 1, businessName: 1, status: 1 }   // projection — nothing else
    )
      .limit(8)
      .lean();

    const data: SearchResult[] = (clients as unknown as Array<{ _id: unknown; businessName: string; status: string }>).map((c) => ({
      id: String(c._id),
      businessName: c.businessName,
      status: c.status,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("[CLIENTS SEARCH]", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
