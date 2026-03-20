/**
 * GET  /api/invoices?clientId=  — list invoices for a client
 * GET  /api/invoices?projectId= — list invoices for a project
 * POST /api/invoices            — create a new invoice
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/api-helpers";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import { createStripeInvoice } from "@/lib/stripe";
import { formatPence } from "@/lib/format";
import { sendEmail } from "@/lib/sendgrid";
import { invoiceSentEmail } from "@/lib/email-templates/invoice-sent";

function toDTO(doc: Record<string, unknown>) {
  const d = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(d._id),
    clientId: typeof d.clientId === "object" && d.clientId !== null ? String((d.clientId as Record<string, unknown>)._id) : String(d.clientId),
    clientName: typeof d.clientId === "object" && d.clientId !== null ? ((d.clientId as Record<string, unknown>).businessName as string) : undefined,
    projectId: String(d.projectId),
    moduleId: d.moduleId ?? undefined,
    title: d.title,
    description: d.description ?? undefined,
    amountPence: d.amountPence,
    amountFormatted: formatPence(d.amountPence as number),
    status: d.status,
    paymentModel: d.paymentModel,
    gracePeriodDays: d.gracePeriodDays ?? undefined,
    gracePeriodEndsAt: d.gracePeriodEndsAt
      ? new Date(d.gracePeriodEndsAt as string).toISOString()
      : null,
    stripePaymentUrl: d.stripePaymentUrl ?? null,
    paidAt: d.paidAt ? new Date(d.paidAt as string).toISOString() : null,
    sentAt: d.sentAt ? new Date(d.sentAt as string).toISOString() : null,
    dueDate: d.dueDate ? new Date(d.dueDate as string).toISOString() : null,
    createdAt: new Date(d.createdAt as string).toISOString(),
    updatedAt: new Date(d.updatedAt as string).toISOString(),
  };
}

// ── GET ──────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    // Only admin/consultant can list invoices
    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");
    const projectId = searchParams.get("projectId");

    const filter: Record<string, string> = {};
    if (clientId) filter.clientId = clientId;
    if (projectId) filter.projectId = projectId;

    const invoices = await Invoice.find(filter)
      .sort({ createdAt: -1 })
      .populate("clientId", "businessName")
      .lean();

    return NextResponse.json({
      data: invoices.map((i) => toDTO(i as Record<string, unknown>)),
    });
  } catch (err) {
    return apiError("list invoices", err);
  }
}

// ── POST ─────────────────────────────────────────────────────

const createSchema = z.object({
  clientId: z.string().min(1),
  projectId: z.string().min(1),
  moduleId: z.string().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  amountPence: z.number().int().positive(),
  paymentModel: z.enum(["upfront", "on_completion", "milestone"]),
  gracePeriodDays: z.number().int().positive().optional(),
  dueDays: z.number().int().positive().optional().default(14),
  sendImmediately: z.boolean().optional().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Validate milestone requires gracePeriodDays
    if (data.paymentModel === "milestone" && !data.gracePeriodDays) {
      return NextResponse.json(
        { error: "gracePeriodDays is required for milestone payment model" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create invoice document
    const invoice = await Invoice.create({
      clientId: data.clientId,
      projectId: data.projectId,
      moduleId: data.moduleId,
      title: data.title,
      description: data.description,
      amountPence: data.amountPence,
      paymentModel: data.paymentModel,
      gracePeriodDays: data.gracePeriodDays,
      status: "draft",
    });

    // If sendImmediately, create Stripe invoice and send
    if (data.sendImmediately) {
      // Get client email for Stripe
      const client = await Client.findById(data.clientId)
        .populate("userId", "email name")
        .lean<Record<string, unknown>>();

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      const clientUser = client.userId as Record<string, unknown> | undefined;
      const clientEmail =
        (client.invoicingEmail as string) ||
        (client.contactEmail as string) ||
        (clientUser?.email as string) ||
        "";
      const clientName =
        (client.contactName as string) ||
        (client.businessName as string) ||
        "";

      if (!clientEmail) {
        return NextResponse.json(
          { error: "Client has no email address for invoicing" },
          { status: 400 }
        );
      }

      const stripeResult = await createStripeInvoice({
        clientEmail,
        clientName,
        title: data.title,
        description: data.description,
        amountPence: data.amountPence,
        dueDays: data.dueDays,
      });

      invoice.stripeInvoiceId = stripeResult.stripeInvoiceId;
      invoice.stripePaymentUrl = stripeResult.stripePaymentUrl;
      invoice.sentAt = new Date();
      invoice.dueDate = stripeResult.dueDate;
      invoice.status = "sent";

      if (data.paymentModel === "milestone" && data.gracePeriodDays) {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + data.gracePeriodDays);
        invoice.gracePeriodEndsAt = graceEnd;
      }

      await invoice.save();

      // Send notification email
      try {
        const html = invoiceSentEmail({
          clientName,
          invoiceTitle: data.title,
          amountFormatted: formatPence(data.amountPence),
          dueDate: stripeResult.dueDate.toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          paymentUrl: stripeResult.stripePaymentUrl,
        });
        await sendEmail({
          to: clientEmail,
          subject: `Invoice: ${data.title}`,
          html,
        });
      } catch {
        // Email failure should not block invoice creation
        console.error("[invoice email] Failed to send notification email");
      }
    }

    return NextResponse.json({ data: toDTO(invoice) }, { status: 201 });
  } catch (err) {
    return apiError("create invoice", err);
  }
}
