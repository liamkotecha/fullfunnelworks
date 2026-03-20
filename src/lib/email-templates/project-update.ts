import { emailWrapper } from "./wrapper";
import type { ProjectStatus } from "@/types";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  not_started: "Not Started",
  in_progress:  "In Progress",
  blocked:      "Blocked",
  completed:    "Completed",
};

export function projectUpdateEmail(opts: {
  clientName: string;
  projectTitle: string;
  oldStatus: ProjectStatus;
  newStatus: ProjectStatus;
  portalUrl: string;
  note?: string;
}): string {
  return emailWrapper(`
    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">Project Update</h2>
    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Dear ${opts.clientName},</p>
    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      There's been an update to your project <strong>${opts.projectTitle}</strong>.
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;">
      <tr style="background:#F8F9FA;">
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;width:50%;">PREVIOUS STATUS</td>
        <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">NEW STATUS</td>
      </tr>
      <tr>
        <td style="padding:16px 20px;font-size:16px;color:#374151;">${STATUS_LABELS[opts.oldStatus]}</td>
        <td style="padding:16px 20px;font-size:16px;color:#0F1F3D;font-weight:700;">${STATUS_LABELS[opts.newStatus]}</td>
      </tr>
    </table>
    ${opts.note ? `<p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;background:#F8F9FA;padding:16px;border-radius:8px;"><strong>Note:</strong> ${opts.note}</p>` : ""}
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            View Project →
          </a>
        </td>
      </tr>
    </table>
  `);
}
