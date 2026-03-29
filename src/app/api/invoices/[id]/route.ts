export const dynamic = "force-dynamic";
/**
 * GET    /api/invoices/[id] — get single invoice
 * PATCH  /api/invoices/[id] — update (send, void, mark paid)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/api-helpers";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import { createStripeInvoice, voidStripeInvoice } from "@/lib/stripe";
import { formatPence } from "@/lib/format";
import { sendEmail } from "@/lib/sendgrid";
import { invoiceSentEmail } from "@/lib/email-templates/invoice-sent";

function toDTO(doc: Record<string, unknown>, clientDoc?: Record<string, unknown> | null) {
  const d = typeof doc.toObject === "function" ? doc.toObject() : doc;
  return {
    id: String(d._id),
    clientId: String(d.clientId),
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
    ...(clientDoc
      ? {
          clientName:
            (clientDoc.businessName as string) ||
            (clientDoc.contactName as string) ||
            undefined,
          client: {
            businessName: clientDoc.businessName as string | undefined,
            contactName: clientDoc.contactName as string | undefined,
            contactEmail: clientDoc.contactEmail as string | undefined,
            invoicingEmail: clientDoc.invoicingEmail as string | undefined,
            addressLine1: clientDoc.addressLine1 as string | undefined,
            addressLine2: clientDoc.addressLine2 as string | undefined,
            city: clientDoc.city as string | undefined,
            postcode: clientDoc.postcode as string | undefined,
            country: clientDoc.country as string | undefined,
          },
        }
      : {}),
  };
}

// ── GET ──────────────────────────────────────────────────────

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Consultants may only access invoices for their own clients
    if (user.role === "consultant") {
      const clientDoc = await Client.findById(invoice.clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const client = await Client.findById(invoice.clientId).lean<Record<string, unknown>>();

    return NextResponse.json({ data: toDTO(invoice, client) });
  } catch (err) {
    return apiError("get invoice", err);
  }
}

// ── PATCH ────────────────────────────────────────────────────

const patchSchema = z.object({
  action: z.enum(["send", "void", "markPaid"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    if (user.role !== "admin" && user.role !== "consultant") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await connectDB();
    const invoice = await Invoice.findById(params.id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Consultants may only modify invoices for their own clients
    if (user.role === "consultant") {
      const clientDoc = await Client.findById(invoice.clientId).select("assignedConsultant").lean();
      if (!clientDoc || String((clientDoc as Record<string, unknown>).assignedConsultant) !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { action } = parsed.data;

    // ── SEND ──
    if (action === "send") {
      if (invoice.status !== "draft") {
        return NextResponse.json(
          { error: "Only draft invoices can be sent" },
          { status: 400 }
        );
      }

      // Create Stripe invoice if not already
      if (!invoice.stripeInvoiceId) {
        const client = await Client.findById(invoice.clientId)
          .populate("userId", "email name")
          .lean<Record<string, unknown>>();

        if (!client) {
          return NextResponse.json(
            { error: "Client not found" },
            { status: 404 }
          );
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
          title: invoice.title,
          description: invoice.description,
          amountPence: invoice.amountPence,
        });

        invoice.stripeInvoiceId = stripeResult.stripeInvoiceId;
        invoice.stripePaymentUrl = stripeResult.stripePaymentUrl;
        invoice.dueDate = stripeResult.dueDate;

        // Send notification email
        try {
          const html = invoiceSentEmail({
            clientName,
            invoiceTitle: invoice.title,
            amountFormatted: formatPence(invoice.amountPence),
            dueDate: stripeResult.dueDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }),
            paymentUrl: stripeResult.stripePaymentUrl,
          });
          await sendEmail({
            to: clientEmail,
            subject: `Invoice: ${invoice.title}`,
            html,
          });
        } catch {
          console.error("[invoice email] Failed to send notification email");
        }
      }

      invoice.sentAt = new Date();
      invoice.status = "sent";

      if (
        invoice.paymentModel === "milestone" &&
        invoice.gracePeriodDays &&
        !invoice.gracePeriodEndsAt
      ) {
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + invoice.gracePeriodDays);
        invoice.gracePeriodEndsAt = graceEnd;
      }

      await invoice.save();
      return NextResponse.json({ data: toDTO(invoice) });
    }

    // ── VOID ──
    if (action === "void") {
      if (invoice.status === "paid" || invoice.status === "void") {
        return NextResponse.json(
          { error: "Cannot void a paid or already voided invoice" },
          { status: 400 }
        );
      }

      if (invoice.stripeInvoiceId) {
        try {
          await voidStripeInvoice(invoice.stripeInvoiceId);
        } catch {
          console.error("[invoice void] Failed to void Stripe invoice");
        }
      }

      invoice.status = "void";
      await invoice.save();
      return NextResponse.json({ data: toDTO(invoice) });
    }

    // ── MARK PAID ──
    if (action === "markPaid") {
      if (invoice.status === "paid") {
        return NextResponse.json(
          { error: "Invoice is already paid" },
          { status: 400 }
        );
      }

      invoice.status = "paid";
      invoice.paidAt = new Date();
      await invoice.save();
      return NextResponse.json({ data: toDTO(invoice) });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return apiError("patch invoice", err);
  }
}
