import { emailWrapper } from "./wrapper";

export function invoiceSentEmail(opts: {
  clientName: string;
  invoiceTitle: string;
  amountFormatted: string;
  dueDate: string;
  paymentUrl: string;
  firmName?: string;
}): string {
  const firm = opts.firmName ?? "Full Funnel";
  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:24px;font-family:Georgia,serif;">New Invoice</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Dear ${opts.clientName},
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      A new invoice has been raised for your engagement with ${firm}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;background:#F8FAFC;border-radius:8px;border:1px solid #E2E8F0;">
      <tr>
        <td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Invoice</span><br>
                <span style="color:#0F1F3D;font-size:16px;font-weight:600;">${opts.invoiceTitle}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Amount</span><br>
                <span style="color:#0F1F3D;font-size:20px;font-weight:700;">${opts.amountFormatted}</span>
              </td>
            </tr>
            <tr>
              <td style="padding:4px 0;">
                <span style="color:#94A3B8;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Due Date</span><br>
                <span style="color:#0F1F3D;font-size:15px;font-weight:600;">${opts.dueDate}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${opts.paymentUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">
            Pay Invoice →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.6;">
      You can also view and manage your invoices from within your ${firm} portal. If you have any questions about this invoice, simply reply to this email.
    </p>
    <p style="margin:24px 0 0;color:#374151;font-size:15px;">
      Warm regards,<br>
      <strong>The ${firm} Team</strong>
    </p>
  `);
}
