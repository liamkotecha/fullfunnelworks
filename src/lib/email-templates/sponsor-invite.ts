import { emailWrapper } from "./wrapper";

export function sponsorInviteEmail(opts: {
  sponsorName: string;
  projectTitle: string;
  clientName: string;
  loginUrl: string;
}): string {
  return emailWrapper(`
    <!-- Accent bar -->
    <div style="height:4px;background:#6CC2FF;border-radius:4px;margin-bottom:28px;"></div>

    <h2 style="margin:0 0 16px;color:#141414;font-size:22px;font-family:Georgia,serif;">You've been added as a project sponsor</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Hi ${opts.sponsorName},</p>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      You've been added as a <strong>sponsor</strong> on the following engagement:
    </p>

    <!-- Project card -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      <tr>
        <td style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:10px;padding:20px 24px;">
          <p style="margin:0 0 4px;font-size:13px;color:#6B7280;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Project</p>
          <p style="margin:0 0 12px;font-size:18px;font-weight:700;color:#141414;">${opts.projectTitle}</p>
          <p style="margin:0;font-size:14px;color:#6B7280;">${opts.clientName}</p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      As a sponsor, you have read-only access to view the project's progress dashboard — including overall framework completion, section-by-section progress, and key milestones.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.loginUrl}" style="display:inline-block;background:#141414;color:#6CC2FF;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            View Project Dashboard →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:16px 0 0;color:#9CA3AF;font-size:13px;text-align:center;">
      You'll be asked to sign in with your email address.
    </p>
  `);
}
