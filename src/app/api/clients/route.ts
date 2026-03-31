export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import Client from "@/models/Client";
import User from "@/models/User";
import IntakeResponse from "@/models/IntakeResponse";
import Project from "@/models/Project";
import { sendEmail } from "@/lib/sendgrid";
import { onboardingInviteEmail } from "@/lib/email-templates/onboarding-invite";
import { getAllFieldIds, calculateProgress } from "@/lib/framework-nav";
import { requireAuth, consultantFilter, assertConsultantOwnsClient } from "@/lib/api-helpers";
import type { IIntakeResponse } from "@/models/IntakeResponse";

const createSchema = z.object({
  businessName: z.string().min(1),
  email: z.string().email(),
  name: z.string().optional(),
  assignedConsultant: z.string().optional(),
});

interface PopulatedClient {
  _id: unknown;
  [key: string]: unknown;
}

interface LeanIntakeResponse {
  clientId: unknown;
  responses?: Record<string, unknown> | Map<string, unknown>;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    await connectDB();

    const { searchParams } = new URL(req.url);
    const assignedConsultantParam = searchParams.get("assignedConsultant");

    let filter = await consultantFilter(userOrRes);

    // Admin viewing a specific consultant's clients (consultant detail page)
    if (userOrRes.role === "admin" && assignedConsultantParam && !Object.keys(filter).length) {
      filter = { assignedConsultant: assignedConsultantParam };
    }

    const clients = await Client.find(filter)
      .populate("userId", "email name")
      .populate("assignedConsultant", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Batch-fetch intake responses and compute overallProgress per client
    const clientIds = (clients as PopulatedClient[]).map((c) => c._id);
    const intakeResponses = await IntakeResponse.find({ clientId: { $in: clientIds } }).lean() as unknown as LeanIntakeResponse[];

    const responseMap = new Map<string, LeanIntakeResponse>();
    const migratedClientIds = new Set<string>();
    for (const r of intakeResponses) {
      responseMap.set(String(r.clientId), r);
      if ((r as Record<string, unknown>).migratedAt) migratedClientIds.add(String(r.clientId));
    }

    const allFieldIds = getAllFieldIds();

    // For migrated clients, derive progress from canonical Response count via EngagementSession
    const sessionProgressMap = new Map<string, number>(); // clientId → percent
    if (migratedClientIds.size > 0) {
      const { default: EngagementSession } = await import("@/models/EngagementSession");
      const { default: SessionResponse } = await import("@/models/Response");

      const projects = await Project.find({ clientId: { $in: [...migratedClientIds] } })
        .select("_id clientId")
        .lean() as unknown as Array<{ _id: unknown; clientId: unknown }>;

      const projectToClient = new Map<string, string>(); // projectId → clientId
      for (const p of projects) projectToClient.set(String(p._id), String(p.clientId));
      const projectIds = projects.map((p) => p._id);

      // Canonical session per project (non-synthesised, most recent)
      const sessions = await EngagementSession.find({
        projectId: { $in: projectIds },
        status: { $ne: "synthesised" },
      }).sort({ createdAt: -1 }).lean() as unknown as Array<{ _id: unknown; projectId: unknown }>;

      const sessionByProject = new Map<string, typeof sessions[number]>();
      for (const s of sessions) {
        const pid = String(s.projectId);
        if (!sessionByProject.has(pid)) sessionByProject.set(pid, s);
      }

      const sessionIds = [...sessionByProject.values()].map((s) => s._id);
      const counts = await SessionResponse.aggregate([
        { $match: { sessionId: { $in: sessionIds }, participantId: null } },
        { $group: { _id: "$sessionId", count: { $sum: 1 } } },
      ]) as Array<{ _id: unknown; count: number }>;

      const countBySession = new Map<string, number>();
      for (const c of counts) countBySession.set(String(c._id), c.count);

      const totalFields = allFieldIds.length;
      for (const p of projects) {
        const session = sessionByProject.get(String(p._id));
        if (!session) continue;
        const count = countBySession.get(String(session._id)) ?? 0;
        const clientIdStr = projectToClient.get(String(p._id))!;
        sessionProgressMap.set(clientIdStr, totalFields > 0 ? Math.round((count / totalFields) * 100) : 0);
      }
    }

    const clientsWithProgress = (clients as PopulatedClient[]).map((client) => {
      const cid = String(client._id);
      let overallProgress = 0;
      if (migratedClientIds.has(cid)) {
        overallProgress = sessionProgressMap.get(cid) ?? 0;
      } else {
        const intake = responseMap.get(cid);
        overallProgress = intake
          ? calculateProgress(allFieldIds, (intake.responses ?? {}) as Record<string, unknown>).percent
          : 0;
      }
      return { ...client, id: cid, overallProgress };
    });

    return NextResponse.json({ data: clientsWithProgress }, { status: 200 });
  } catch (error) {
    console.error("[CLIENTS GET]", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;

    const body = await req.json();
    const { businessName, email, name, assignedConsultant } = createSchema.parse(body);
    const resolvedName = name || businessName;

    await connectDB();

    // Create or find user
    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = await User.create({ email: email.toLowerCase(), name: resolvedName, role: "client" });
    }

    // Consultant creating a client always owns them; admin can optionally specify
    const resolvedConsultant =
      userOrRes.role === "consultant"
        ? userOrRes.id
        : (assignedConsultant || undefined);

    // Create client record
    const client = await Client.create({
      userId: user._id,
      businessName,
      status: "invited",
      assignedConsultant: resolvedConsultant,
    });

    // Send invite email
    const portalUrl = `${process.env.NEXTAUTH_URL}/login`;
    await sendEmail({
      to: email,
      subject: `Welcome to Full Funnel — ${businessName}`,
      html: onboardingInviteEmail({
        clientName: resolvedName,
        portalUrl,
        firmName: process.env.SENDGRID_FROM_NAME,
      }),
    });

    return NextResponse.json({ data: client }, { status: 201 });
  } catch (error) {
    console.error("[CLIENTS POST]", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
