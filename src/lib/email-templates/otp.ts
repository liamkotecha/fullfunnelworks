import { emailWrapper } from "./wrapper";

export function otpEmail(opts: { code: string }): string {
  return emailWrapper(`
    <h2 style="margin:0 0 8px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">Your sign-in code</h2>
    <p style="margin:0 0 32px;color:#6B7280;font-size:14px;">Use this code to sign in to your Full Funnel portal. It expires in 10 minutes.</p>
    <div style="background:#F8F9FA;border:1px solid #E5E7EB;border-radius:12px;padding:32px;text-align:center;margin-bottom:32px;">
      <p style="margin:0 0 8px;color:#9CA3AF;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:600;">One-Time Code</p>
      <p style="margin:0;color:#0F1F3D;font-size:48px;font-weight:900;letter-spacing:12px;font-family:monospace;">${opts.code}</p>
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#FFF9F0;border-left:3px solid #C9A84C;padding:12px 16px;border-radius:0 6px 6px 0;">
          <p style="margin:0;color:#92400E;font-size:13px;">⏱ This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#9CA3AF;font-size:13px;line-height:1.6;">
      If you didn't request this code, you can safely ignore this email. If you're concerned about your account security, please contact us immediately.
    </p>
  `);
}
