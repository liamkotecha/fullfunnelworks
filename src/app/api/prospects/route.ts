export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prospect from "@/models/Prospect";
import User from "@/models/User";
import Client from "@/models/Client";
import Notification from "@/models/Notification";
import Settings from "@/models/Settings";
import AssignmentLog from "@/models/AssignmentLog";
import { requireAuth, apiError, escapeRegex } from "@/lib/api-helpers";
import type { AuthenticatedUser } from "@/lib/api-helpers";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { assignConsultant } from "@/lib/assignment-engine";
import { sendEmail } from "@/lib/sendgrid";
import { newLeadEmail } from "@/lib/email-templates/new-lead";
import type { ProspectDTO } from "@/types";

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

  // Format deal value
  const dealValue = doc.dealValue as number | undefined;
  const dealValueFormatted = dealValue
    ? `£${(dealValue / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}`
    : undefined;

  // Format assigned consultant
  const consultant = doc.assignedConsultant as Record<string, unknown> | null;
  const assignedConsultant = consultant
    ? {
        id: String(consultant._id),
        name: String(consultant.name ?? ""),
        email: String(consultant.email ?? ""),
      }
    : null;

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
    stageEnteredAt: stageEnteredAtDTO,
  };
}

/* ── GET /api/prospects ───────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);

    const filter: Record<string, unknown> = {};

    // Stage filter (comma-separated)
    const stageParam = searchParams.get("stage");
    if (stageParam) {
      const stages = stageParam.split(",").map((s) => s.trim());
      filter.stage = { $in: stages };
    }

    // Assigned consultant filter
    const assignedTo = searchParams.get("assignedTo");
    if (assignedTo) filter.assignedConsultant = assignedTo;

    // Search filter
    const search = searchParams.get("search");
    if (search) {
      const escaped = escapeRegex(search);
      filter.$or = [
        { businessName: { $regex: escaped, $options: "i" } },
        { contactName: { $regex: escaped, $options: "i" } },
        { contactEmail: { $regex: escaped, $options: "i" } },
      ];
    }

    // Min score filter
    const minScore = searchParams.get("minScore");
    if (minScore) {
      filter.leadScore = { $gte: Number(minScore) };
    }

    // Source filter
    const source = searchParams.get("source");
    if (source) filter.source = source;

    const prospects = await Prospect.find(filter)
      .populate("assignedConsultant", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      data: (prospects as Record<string, unknown>[]).map(toProspectDTO),
      total: prospects.length,
    });
  } catch (error) {
    return apiError("PROSPECTS GET", error);
  }
}

/* ── POST /api/prospects ──────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes as AuthenticatedUser;
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Validate required fields
    const businessName = body.businessName?.trim();
    const contactName = body.contactName?.trim();
    const contactEmail = body.contactEmail?.trim().toLowerCase();

    if (!businessName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: businessName, contactName, contactEmail" },
        { status: 400 }
      );
    }

    await connectDB();

    // Calculate lead score
    const scoring = calculateLeadScore({
      companySize: body.companySize,
      revenueRange: body.revenueRange,
      primaryChallenge: body.primaryChallenge,
      message: body.message,
      phone: body.phone,
      website: body.website,
      hearAboutUs: body.hearAboutUs,
    });

    // Create prospect
    const prospect = await Prospect.create({
      businessName,
      contactName,
      contactEmail,
      phone: body.phone?.trim(),
      website: body.website?.trim(),
      companySize: body.companySize,
      revenueRange: body.revenueRange,
      primaryChallenge: body.primaryChallenge,
      hearAboutUs: body.hearAboutUs,
      message: body.message,
      stage: "mql",
      source: body.source ?? "manual",
      leadScore: scoring.total,
      leadScoreBreakdown: scoring.breakdown,
      assignedConsultant: body.assignedConsultant || undefined,
      dealValue: body.dealValue,
      activityLog: [
        { type: "system", message: `Lead received via ${body.source ?? "manual"}`, createdBy: user.id, createdAt: new Date() },
        { type: "system", message: `Lead score: ${scoring.total}/100`, createdBy: null, createdAt: new Date() },
      ],
    });

    const prospectId = String(prospect._id);
    const portalUrl = `${process.env.NEXTAUTH_URL}/admin/crm/prospects/${prospectId}`;

    // Notify admins (same as webhook but NO auto-response email)
    const admins = await User.find({ role: "admin" }).select("_id").lean();
    if (admins.length > 0) {
      await Notification.insertMany(
        admins.map((admin) => ({
          userId: (admin as { _id: unknown })._id,
          type: "info",
          title: "New lead received",
          message: `${businessName} — ${contactName} (Score: ${scoring.total})`,
          link: `/admin/crm/prospects/${prospectId}`,
        }))
      );
    }

    // Send admin notification email
    const settings = await Settings.findOne().lean() as Record<string, unknown> | null;
    const notificationEmail =
      (settings?.leadNotificationEmail as string) ??
      process.env.LEAD_NOTIFICATION_EMAIL ??
      process.env.SENDGRID_FROM_EMAIL!;

    try {
      await sendEmail({
        to: notificationEmail,
        subject: `🎯 New lead: ${businessName} (Score: ${scoring.total}/100)`,
        html: newLeadEmail({
          businessName,
          contactName,
          contactEmail,
          phone: body.phone,
          companySize: body.companySize,
          revenueRange: body.revenueRange,
          primaryChallenge: body.primaryChallenge,
          message: body.message,
          leadScore: scoring.total,
          portalUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[PROSPECTS POST] Failed to send notification email:", emailErr);
    }

    // Auto-assign if enabled and no consultant was specified
    if (!body.assignedConsultant) {
      const settingsDoc = settings as Record<string, unknown> | null;
      if (settingsDoc?.autoAssignEnabled) {
        try {
          const consultants = await User.find({ role: "consultant" });
          const counts = await Client.aggregate([
            { $match: { assignedConsultant: { $in: consultants.map((c) => c._id) }, status: { $in: ["onboarding", "active"] } } },
            { $group: { _id: "$assignedConsultant", count: { $sum: 1 } } },
          ]);
          const countMap = new Map<string, number>(counts.map((c: { _id: unknown; count: number }) => [String(c._id), c.count]));

          const result = await assignConsultant(prospect, countMap);

          if (result.consultantId) {
            await Prospect.findByIdAndUpdate(prospect._id, {
              assignedConsultant: result.consultantId,
              $push: {
                activityLog: {
                  type: "assignment",
                  message: `Auto-assigned to ${result.consultantName} — ${result.reason}`,
                  createdBy: user.id,
                  createdAt: new Date(),
                },
              },
            });
          } else {
            await Prospect.findByIdAndUpdate(prospect._id, {
              $push: {
                activityLog: {
                  type: "system",
                  message: `Auto-assignment failed — ${result.reason}. Requires manual assignment.`,
                  createdAt: new Date(),
                },
              },
            });
          }

          await AssignmentLog.create({
            prospectId: prospect._id,
            assignedTo: result.consultantId || undefined,
            assignedToName: result.consultantName || undefined,
            reason: result.reason,
            skipped: result.skipped,
            autoAssigned: true,
          });
        } catch (assignErr) {
          console.error("[PROSPECTS POST] Auto-assignment error:", assignErr);
        }
      }
    }

    // Fetch full prospect with populated consultant
    const full = await Prospect.findById(prospect._id)
      .populate("assignedConsultant", "name email")
      .lean();

    return NextResponse.json(
      { data: toProspectDTO(full as Record<string, unknown>) },
      { status: 201 }
    );
  } catch (error) {
    return apiError("PROSPECTS POST", error);
  }
}
