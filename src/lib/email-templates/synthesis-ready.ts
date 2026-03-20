import { emailWrapper } from "./wrapper";

export function synthesisReadyEmail(opts: {
  consultantName: string;
  clientName: string;
  memberCount: number;
  synthesisUrl: string;
}): string {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">All assessments submitted — ready for synthesis</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Hi ${opts.consultantName},</p>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">
      All <strong>${opts.memberCount}</strong> team member${opts.memberCount !== 1 ? "s" : ""} from
      <strong>${opts.clientName}</strong> have submitted their individual assessments.
    </p>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      You can now review their answers side-by-side, view divergence scores, and write the official
      synthesis for each question.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">CLIENT</td>
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">MEMBERS</td>
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">STATUS</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;font-size:15px;color:#374151;">${opts.clientName}</td>
        <td style="padding:16px 20px;font-size:15px;color:#374151;">${opts.memberCount}</td>
        <td style="padding:16px 20px;">
          <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;background:#ECFDF5;color:#065F46;">
            Ready for synthesis
          </span>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.synthesisUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            Begin Synthesis →
          </a>
        </td>
      </tr>
    </table>
  `);
}
