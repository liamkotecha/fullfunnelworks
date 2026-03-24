export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, resolvePortalClient, apiError } from "@/lib/api-helpers";
import ConsultantResponse from "@/models/ConsultantResponse";
import Project from "@/models/Project";

type Params = { params: Promise<{ section: string; sub: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    const { section, sub } = await params;

    await connectDB();

    const portal = await resolvePortalClient(user, req);
    if (!portal) {
      return NextResponse.json({ responses: {}, updatedAt: null });
    }

    // Find the client's active project
    const project = await Project.findOne({ clientId: portal.clientId })
      .sort({ createdAt: -1 })
      .select("_id")
      .lean() as Record<string, unknown> | null;

    if (!project) {
      return NextResponse.json({ responses: {}, updatedAt: null });
    }

    const doc = await ConsultantResponse.findOne({
      projectId: String(project._id),
      section,
      sub,
    }).lean() as Record<string, unknown> | null;

    return NextResponse.json({
      responses: doc?.responses ?? {},
      updatedAt: doc?.updatedAt ?? null,
    });
  } catch (err) {
    return apiError("PORTAL_CONSULTANT_RESPONSES_GET", err);
  }
}
