/**
 * GET  /api/projects/[id]/modules   — return activeModules for a project
 * PUT  /api/projects/[id]/modules   — replace activeModules array (admin/consultant only)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import { requireAuth, apiError, type AuthenticatedUser } from "@/lib/api-helpers";

const VALID_MODULES = [
  "assessment",
  "people",
  "product",
  "process",
  "roadmap",
  "kpis",
  "gtm",
  "modeller",
  "hiring",
] as const;

const putSchema = z.object({
  modules: z
    .array(z.enum(VALID_MODULES))
    .min(1, "At least one module must be active"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const { id } = await params;
    await connectDB();

    const project = await Project.findById(id).select("activeModules").lean() as {
      _id: unknown;
      activeModules?: string[];
    } | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(project._id),
      activeModules: project.activeModules ?? ["assessment"],
    });
  } catch (err) {
    return apiError("PROJECT_MODULES_GET", err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;

    // Admin/consultant only
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await Project.findByIdAndUpdate(
      id,
      { $set: { activeModules: parsed.data.modules } },
      { new: true }
    )
      .select("activeModules")
      .lean() as { _id: unknown; activeModules?: string[] } | null;

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(project._id),
      activeModules: project.activeModules,
    });
  } catch (err) {
    return apiError("PROJECT_MODULES_PUT", err);
  }
}
