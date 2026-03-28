export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import AdminEmail from "@/models/AdminEmail";
import { requireAuth, apiError } from "@/lib/api-helpers";
import { sendEmail } from "@/lib/sendgrid";

type EmailType = "payment_reminder" | "check_in" | "upgrade_nudge";

const TEMPLATES: Record<EmailType, (name: string) => { subject: string; body: string }> = {
  payment_reminder: (name) => ({
    subject: "Action required: your Full Funnel subscription payment is overdue",
    body: `<p>Hi ${name},</p><p>We noticed your Full Funnel subscription payment is overdue. To keep your account active and avoid service interruption, please update your payment details.</p><p>If you have any questions or need help, simply reply to this email.</p><p>Thanks,<br/>The Full Funnel team</p>`,
  }),
  check_in: (name) => ({
    subject: "Checking in from Full Funnel",
    body: `<p>Hi ${name},</p><p>We noticed you haven't logged in to Full Funnel recently and wanted to check in. We hope everything is going well with your consulting work.</p><p>If there's anything we can help you with — guidance, support, or just a chat — reply to this email and we'll be in touch.</p><p>Thanks,<br/>The Full Funnel team</p>`,
  }),
  upgrade_nudge: (name) => ({
    subject: "Your Full Funnel trial is ending soon — upgrade to keep access",
    body: `<p>Hi ${name},</p><p>Your Full Funnel trial is coming to an end. To continue accessing your account and all its features, upgrade to a paid plan before your trial expires.</p><p><a href="${process.env.NEXTAUTH_URL ?? ""}/pricing">View plans and upgrade →</a></p><p>If you have any questions about which plan is right for you, just reply to this email.</p><p>Thanks,<br/>The Full Funnel team</p>`,
  }),
};

/* ── GET /api/admin/consultants/[id]/email ──────────────────── */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    await connectDB();

    const emails = await AdminEmail.find({ consultantId: id })
      .sort({ sentAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      data: emails.map((e) => {
        const doc = e as Record<string, unknown>;
        return {
          id: String(doc._id),
          consultantId: String(doc.consultantId),
          emailType: doc.emailType,
          subject: doc.subject,
          body: doc.body,
          sentAt: (doc.sentAt as Date).toISOString(),
          createdAt: (doc.createdAt as Date).toISOString(),
        };
      }),
    });
  } catch (error) {
    return apiError("CONSULTANT EMAILS GET", error);
  }
}

/* ── POST /api/admin/consultants/[id]/email ─────────────────── */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    if (userOrRes.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const { type } = await req.json();

    if (!["payment_reminder", "check_in", "upgrade_nudge"].includes(type)) {
      return NextResponse.json({ error: "Invalid email type" }, { status: 400 });
    }

    await connectDB();

    const consultant = await User.findOne({ _id: id, role: "consultant" }).lean();
    if (!consultant) return NextResponse.json({ error: "Consultant not found" }, { status: 404 });

    const doc = consultant as Record<string, unknown>;
    const firstName = (doc.name as string).split(" ")[0];
    const { subject, body } = TEMPLATES[type as EmailType](firstName);

    await sendEmail({ to: doc.email as string, subject, html: body });

    const record = await AdminEmail.create({
      consultantId: doc._id,
      sentByAdminId: userOrRes.id,
      emailType: type,
      subject,
      body,
      sentAt: new Date(),
    });

    return NextResponse.json({
      ok: true,
      data: {
        id: String(record._id),
        emailType: type,
        subject,
        sentAt: record.sentAt.toISOString(),
      },
    });
  } catch (error) {
    return apiError("CONSULTANT EMAIL POST", error);
  }
}
