export const dynamic = "force-dynamic";
/**
 * GET  /api/projects/[id]/modules   — return activeModules for a project
 * PUT  /api/projects/[id]/modules   — replace activeModules array (admin/consultant only)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Client from "@/models/Client";
import User from "@/models/User";
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
  "revenue_execution",
  "execution_planning",
] as const;

const putSchema = z.object({
  activeModules: z
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

    // For consultants: verify ownership and enforce plan-allowed modules
    if (user.role === "consultant") {
      // 1. Ownership: project must belong to one of their clients
      const project = await Project.findById(id).select("clientId").lean() as { clientId: unknown } | null;
      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }
      const clientDoc = await Client.findById(project.clientId)
        .select("assignedConsultant")
        .lean() as { assignedConsultant: unknown } | null;
      if (!clientDoc || String(clientDoc.assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // 2. Plan enforcement: consultants may only enable modules in their allowedModules
      const userDoc = await User.findById(user.id)
        .select("consultantProfile.allowedModules")
        .lean() as { consultantProfile?: { allowedModules?: string[] } } | null;
      const allowedModules: string[] = userDoc?.consultantProfile?.allowedModules ?? [];

      const disallowed = parsed.data.activeModules.filter(
        (m) => m !== "assessment" && !allowedModules.includes(m)
      );
      if (disallowed.length > 0) {
        return NextResponse.json(
          { error: `Modules not in your plan: ${disallowed.join(", ")}` },
          { status: 403 }
        );
      }
    }

    const updated = await Project.findByIdAndUpdate(
      id,
      { $set: { activeModules: parsed.data.activeModules } },
      { new: true }
    )
      .select("activeModules")
      .lean() as { _id: unknown; activeModules?: string[] } | null;

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: String(updated._id),
      activeModules: updated.activeModules,
    });
  } catch (err) {
    return apiError("PROJECT_MODULES_PUT", err);
  }
}
