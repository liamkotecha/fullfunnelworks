import { emailWrapper } from "./wrapper";

export function leadAutoResponseEmail(opts: {
  contactName: string;
  businessName: string;
  firmName?: string;
  calendlyUrl?: string;
  replyToEmail: string;
}): string {
  const firm = opts.firmName ?? "Full Funnel";

  const calendlyBlock = opts.calendlyUrl
    ? `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
        In the meantime, feel free to book a discovery call directly:
      </p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td align="center" style="padding:0 0 24px;">
            <a href="${opts.calendlyUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">
              Book a Call →
            </a>
          </td>
        </tr>
      </table>`
    : "";

  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:24px;font-family:Georgia,serif;">Thanks for getting in touch</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Dear ${opts.contactName},
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Thank you for reaching out to ${firm}. We've received your enquiry regarding
      ${opts.businessName} and a member of our team will review it shortly.
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      We'll be in touch within <strong>1 business day</strong> to discuss how we can help
      you achieve sustainable, scalable growth.
    </p>
    ${calendlyBlock}
    <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.6;">
      If you have any urgent questions, simply reply to this email and we'll get back to you as soon as possible.
    </p>
    <p style="margin:24px 0 0;color:#374151;font-size:15px;">
      Warm regards,<br>
      <strong>The ${firm} Team</strong>
    </p>
  `);
}
