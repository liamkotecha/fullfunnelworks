export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";
import ConsultantResponse from "@/models/ConsultantResponse";
import Project from "@/models/Project";

const VALID_SECTIONS = ["revenue_execution", "execution_planning"] as const;

type Params = { params: Promise<{ id: string; section: string; sub: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id, section, sub } = await params;

    if (!VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    await connectDB();

    const doc = await ConsultantResponse.findOne({
      projectId: id,
      section,
      sub,
    }).lean() as Record<string, unknown> | null;

    return NextResponse.json({
      responses: doc?.responses ?? {},
      updatedAt: doc?.updatedAt ?? null,
    });
  } catch (err) {
    return apiError("CONSULTANT_RESPONSES_GET", err);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id, section, sub } = await params;

    if (!VALID_SECTIONS.includes(section as (typeof VALID_SECTIONS)[number])) {
      return NextResponse.json({ error: "Invalid section" }, { status: 400 });
    }

    const body = await req.json();
    if (!body.responses || typeof body.responses !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    await connectDB();

    // Verify project exists
    const project = await Project.findById(id).select("_id").lean();
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const doc = await ConsultantResponse.findOneAndUpdate(
      { projectId: id, section, sub },
      {
        $set: { responses: body.responses, updatedBy: user.id },
        $setOnInsert: { projectId: id, section, sub },
      },
      { upsert: true, new: true }
    ).lean() as Record<string, unknown>;

    return NextResponse.json({
      responses: doc.responses,
      updatedAt: doc.updatedAt,
    });
  } catch (err) {
    return apiError("CONSULTANT_RESPONSES_PUT", err);
  }
}
