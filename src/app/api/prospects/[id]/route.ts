import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prospect from "@/models/Prospect";
import User from "@/models/User";
import AssignmentLog from "@/models/AssignmentLog";
import { requireAuth, apiError } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { getGA4Settings, trackServerEvent } from "@/lib/analytics";
import type { ProspectDTO, ProspectStage } from "@/types";

/* ── Helper: Prospect document → DTO ──────────────────────── */
function toProspectDTO(doc: Record<string, unknown>): ProspectDTO {
  const createdAt = doc.createdAt as Date | string;
  const updatedAt = doc.updatedAt as Date | string;

  // Calculate daysInStage from stageEnteredAt map if available
  const stageEnteredAtMap = doc.stageEnteredAt as Map<string, Date> | Record<string, string | Date> | undefined;
  const currentStage = doc.stage as string;
  let enteredAt: Date | null = null;
  if (stageEnteredAtMap) {
    if (stageEnteredAtMap instanceof Map) {
      const v = stageEnteredAtMap.get(currentStage);
      if (v) enteredAt = new Date(v);
    } else if (typeof stageEnteredAtMap === "object") {
      const v = (stageEnteredAtMap as Record<string, string | Date>)[currentStage];
      if (v) enteredAt = new Date(v);
    }
  }
  if (!enteredAt) enteredAt = new Date(createdAt as string);
  const daysInStage = Math.max(
    0,
    Math.floor((Date.now() - enteredAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  const dealValue = doc.dealValue as number | undefined;
  const dealValueFormatted = dealValue
    ? `£${(dealValue / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
    : undefined;

  const consultant = doc.assignedConsultant as Record<string, unknown> | null;
  const assignedConsultant = consultant
    ? {
        id: String(consultant._id),
        name: String(consultant.name ?? ""),
        email: String(consultant.email ?? ""),
      }
    : null;

  // Map activityLog
  const rawLog = (doc.activityLog ?? []) as Record<string, unknown>[];
  const activityLog = rawLog.map((e) => {
    const cb = e.createdBy as Record<string, unknown> | null;
    return {
      _id: String(e._id),
      type: e.type as "stage_change" | "note" | "assignment" | "system",
      message: String(e.message ?? ""),
      createdBy: cb ? { _id: String(cb._id), name: String(cb.name ?? "") } : null,
      createdAt: new Date(e.createdAt as string).toISOString(),
    };
  });

  // Map tasks
  const rawTasks = (doc.tasks ?? []) as Record<string, unknown>[];
  const tasks = rawTasks.map((t) => {
    const at = t.assignedTo as Record<string, unknown> | null;
    return {
      _id: String(t._id),
      title: String(t.title ?? ""),
      dueDate: t.dueDate ? new Date(t.dueDate as string).toISOString() : null,
      assignedTo: at ? { _id: String(at._id), name: String(at.name ?? "") } : null,
      completedAt: t.completedAt ? new Date(t.completedAt as string).toISOString() : null,
      createdAt: new Date(t.createdAt as string).toISOString(),
    };
  });

  // Map stageEnteredAt
  let stageEnteredAtDTO: Record<string, string> | undefined;
  if (stageEnteredAtMap) {
    stageEnteredAtDTO = {};
    if (stageEnteredAtMap instanceof Map) {
      stageEnteredAtMap.forEach((v, k) => { stageEnteredAtDTO![k] = new Date(v).toISOString(); });
    } else if (typeof stageEnteredAtMap === "object") {
      for (const [k, v] of Object.entries(stageEnteredAtMap as Record<string, string | Date>)) {
        stageEnteredAtDTO[k] = new Date(v).toISOString();
      }
    }
  }

  return {
    id: String(doc._id),
    businessName: String(doc.businessName ?? ""),
    contactName: String(doc.contactName ?? ""),
    contactEmail: String(doc.contactEmail ?? ""),
    phone: doc.phone as string | undefined,
    website: doc.website as string | undefined,
    companySize: doc.companySize as string | undefined,
    revenueRange: doc.revenueRange as string | undefined,
    primaryChallenge: doc.primaryChallenge as string | undefined,
    hearAboutUs: doc.hearAboutUs as string | undefined,
    message: doc.message as string | undefined,
    stage: doc.stage as ProspectDTO["stage"],
    dealValue,
    dealValueFormatted,
    lostReason: doc.lostReason as string | undefined,
    assignedConsultant,
    leadScore: (doc.leadScore as number) ?? 0,
    leadScoreBreakdown: (doc.leadScoreBreakdown as ProspectDTO["leadScoreBreakdown"]) ?? {
      companySizeScore: 0,
      revenueScore: 0,
      challengeScore: 0,
      completenessScore: 0,
      total: 0,
    },
    source: (doc.source as ProspectDTO["source"]) ?? "web_form",
    gaClientId: doc.gaClientId as string | undefined,
    qualifiedAt: doc.qualifiedAt ? new Date(doc.qualifiedAt as string).toISOString() : null,
    proposalSentAt: doc.proposalSentAt ? new Date(doc.proposalSentAt as string).toISOString() : null,
    wonAt: doc.wonAt ? new Date(doc.wonAt as string).toISOString() : null,
    convertedAt: doc.convertedAt ? new Date(doc.convertedAt as string).toISOString() : null,
    clientId: doc.clientId ? String(doc.clientId) : null,
    notes: doc.notes as string | undefined,
    createdAt: new Date(createdAt as string).toISOString(),
    updatedAt: new Date(updatedAt as string).toISOString(),
    daysInStage,
    activityLog,
    tasks,
    stageEnteredAt: stageEnteredAtDTO,
  };
}

/* ── Lifecycle timestamp mapping ──────────────────────────── */
const STAGE_TIMESTAMP_MAP: Partial<Record<ProspectStage, string>> = {
  sql: "qualifiedAt",
  discovery: "discoveryAt",
  proposal: "proposalSentAt",
  won: "wonAt",
  lost: "lostAt",
};

type Params = { params: Promise<{ id: string }> };

/* ── GET /api/prospects/[id] ──────────────────────────────── */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const prospect = await Prospect.findById(id)
      .populate("assignedConsultant", "name email")
      .populate("activityLog.createdBy", "name")
      .populate("tasks.assignedTo", "name")
      .lean();

    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    return NextResponse.json({ data: toProspectDTO(prospect as Record<string, unknown>) });
  } catch (error) {
    return apiError("PROSPECT GET", error);
  }
}

/* ── PATCH /api/prospects/[id] ────────────────────────────── */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    await connectDB();

    const prospect = await Prospect.findById(id);
    if (!prospect) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    // Stage change validation
    if (body.stage === "lost" && !body.lostReason) {
      return NextResponse.json(
        { error: "lostReason is required when stage is 'lost'" },
        { status: 400 }
      );
    }

    /* ── Handle addNote action ─────────────────────────── */
    if (body.addNote && typeof body.addNote === "string") {
      const noteText = body.addNote.trim();
      if (noteText) {
        prospect.activityLog.push({
          type: "note",
          message: `Note: ${noteText.length > 60 ? noteText.slice(0, 60) + "…" : noteText}`,
          createdBy: user.id as unknown as import("mongoose").Types.ObjectId,
          createdAt: new Date(),
        } as import("mongoose").Document & { type: string; message: string; createdBy: import("mongoose").Types.ObjectId; createdAt: Date });
        // Append to notes field with timestamp
        const ts = new Date().toISOString().slice(0, 16).replace("T", " ");
        prospect.notes = prospect.notes
          ? `${prospect.notes}\n\n--- ${ts} ---\n${noteText}`
          : noteText;
        await prospect.save();
        const full = await Prospect.findById(id)
          .populate("assignedConsultant", "name email")
          .populate("activityLog.createdBy", "name")
          .populate("tasks.assignedTo", "name")
          .lean();
        return NextResponse.json({ data: toProspectDTO(full as Record<string, unknown>) });
      }
    }

    /* ── Handle addTask action ─────────────────────────── */
    if (body.addTask && typeof body.addTask === "object") {
      const { title, dueDate, assignedTo } = body.addTask as { title?: string; dueDate?: string; assignedTo?: string };
      if (!title?.trim()) {
        return NextResponse.json({ error: "Task title is required" }, { status: 400 });
      }
      prospect.tasks.push({
        title: title.trim(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignedTo: assignedTo ? (assignedTo as unknown as import("mongoose").Types.ObjectId) : undefined,
        createdAt: new Date(),
      } as import("mongoose").Document & { title: string; dueDate?: Date; assignedTo?: import("mongoose").Types.ObjectId; createdAt: Date });
      prospect.activityLog.push({
        type: "system",
        message: `Task added: ${title.trim()}`,
        createdBy: user.id as unknown as import("mongoose").Types.ObjectId,
        createdAt: new Date(),
      } as import("mongoose").Document & { type: string; message: string; createdBy: import("mongoose").Types.ObjectId; createdAt: Date });
      await prospect.save();
      const full = await Prospect.findById(id)
        .populate("assignedConsultant", "name email")
        .populate("activityLog.createdBy", "name")
        .populate("tasks.assignedTo", "name")
        .lean();
      return NextResponse.json({ data: toProspectDTO(full as Record<string, unknown>) });
    }

    /* ── Handle completeTask action ────────────────────── */
    if (body.completeTask && typeof body.completeTask === "string") {
      const task = prospect.tasks.id(body.completeTask);
      if (!task) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      task.completedAt = new Date();
      prospect.activityLog.push({
        type: "system",
        message: `Task completed: ${task.title}`,
        createdBy: user.id as unknown as import("mongoose").Types.ObjectId,
        createdAt: new Date(),
      } as import("mongoose").Document & { type: string; message: string; createdBy: import("mongoose").Types.ObjectId; createdAt: Date });
      await prospect.save();
      const full = await Prospect.findById(id)
        .populate("assignedConsultant", "name email")
        .populate("activityLog.createdBy", "name")
        .populate("tasks.assignedTo", "name")
        .lean();
      return NextResponse.json({ data: toProspectDTO(full as Record<string, unknown>) });
    }

    // Build update
    const update: Record<string, unknown> = {};
    const pushOps: Record<string, unknown>[] = [];

    // Simple fields
    const allowedFields = [
      "stage",
      "assignedConsultant",
      "dealValue",
      "notes",
      "lostReason",
      "businessName",
      "contactName",
      "contactEmail",
      "phone",
      "website",
      "companySize",
      "revenueRange",
      "primaryChallenge",
      "hearAboutUs",
      "message",
    ];

    for (const key of allowedFields) {
      if (key in body) update[key] = body[key];
    }

    // Handle null assignedConsultant (unassign)
    if (body.assignedConsultant === null) {
      update.assignedConsultant = null;
    }

    // Set lifecycle timestamp when stage changes
    if (body.stage && body.stage !== prospect.stage) {
      const tsField = STAGE_TIMESTAMP_MAP[body.stage as ProspectStage];
      if (tsField) {
        update[tsField] = new Date();
      }
      // Auto-log stage change
      pushOps.push({
        type: "stage_change",
        message: `Stage moved: ${prospect.stage} → ${body.stage}`,
        createdBy: user.id,
        createdAt: new Date(),
      });
      // Update stageEnteredAt map
      update[`stageEnteredAt.${body.stage}`] = new Date();
    }

    // Auto-log assignment change
    if (body.assignedConsultant && body.assignedConsultant !== String(prospect.assignedConsultant)) {
      const assignee = await User.findById(body.assignedConsultant).select("name").lean() as { name?: string } | null;
      pushOps.push({
        type: "assignment",
        message: `Assigned to ${assignee?.name ?? "consultant"}`,
        createdBy: user.id,
        createdAt: new Date(),
      });
      // Log manual assignment
      try {
        await AssignmentLog.create({
          prospectId: prospect._id,
          assignedTo: body.assignedConsultant,
          assignedToName: assignee?.name ?? "Unknown",
          reason: "Manual assignment",
          skipped: [],
          autoAssigned: false,
        });
      } catch (logErr) {
        console.error("[PROSPECT PATCH] Assignment log error:", logErr);
      }
    }

    // Recalculate lead score if qualification fields changed
    const scoringFields = [
      "companySize",
      "revenueRange",
      "primaryChallenge",
      "message",
      "phone",
      "website",
      "hearAboutUs",
    ];
    const hasScoreChange = scoringFields.some((f) => f in body);
    if (hasScoreChange) {
      const scoring = calculateLeadScore({
        companySize: body.companySize ?? prospect.companySize,
        revenueRange: body.revenueRange ?? prospect.revenueRange,
        primaryChallenge: body.primaryChallenge ?? prospect.primaryChallenge,
        message: body.message ?? prospect.message,
        phone: body.phone ?? prospect.phone,
        website: body.website ?? prospect.website,
        hearAboutUs: body.hearAboutUs ?? prospect.hearAboutUs,
      });
      update.leadScore = scoring.total;
      update.leadScoreBreakdown = scoring.breakdown;
    }

    // Build the final update with $push for activity log
    const mongoUpdate: Record<string, unknown> = { $set: update };
    if (pushOps.length > 0) {
      mongoUpdate.$push = { activityLog: { $each: pushOps } };
    }

    const updated = await Prospect.findByIdAndUpdate(id, mongoUpdate, { new: true })
      .populate("assignedConsultant", "name email")
      .populate("activityLog.createdBy", "name")
      .populate("tasks.assignedTo", "name")
      .lean();

    // Fire GA4 server events for pipeline stage changes (non-blocking)
    if (body.stage && body.stage !== prospect.stage && prospect.gaClientId) {
      const stageEventMap: Record<string, { event: string; toggle: string }> = {
        sql: { event: "lead_qualified", toggle: "leadQualified" },
        proposal: { event: "proposal_sent", toggle: "proposalSent" },
        won: { event: "deal_won", toggle: "dealWon" },
        lost: { event: "deal_lost", toggle: "dealLost" },
      };
      const mapping = stageEventMap[body.stage as string];
      if (mapping) {
        void (async () => {
          const config = await getGA4Settings();
          if (!config || !config.trackedEvents[mapping.toggle as keyof typeof config.trackedEvents]) return;
          await trackServerEvent({
            measurementId: config.measurementId,
            apiSecret: config.apiSecret,
            clientId: prospect.gaClientId!,
            eventName: mapping.event,
            params: {
              business_name: prospect.businessName,
              lead_score: prospect.leadScore,
              from_stage: prospect.stage,
              to_stage: body.stage,
              ...(body.stage === "won" && body.dealValue ? { value: body.dealValue / 100, currency: "GBP" } : {}),
              ...(body.stage === "lost" && body.lostReason ? { lost_reason: body.lostReason } : {}),
            },
          });
        })();
      }
    }

    return NextResponse.json({ data: toProspectDTO(updated as Record<string, unknown>) });
  } catch (error) {
    return apiError("PROSPECT PATCH", error);
  }
}

/* ── DELETE /api/prospects/[id] ───────────────────────────── */
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectDB();

    const deleted = await Prospect.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ error: "Prospect not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Prospect deleted" });
  } catch (error) {
    return apiError("PROSPECT DELETE", error);
  }
}
