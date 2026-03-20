export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Project from "@/models/Project";
import Client from "@/models/Client";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { calculateStaleness } from "@/lib/staleness";
import { sendEmail } from "@/lib/sendgrid";
import { projectStalledEmail } from "@/lib/email-templates/project-stalled";
import { requireAuth } from "@/lib/api-helpers";
import type { StalenessStatus } from "@/lib/staleness";

export async function POST() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    // Admin only
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    // 1. Fetch all projects that aren't terminated or completed
    const projects = await Project.find({
      staleness: { $ne: "terminated" },
      status: { $ne: "completed" },
    })
      .populate("clientId", "businessName contactEmail contactName userId")
      .populate("assignedTo", "name email")
      .lean();

    let updated = 0;
    let notified = 0;

    for (const project of projects) {
      const pId = String(project._id);
      const currentStaleness = (project as Record<string, unknown>).staleness as StalenessStatus;
      const lastActivityAt = (project as Record<string, unknown>).lastActivityAt as Date;

      // 2a. Calculate staleness
      const result = calculateStaleness(
        new Date(lastActivityAt),
        currentStaleness
      );

      // 2b. If computed status differs, update the project
      if (result.status !== currentStaleness) {
        await Project.findByIdAndUpdate(pId, {
          staleness: result.status,
        });
        updated++;

        // 2c. If should notify consultant and this is a stalled/at_risk transition
        if (
          result.shouldNotifyConsultant &&
          (result.status === "stalled" || result.status === "at_risk")
        ) {
          // Check no notification sent in last 24h for this project
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

          const clientDoc = project.clientId as unknown as {
            _id: unknown;
            businessName?: string;
            contactEmail?: string;
            contactName?: string;
          };
          const assignedDoc = project.assignedTo as unknown as {
            _id: unknown;
            name?: string;
            email?: string;
          } | null;

          const clientName = clientDoc?.businessName ?? "Unknown";
          const projectTitle = project.title;

          // Determine notification recipients
          const recipientIds: string[] = [];
          if (assignedDoc?._id) {
            recipientIds.push(String(assignedDoc._id));
          } else {
            // No assignedTo — notify all admins
            const admins = await User.find({ role: "admin" }).select("_id").lean();
            for (const admin of admins) {
              recipientIds.push(String(admin._id));
            }
          }

          for (const recipientId of recipientIds) {
            // Check for recent notification
            const recent = await Notification.findOne({
              userId: recipientId,
              title: { $in: ["Project stalled", "Project at risk"] },
              message: { $regex: projectTitle },
              createdAt: { $gte: oneDayAgo },
            }).lean();

            if (recent) continue;

            // Create in-app notification
            const notifTitle =
              result.status === "at_risk"
                ? "Project at risk"
                : "Project stalled";
            const notifMessage =
              result.status === "at_risk"
                ? `${clientName} — ${projectTitle} has been inactive for ${result.daysSinceActivity} days. Action required.`
                : `${clientName} — ${projectTitle} has been inactive for ${result.daysSinceActivity} days`;

            await Notification.create({
              userId: recipientId,
              type: result.status === "at_risk" ? "error" : "warning",
              title: notifTitle,
              message: notifMessage,
              link: `/admin/projects/${pId}`,
            });

            // Send email to consultant
            const recipientDoc = assignedDoc?._id
              ? assignedDoc
              : await User.findById(recipientId).select("name email").lean();
            const recipientEmail = (recipientDoc as { email?: string })?.email;
            const recipientName = (recipientDoc as { name?: string })?.name;

            if (recipientEmail) {
              try {
                await sendEmail({
                  to: recipientEmail,
                  subject:
                    result.status === "at_risk"
                      ? `⚠️ Project at risk: ${projectTitle}`
                      : `⏸ Project stalled: ${projectTitle}`,
                  html: projectStalledEmail({
                    consultantName: recipientName ?? "Consultant",
                    clientName,
                    projectTitle,
                    daysSince: result.daysSinceActivity,
                    severity: result.status as "stalled" | "at_risk",
                    portalUrl: `${process.env.NEXTAUTH_URL ?? ""}/admin/projects/${pId}`,
                  }),
                });
              } catch (emailErr) {
                console.error("[STALENESS SYNC] Email failed:", emailErr);
              }
            }

            notified++;
          }
        }
      }
    }

    return NextResponse.json({ updated, notified });
  } catch (error) {
    console.error("[STALENESS SYNC]", error);
    return NextResponse.json(
      { error: "Failed to sync staleness" },
      { status: 500 }
    );
  }
}
