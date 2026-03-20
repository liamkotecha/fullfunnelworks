export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prospect from "@/models/Prospect";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";

/* ── GET /api/prospects/export ────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};
    const stageParam = searchParams.get("stage");
    if (stageParam) filter.stage = { $in: stageParam.split(",") };
    const source = searchParams.get("source");
    if (source) filter.source = source;
    const assignedTo = searchParams.get("assignedTo");
    if (assignedTo) filter.assignedConsultant = assignedTo;

    const prospects = await Prospect.find(filter)
      .populate("assignedConsultant", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Build CSV
    const headers = [
      "Business Name",
      "Contact Name",
      "Contact Email",
      "Phone",
      "Website",
      "Company Size",
      "Revenue Range",
      "Primary Challenge",
      "Heard About Us",
      "Stage",
      "Lead Score",
      "Source",
      "Deal Value (pence)",
      "Assigned Consultant",
      "Lost Reason",
      "Notes",
      "Created At",
      "Updated At",
    ];

    const escapeCSV = (val: string | undefined | null): string => {
      if (val == null) return "";
      const str = String(val);
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = (prospects as Record<string, unknown>[]).map((p) => {
      const consultant = p.assignedConsultant as Record<string, unknown> | null;
      return [
        escapeCSV(p.businessName as string),
        escapeCSV(p.contactName as string),
        escapeCSV(p.contactEmail as string),
        escapeCSV(p.phone as string),
        escapeCSV(p.website as string),
        escapeCSV(p.companySize as string),
        escapeCSV(p.revenueRange as string),
        escapeCSV(p.primaryChallenge as string),
        escapeCSV(p.hearAboutUs as string),
        escapeCSV(p.stage as string),
        String((p.leadScore as number) ?? 0),
        escapeCSV(p.source as string),
        String((p.dealValue as number) ?? ""),
        escapeCSV(consultant ? String(consultant.name ?? "") : ""),
        escapeCSV(p.lostReason as string),
        escapeCSV(p.notes as string),
        p.createdAt ? new Date(p.createdAt as string).toISOString() : "",
        p.updatedAt ? new Date(p.updatedAt as string).toISOString() : "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const date = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="prospects-${date}.csv"`,
      },
    });
  } catch (error) {
    return apiError("PROSPECTS EXPORT", error);
  }
}
