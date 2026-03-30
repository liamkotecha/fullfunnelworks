import { emailWrapper } from "./wrapper";

export function sponsorStalledEmail(opts: {
  sponsorName: string;
  clientName: string;
  projectTitle: string;
  daysSince: number;
  severity: "stalled" | "at_risk";
  portalUrl: string;
  consultantName?: string;
  consultantEmail?: string;
}): string {
  const isAtRisk = opts.severity === "at_risk";

  const accentColor = isAtRisk ? "#EF4444" : "#F59E0B";
  const severityLabel = isAtRisk ? "At Risk" : "Stalled";
  const severityBg = isAtRisk ? "#FEF2F2" : "#FFFBEB";
  const severityText = isAtRisk ? "#991B1B" : "#92400E";

  const headline = isAtRisk
    ? "Your project needs attention"
    : "Progress update: project has slowed";

  const bodyText = isAtRisk
    ? `The engagement <strong>${opts.projectTitle}</strong> for <strong>${opts.clientName}</strong> has been inactive for <strong>${opts.daysSince} days</strong>. As a sponsor, we wanted to keep you informed as this project is now at risk.`
    : `The engagement <strong>${opts.projectTitle}</strong> for <strong>${opts.clientName}</strong> has been inactive for <strong>${opts.daysSince} days</strong>. Your consulting team has been notified and is working to re-engage the client.`;

  const consultantBlock = opts.consultantName && opts.consultantEmail
    ? `<p style="margin:16px 0 0;color:#374151;font-size:15px;line-height:1.7;">
        If you'd like to discuss this directly, you can reach your consultant:<br>
        <strong>${opts.consultantName}</strong> — <a href="mailto:${opts.consultantEmail}" style="color:#6CC2FF;">${opts.consultantEmail}</a>
      </p>`
    : "";

  return emailWrapper(`
    <!-- Accent bar -->
    <div style="height:4px;background:${accentColor};border-radius:4px;margin-bottom:28px;"></div>

    <h2 style="margin:0 0 16px;color:#141414;font-size:22px;font-family:Georgia,serif;">${headline}</h2>

    <p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.7;">Hi ${opts.sponsorName},</p>

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

    ${consultantBlock}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
      <tr>
        <td align="center" style="padding:8px 0;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#141414;color:#6CC2FF;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">
            View Project Dashboard →
          </a>
        </td>
      </tr>
    </table>
  `);
}
