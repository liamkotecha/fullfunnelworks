import { emailWrapper } from "./wrapper";

export function projectStalledEmail(opts: {
  consultantName: string;
  clientName: string;
  projectTitle: string;
  daysSince: number;
  severity: "stalled" | "at_risk";
  portalUrl: string;
}): string {
  const isAtRisk = opts.severity === "at_risk";

  const accentColor = isAtRisk ? "#EF4444" : "#F59E0B";
  const severityLabel = isAtRisk ? "At Risk" : "Stalled";
  const severityBg = isAtRisk ? "#FEF2F2" : "#FFFBEB";
  const severityText = isAtRisk ? "#991B1B" : "#92400E";

  const headline = isAtRisk
    ? "Project at risk — action required"
    : "Project stalled — check in recommended";

  const bodyText = isAtRisk
    ? `<strong>${opts.clientName}</strong> — <strong>${opts.projectTitle}</strong> has been inactive for <strong>${opts.daysSince} days</strong>. This project is now at risk and requires immediate attention to prevent disengagement.`
    : `<strong>${opts.clientName}</strong> — <strong>${opts.projectTitle}</strong> has been inactive for <strong>${opts.daysSince} days</strong>. A check-in with the client may help re-engage them before the project falls further behind.`;

  return emailWrapper(`
    <!-- Accent bar -->
    <div style="height:4px;background:${accentColor};border-radius:4px;margin-bottom:28px;"></div>

    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">${headline}</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Hi ${opts.consultantName},</p>

    <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;">
      ${bodyText}
    </p>

    <!-- Status badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:10px;overflow:hidden;width:100%;">
            <tr style="background:#F8F9FA;">
              <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">PROJECT</td>
              <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">STATUS</td>
              <td style="padding:12px 20px;font-size:13px;color:#6B7280;font-weight:600;">DAYS INACTIVE</td>
            </tr>
            <tr>
              <td style="padding:16px 20px;font-size:15px;color:#374151;">${opts.projectTitle}</td>
              <td style="padding:16px 20px;">
                <span style="display:inline-block;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;background:${severityBg};color:${severityText};">
                  ${severityLabel}
                </span>
              </td>
              <td style="padding:16px 20px;font-size:15px;color:${accentColor};font-weight:700;">${opts.daysSince}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

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
