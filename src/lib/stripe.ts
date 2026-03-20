import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    _stripe = new Stripe(key, {
      apiVersion: "2024-04-10" as Stripe.LatestApiVersion,
    });
  }
  return _stripe;
}

/** @deprecated Use getStripe() instead */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Create a Stripe invoice for a client and return the hosted payment URL.
 * Uses Stripe's Invoice + InvoiceItem API (not Payment Links).
 *
 * Steps:
 * 1. Find or create Stripe customer for this client email
 * 2. Create invoice item
 * 3. Create invoice
 * 4. Finalise invoice (makes it payable)
 * 5. Return { stripeInvoiceId, stripePaymentUrl, dueDate }
 */
export async function createStripeInvoice(opts: {
  clientEmail: string;
  clientName: string;
  title: string;
  description?: string;
  amountPence: number;
  dueDays?: number;
}): Promise<{
  stripeInvoiceId: string;
  stripePaymentUrl: string;
  dueDate: Date;
}> {
  const dueDays = opts.dueDays ?? 14;

  // 1. Find or create Stripe customer by email
  const existing = await stripe.customers.list({
    email: opts.clientEmail,
    limit: 1,
  });

  let customerId: string;
  if (existing.data.length > 0) {
    customerId = existing.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: opts.clientEmail,
      name: opts.clientName,
    });
    customerId = customer.id;
  }

  // 2. Create invoice item
  await stripe.invoiceItems.create({
    customer: customerId,
    amount: opts.amountPence,
    currency: "gbp",
    description: opts.title + (opts.description ? ` — ${opts.description}` : ""),
  });

  // 3. Create invoice with due date
  const invoice = await stripe.invoices.create({
    customer: customerId,
    collection_method: "send_invoice",
    days_until_due: dueDays,
    auto_advance: true,
    metadata: {
      title: opts.title,
    },
  });

  // 4. Finalise the invoice
  const finalised = await stripe.invoices.finalizeInvoice(invoice.id);

  // 5. Return IDs and URL
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueDays);

  return {
    stripeInvoiceId: finalised.id,
    stripePaymentUrl: finalised.hosted_invoice_url ?? "",
    dueDate,
  };
}

/**
 * Void a Stripe invoice by ID.
 */
export async function voidStripeInvoice(
  stripeInvoiceId: string
): Promise<void> {
  await stripe.invoices.voidInvoice(stripeInvoiceId);
}
