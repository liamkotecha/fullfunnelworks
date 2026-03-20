import { emailWrapper } from "./wrapper";

export function blockRaisedEmail(opts: {
  consultantName: string;
  clientName: string;
  projectTitle: string;
  blockReason: string;
  raisedAt: string;
  portalUrl: string;
}): string {
  return emailWrapper(`
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:#FEF2F2;border-left:4px solid #DC2626;padding:16px 20px;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#DC2626;font-size:14px;font-weight:700;">🚧 Project Blocked — Action Required</p>
        </td>
      </tr>
    </table>
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">Project Block Raised</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Dear ${opts.consultantName},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      A block has been raised on project <strong>${opts.projectTitle}</strong> for client <strong>${opts.clientName}</strong>. 
      Your immediate attention is required.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #FECACA;border-radius:10px;overflow:hidden;background:#FFF5F5;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;color:#9CA3AF;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Block Reason</p>
          <p style="margin:0 0 16px;font-size:15px;color:#111827;line-height:1.6;">${opts.blockReason}</p>
          <p style="margin:0;font-size:13px;color:#6B7280;">Raised at: ${opts.raisedAt}</p>
        </td>
      </tr>
    </table>
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#DC2626;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            Resolve Block →
          </a>
        </td>
      </tr>
    </table>
  `);
}
