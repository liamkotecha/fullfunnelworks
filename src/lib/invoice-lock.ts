/**
 * checkModuleLock — determines if a module should be locked due to unpaid milestone invoice.
 *
 * Returns true (locked) if:
 * - There is a milestone invoice for this module
 * - Invoice status is NOT "paid"
 * - gracePeriodEndsAt has passed
 */
import { connectDB } from "@/lib/db";
import Invoice from "@/models/Invoice";

export async function checkModuleLock(
  clientId: string,
  moduleId: string
): Promise<boolean> {
  await connectDB();

  const now = new Date();

  const lockedInvoice = await Invoice.findOne({
    clientId,
    moduleId,
    paymentModel: "milestone",
    status: { $nin: ["paid", "void"] },
    gracePeriodEndsAt: { $lte: now },
  }).lean();

  return !!lockedInvoice;
}
