export const dynamic = "force-dynamic";
/**
 * GET /api/invoices/my — list invoices for the logged-in client
 */
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAuth, apiError } from "@/lib/api-helpers";
import Invoice from "@/models/Invoice";
import Client from "@/models/Client";
import { formatPence } from "@/lib/format";

function toDTO(doc: Record<string, unknown>) {
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
  };
}

export async function GET() {
  try {
    const userOrRes = await requireAuth();
    if (userOrRes instanceof NextResponse) return userOrRes;
    const user = userOrRes;

    await connectDB();

    // Find client record for this user
    const client = await Client.findOne({ userId: user.id }).lean() as any;
    if (!client) {
      return NextResponse.json({ data: [] });
    }

    const invoices = await Invoice.find({
      clientId: client._id,
      status: { $ne: "draft" }, // Don't show drafts to clients
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      data: invoices.map((i) => toDTO(i as Record<string, unknown>)),
    });
  } catch (err) {
    return apiError("list my invoices", err);
  }
}
