export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Prospect from "@/models/Prospect";
import User from "@/models/User";
import Client from "@/models/Client";
import Settings from "@/models/Settings";
import Notification from "@/models/Notification";
import AssignmentLog from "@/models/AssignmentLog";
import { calculateLeadScore } from "@/lib/lead-scoring";
import { assignConsultant } from "@/lib/assignment-engine";
import { getGA4Settings, trackServerEvent } from "@/lib/analytics";
import { sendEmail } from "@/lib/sendgrid";
import { newLeadEmail } from "@/lib/email-templates/new-lead";
import { leadAutoResponseEmail } from "@/lib/email-templates/lead-auto-response";

export const runtime = "nodejs";

/* ── Field mapping from Elementor form IDs ────────────────── */
const FIELD_MAP: Record<string, string> = {
  field_business_name: "businessName",
  field_contact_name: "contactName",
  field_email: "contactEmail",
  field_phone: "phone",
  field_website: "website",
  field_company_size: "companySize",
  field_revenue_range: "revenueRange",
  field_challenge: "primaryChallenge",
  field_hear_about: "hearAboutUs",
  field_message: "message",
  field_ga_client_id: "gaClientId",
  field_referrer_url: "referrerUrl",
};

function mapFields(raw: Record<string, unknown>): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    const mappedKey = FIELD_MAP[key] ?? key;
    if (typeof value === "string") mapped[mappedKey] = value;
    else if (value != null) mapped[mappedKey] = String(value);
  }
  return mapped;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Validate webhook secret
    const key = req.nextUrl.searchParams.get("key");
    if (!key || key !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body — handle both JSON and form-encoded
    let rawBody: Record<string, unknown> = {};
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      rawBody = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      for (const [k, v] of params.entries()) {
        rawBody[k] = v;
      }
    } else {
      // Try JSON as fallback
      try {
        rawBody = await req.json();
      } catch {
        return NextResponse.json({ status: "error", message: "Unsupported content type" }, { status: 200 });
      }
    }

    const fields = mapFields(rawBody);

    // 3. Validate required fields
    const businessName = fields.businessName?.trim();
    const contactName = fields.contactName?.trim();
    const contactEmail = fields.contactEmail?.trim().toLowerCase();

    if (!businessName || !contactName || !contactEmail) {
      return NextResponse.json(
        { error: "Missing required fields: businessName, contactName, contactEmail" },
        { status: 400 }
      );
    }

    await connectDB();

    // 4. Check for duplicate (active prospect with same email)
    const existing = await Prospect.findOne({
      contactEmail,
      stage: { $nin: ["won", "lost"] },
    });

    if (existing) {
      // Update existing prospect with new data
      const updateData: Record<string, unknown> = {};
      if (fields.businessName) updateData.businessName = businessName;
      if (fields.contactName) updateData.contactName = contactName;
      if (fields.phone) updateData.phone = fields.phone.trim();
      if (fields.website) updateData.website = fields.website.trim();
      if (fields.companySize) updateData.companySize = fields.companySize;
      if (fields.revenueRange) updateData.revenueRange = fields.revenueRange;
      if (fields.primaryChallenge) updateData.primaryChallenge = fields.primaryChallenge;
      if (fields.hearAboutUs) updateData.hearAboutUs = fields.hearAboutUs;
      if (fields.message) updateData.message = fields.message;

      // Recalculate lead score
      const scoring = calculateLeadScore({
        companySize: fields.companySize ?? existing.companySize,
        revenueRange: fields.revenueRange ?? existing.revenueRange,
        primaryChallenge: fields.primaryChallenge ?? existing.primaryChallenge,
        message: fields.message ?? existing.message,
        phone: fields.phone ?? existing.phone,
        website: fields.website ?? existing.website,
        hearAboutUs: fields.hearAboutUs ?? existing.hearAboutUs,
      });
      updateData.leadScore = scoring.total;
      updateData.leadScoreBreakdown = scoring.breakdown;

      await Prospect.findByIdAndUpdate(existing._id, updateData);

      return NextResponse.json(
        { status: "updated", prospectId: String(existing._id) },
        { status: 200 }
      );
    }

    // 5. Calculate lead score
    const scoring = calculateLeadScore({
      companySize: fields.companySize,
      revenueRange: fields.revenueRange,
      primaryChallenge: fields.primaryChallenge,
      message: fields.message,
      phone: fields.phone,
      website: fields.website,
      hearAboutUs: fields.hearAboutUs,
    });

    // 6. Create Prospect document
    const prospect = await Prospect.create({
      businessName,
      contactName,
      contactEmail,
      phone: fields.phone?.trim(),
      website: fields.website?.trim(),
      companySize: fields.companySize,
      revenueRange: fields.revenueRange,
      primaryChallenge: fields.primaryChallenge,
      hearAboutUs: fields.hearAboutUs,
      message: fields.message,
      stage: "mql",
      source: "web_form",
      leadScore: scoring.total,
      leadScoreBreakdown: scoring.breakdown,
      gaClientId: fields.gaClientId,
      referrerUrl: fields.referrerUrl,
    });

    const prospectId = String(prospect._id);
    const portalUrl = `${process.env.NEXTAUTH_URL}/admin/crm/prospects/${prospectId}`;

    // 6b. Fire GA4 generate_lead event (non-blocking)
    void (async () => {
      const config = await getGA4Settings();
      if (!config || !config.trackedEvents.leadReceived) return;
      if (!prospect.gaClientId) return;
      await trackServerEvent({
        measurementId: config.measurementId,
        apiSecret: config.apiSecret,
        clientId: prospect.gaClientId,
        eventName: "generate_lead",
        params: {
          business_name: prospect.businessName,
          lead_score: prospect.leadScore,
          primary_challenge: prospect.primaryChallenge ?? "",
          company_size: prospect.companySize ?? "",
          source: "web_form",
        },
      });
    })();

    // 7. Notify admins — create Notification for each admin
    const admins = await User.find({ role: "admin" }).select("_id email").lean();
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

    // 8. Send admin notification email
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
          phone: fields.phone,
          companySize: fields.companySize,
          revenueRange: fields.revenueRange,
          primaryChallenge: fields.primaryChallenge,
          message: fields.message,
          leadScore: scoring.total,
          portalUrl,
        }),
      });
    } catch (emailErr) {
      console.error("[WEBHOOK/LEAD] Failed to send admin notification email:", emailErr);
    }

    // 9. Send auto-response to prospect
    try {
      const replyTo =
        (settings?.autoResponseReplyTo as string) ??
        process.env.SENDGRID_FROM_EMAIL!;
      const calendlyUrl = (settings?.calendlyUrl as string) || undefined;

      await sendEmail({
        to: contactEmail,
        subject: `Thanks for getting in touch, ${contactName}`,
        html: leadAutoResponseEmail({
          contactName,
          businessName,
          calendlyUrl,
          replyToEmail: replyTo,
        }),
      });

      await Prospect.findByIdAndUpdate(prospect._id, {
        autoResponseSentAt: new Date(),
      });
    } catch (emailErr) {
      console.error("[WEBHOOK/LEAD] Failed to send auto-response email:", emailErr);
    }

    // 10. Auto-assign consultant if enabled
    if (settings?.autoAssignEnabled) {
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
          // Notify admins about failed assignment
          if (admins.length > 0) {
            await Notification.insertMany(
              admins.map((admin) => ({
                userId: (admin as { _id: unknown })._id,
                type: "warning",
                title: "Auto-assignment failed",
                message: `${businessName} could not be assigned — ${result.reason}`,
                link: `/admin/crm/prospects/${prospectId}`,
              }))
            );
          }
        }

        // Log the assignment decision
        await AssignmentLog.create({
          prospectId: prospect._id,
          assignedTo: result.consultantId || undefined,
          assignedToName: result.consultantName || undefined,
          reason: result.reason,
          skipped: result.skipped,
          autoAssigned: true,
        });
      } catch (assignErr) {
        console.error("[WEBHOOK/LEAD] Auto-assignment error:", assignErr);
      }
    }

    return NextResponse.json(
      { status: "created", prospectId },
      { status: 201 }
    );
  } catch (error) {
    // Return 200 on all errors — Elementor retries on non-200
    console.error("[WEBHOOK/LEAD] Unexpected error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal error" },
      { status: 200 }
    );
  }
}
