export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import User from "@/models/User";
import Client from "@/models/Client";
import { sendEmail } from "@/lib/sendgrid";
import { blockRaisedEmail } from "@/lib/email-templates/block-raised";
import { formatDateTime } from "@/lib/utils";
import { requireAuth } from "@/lib/api-helpers";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "completed"]).optional(),
  package: z.string().optional(),
  assignedTo: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  // Block actions
  action: z.enum(["raiseBlock", "resolveBlock", "terminate", "reactivate"]).optional(),
  reason: z.string().optional(),
  blockId: z.string().optional(),
  // Milestone
  addMilestone: z.object({
    title: z.string().min(1),
    dueDate: z.string().optional(),
  }).optional(),
  completeMilestone: z.number().optional(),
}).passthrough();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const project = await Project.findById(params.id)
      .populate("clientId", "businessName assignedConsultant")
      .populate("assignedTo", "name email")
      .lean();

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Consultants can only access projects belonging to their clients
    if (userOrRes.role === "consultant") {
      const cl = (project as Record<string, unknown>).clientId as Record<string, unknown> | null;
      if (!cl || String(cl.assignedConsultant) !== userOrRes.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ data: { ...(project as Record<string, unknown>), id: String((project as Record<string, unknown>)._id) } });
  } catch (error) {
    console.error("[PROJECT GET]", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const body = patchSchema.parse(await req.json());

    const project = await Project.findById(params.id)
      .populate("assignedTo")
      .populate("clientId");

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    // Consultants can only modify projects belonging to their clients
    if (userOrRes.role === "consultant") {
      const cl = project.clientId as Record<string, unknown> | null;
      if (!cl || String((cl as Record<string, unknown>).assignedConsultant) !== userOrRes.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // ── Raise block ────────────────────────────────────────
    if (body.action === "raiseBlock") {
      if (!body.reason) return NextResponse.json({ error: "reason required" }, { status: 400 });
      project.blocks.push({ reason: body.reason, raisedAt: new Date() });
      project.status = "blocked";
      await project.save();

      // Notify assigned consultant
      if (project.assignedTo) {
        const consultant = await User.findById(project.assignedTo);
        const client = await Client.findById(project.clientId).populate("userId", "name");
        if (consultant) {
          await sendEmail({
            to: consultant.email,
            subject: `🚧 Project Blocked: ${project.title}`,
            html: blockRaisedEmail({
              consultantName: consultant.name,
              clientName: (client?.userId as { name: string })?.name ?? "Unknown",
              projectTitle: project.title,
              blockReason: body.reason,
              raisedAt: formatDateTime(new Date()),
              portalUrl: `${process.env.NEXTAUTH_URL}/portal/projects/${params.id}`,
            }),
          });
        }
      }

      return NextResponse.json({ data: project.toObject() });
    }

    // ── Resolve block ──────────────────────────────────────
    if (body.action === "resolveBlock") {
      const openBlock = project.blocks.find((b: { resolvedAt?: Date }) => !b.resolvedAt);
      if (openBlock) openBlock.resolvedAt = new Date();
      const stillBlocked = project.blocks.some((b: { resolvedAt?: Date }) => !b.resolvedAt);
      if (!stillBlocked) project.status = "in_progress";
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Terminate ──────────────────────────────────────────
    if (body.action === "terminate") {
      if (!body.reason) return NextResponse.json({ error: "reason required" }, { status: 400 });
      project.status = "completed";
      (project as Record<string, unknown>).staleness = "terminated";
      (project as Record<string, unknown>).terminatedAt = new Date();
      (project as Record<string, unknown>).terminatedReason = body.reason;
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Reactivate ─────────────────────────────────────────
    if (body.action === "reactivate") {
      project.status = "in_progress";
      (project as Record<string, unknown>).staleness = "active";
      (project as Record<string, unknown>).terminatedAt = undefined;
      (project as Record<string, unknown>).terminatedReason = undefined;
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Add milestone ──────────────────────────────────────
    if (body.addMilestone) {
      project.milestones.push({
        title: body.addMilestone.title,
        dueDate: body.addMilestone.dueDate ? new Date(body.addMilestone.dueDate) : undefined,
      });
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── Complete milestone ─────────────────────────────────
    if (body.completeMilestone !== undefined) {
      const milestone = project.milestones[body.completeMilestone];
      if (milestone) milestone.completedAt = new Date();
      await project.save();
      return NextResponse.json({ data: project.toObject() });
    }

    // ── General field update ───────────────────────────────
    const allowed = ["title", "description", "status", "package", "assignedTo", "dueDate"] as const;
    for (const key of allowed) {
      if (body[key] !== undefined) {
        (project as Record<string, unknown>)[key] = body[key] ?? null;
      }
    }
    await project.save();

    return NextResponse.json({ data: project.toObject() });
  } catch (error) {
    console.error("[PROJECT PATCH]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const project = await Project.findByIdAndDelete(params.id);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ message: "Project deleted" });
  } catch (error) {
    console.error("[PROJECT DELETE]", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
