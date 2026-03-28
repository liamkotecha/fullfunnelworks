export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Client from "@/models/Client";
import { sendEmail } from "@/lib/sendgrid";
import { blockRaisedEmail } from "@/lib/email-templates/block-raised";
import User from "@/models/User";
import { formatDateTime } from "@/lib/utils";
import { requireAuth } from "@/lib/api-helpers";

const createSchema = z.object({
  clientId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  package: z.string().default(""),
  assignedTo: z.string().optional(),
  dueDate: z.string().optional(),
  milestones: z.array(z.object({ title: z.string(), dueDate: z.string().optional() })).optional(),
  activeModules: z.array(z.string()).optional().default(["assessment"]),
  projectPrincipal: z.object({ name: z.string(), email: z.string(), role: z.string().optional() }).optional(),
});

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "completed"]).optional(),
  package: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  projectPrincipal: z.object({ name: z.string(), email: z.string(), role: z.string().optional() }).optional().nullable(),
});

const blockSchema = z.object({
  action: z.enum(["raise", "resolve"]),
  blockId: z.string().optional(),
  reason: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const clientId = searchParams.get("clientId");

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (clientId) filter.clientId = clientId;

    // Consultants can only see projects belonging to their clients
    if (userOrRes.role === "consultant") {
      const clientIds = await Client.find({ assignedConsultant: userOrRes.id })
        .distinct("_id");
      filter.clientId = clientId ? clientId : { $in: clientIds };
    }

    // Admins can filter by a specific consultant's clients (used on consultant detail page)
    const assignedConsultantParam = searchParams.get("assignedConsultant");
    if (userOrRes.role === "admin" && assignedConsultantParam && !clientId) {
      const clientIds = await Client.find({ assignedConsultant: assignedConsultantParam })
        .distinct("_id");
      filter.clientId = { $in: clientIds };
    }

    const projects = await Project.find(filter)
      .populate("clientId", "businessName")
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ data: (projects as Array<{ _id: unknown; [k: string]: unknown }>).map((p) => ({ ...p, id: String(p._id) })) }, { status: 200 });
  } catch (error) {
    console.error("[PROJECTS GET]", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();

    // Handle block operations
    if (body.action === "raise" || body.action === "resolve") {
      const { action, blockId, reason } = blockSchema.parse(body);
      const projectId = body.projectId;
      await connectDB();
      const project = await Project.findById(projectId).populate("assignedTo").populate("clientId");

      if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

      if (action === "raise" && reason) {
        project.blocks.push({ reason, raisedAt: new Date() });
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
                blockReason: reason,
                raisedAt: formatDateTime(new Date()),
                portalUrl: `${process.env.NEXTAUTH_URL}/portal/projects/${project._id}`,
              }),
            });
          }
        }
      } else if (action === "resolve" && blockId) {
        const block = project.blocks.id(blockId);
        if (block) block.resolvedAt = new Date();
        const hasActiveBlocks = project.blocks.some((b: { resolvedAt?: Date }) => !b.resolvedAt);
        if (!hasActiveBlocks) project.status = "in_progress";
        await project.save();
      }

      return NextResponse.json({ data: project }, { status: 200 });
    }

    const data = createSchema.parse(body);
    await connectDB();

    // Consultants may only create projects for their own clients
    if (userOrRes.role === "consultant") {
      const client = await Client.findById(data.clientId).select("assignedConsultant").lean() as Record<string, unknown> | null;
      if (!client || String(client.assignedConsultant) !== userOrRes.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const project = await Project.create({
      ...data,
      milestones: data.milestones ?? [],
      activeModules: data.activeModules ?? ["assessment"],
    });

    // Update client status to onboarding if needed
    if (data.clientId) {
      await Client.findByIdAndUpdate(data.clientId, { $set: { status: "onboarding" } });
    }

    return NextResponse.json({ data: project }, { status: 201 });
  } catch (error) {
    console.error("[PROJECTS POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: "Project ID required" }, { status: 400 });

    const data = updateSchema.parse(updateData);
    await connectDB();

    const project = await Project.findByIdAndUpdate(id, data, { new: true }).lean();
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    return NextResponse.json({ data: project }, { status: 200 });
  } catch (error) {
    console.error("[PROJECTS PATCH]", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}
