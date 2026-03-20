export const dynamic = "force-dynamic";
/**
 * POST /api/webhooks/stripe — Stripe webhook receiver
 *
 * Handles:
 * - invoice.paid → set status "paid", paidAt = now
 * - invoice.payment_failed → set status "overdue"
 * - invoice.voided → set status "void"
 */
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";
import Prospect from "@/models/Prospect";
import { getGA4Settings, trackServerEvent } from "@/lib/analytics";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("[stripe webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  await connectDB();

  try {
    switch (event.type) {
      case "invoice.paid": {
        const stripeInvoice = event.data.object;
        const invoice = await Invoice.findOne({
          stripeInvoiceId: stripeInvoice.id,
        });
        if (invoice) {
          invoice.status = "paid";
          invoice.paidAt = new Date();
          await invoice.save();

          // Fire GA4 invoice_paid event (non-blocking)
          void (async () => {
            try {
              const config = await getGA4Settings();
              if (!config || !config.trackedEvents.invoicePaid) return;
              // Try to find the prospect linked to this invoice's client
              const prospect = await Prospect.findOne({ clientId: invoice.clientId, gaClientId: { $exists: true, $ne: null } }).lean() as { gaClientId?: string; businessName?: string } | null;
              if (!prospect?.gaClientId) return;
              await trackServerEvent({
                measurementId: config.measurementId,
                apiSecret: config.apiSecret,
                clientId: prospect.gaClientId,
                eventName: "invoice_paid",
                params: {
                  value: invoice.amount / 100,
                  currency: "GBP",
                  invoice_number: invoice.invoiceNumber ?? "",
                  business_name: prospect.businessName ?? "",
                },
              });
            } catch (err) {
              console.error("[stripe webhook] GA4 event error:", err);
            }
          })();
        }
        break;
      }

      case "invoice.payment_failed": {
        const stripeInvoice = event.data.object;
        const invoice = await Invoice.findOne({
          stripeInvoiceId: stripeInvoice.id,
        });
        if (invoice && invoice.status !== "paid") {
          invoice.status = "overdue";
          await invoice.save();
        }
        break;
      }

      case "invoice.voided": {
        const stripeInvoice = event.data.object;
        const invoice = await Invoice.findOne({
          stripeInvoiceId: stripeInvoice.id,
        });
        if (invoice) {
          invoice.status = "void";
          await invoice.save();
        }
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] Error processing event:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
