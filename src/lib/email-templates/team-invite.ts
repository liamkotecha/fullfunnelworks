import { emailWrapper } from "./wrapper";

export function teamInviteEmail(opts: {
  recipientName: string;
  clientName: string;
  inviterName: string;
  role: string;
  portalUrl: string;
  firmName?: string;
}): string {
  const firm = opts.firmName ?? "Full Funnel Works";
  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">You've been invited to collaborate</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Hi ${opts.recipientName},</p>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      ${opts.inviterName} has invited you to complete a strategic growth assessment as part of
      <strong>${opts.clientName}</strong>'s engagement with ${firm}.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">YOUR ROLE</td>
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">COMPANY</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;font-size:15px;color:#0F1F3D;font-weight:600;">${opts.role}</td>
        <td style="padding:16px 20px;font-size:15px;color:#374151;">${opts.clientName}</td>
      </tr>
    </table>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      Your responses are <strong>private</strong> — other team members won't see your individual answers.
      Once everyone has submitted, your consultant will synthesise the responses into an official assessment.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            Start Assessment →
          </a>
        </td>
      </tr>
    </table>
  `);
}
