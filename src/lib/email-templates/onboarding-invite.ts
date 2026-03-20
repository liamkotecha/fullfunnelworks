import { emailWrapper } from "./wrapper";

export function onboardingInviteEmail(opts: {
  clientName: string;
  portalUrl: string;
  firmName?: string;
}): string {
  const firm = opts.firmName ?? "Full Funnel";
  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:24px;font-family:Georgia,serif;">Welcome to ${firm}</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      Dear ${opts.clientName},
    </p>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      We're delighted to welcome you to the ${firm} Growth Strategy Portal. Your private portal is now ready — 
      this is where we'll work together to close capability gaps and enable the sustainable growth your business deserves.
    </p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      Inside, you'll find your personalised Growth Strategy Framework covering People, Product, and Process — 
      the three pillars that form the foundation of scalable, founder-independent growth.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 32px;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">
            Set Up Your Account →
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 8px;color:#6B7280;font-size:13px;line-height:1.6;">
      If you have any questions before getting started, simply reply to this email and a member of the team will be in touch.
    </p>
    <p style="margin:24px 0 0;color:#374151;font-size:15px;">
      Warm regards,<br>
      <strong>The ${firm} Team</strong>
    </p>
  `);
}
