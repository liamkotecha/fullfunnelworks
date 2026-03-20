import { emailWrapper } from "./wrapper";

export function newLeadEmail(opts: {
  businessName: string;
  contactName: string;
  contactEmail: string;
  phone?: string;
  companySize?: string;
  revenueRange?: string;
  primaryChallenge?: string;
  message?: string;
  leadScore: number;
  portalUrl: string;
  firmName?: string;
}): string {
  const firm = opts.firmName ?? "Full Funnel";

  // Score colour coding
  let scoreColour = "#94A3B8"; // grey 0-40
  if (opts.leadScore >= 71) scoreColour = "#22C55E"; // green
  else if (opts.leadScore >= 41) scoreColour = "#F59E0B"; // amber

  const fieldRow = (label: string, value?: string) =>
    value
      ? `<tr>
          <td style="padding:6px 12px;color:#6B7280;font-size:13px;font-weight:600;white-space:nowrap;vertical-align:top;">${label}</td>
          <td style="padding:6px 12px;color:#374151;font-size:13px;">${value}</td>
        </tr>`
      : "";

  return emailWrapper(`
    <div style="text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 4px;color:#6B7280;font-size:11px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;">New Lead Received</p>
      <p style="margin:0;color:${scoreColour};font-size:48px;font-weight:900;line-height:1;">${opts.leadScore}</p>
      <p style="margin:4px 0 0;color:#94A3B8;font-size:12px;">Lead Score / 100</p>
    </div>

    <h2 style="margin:0 0 16px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">
      ${opts.businessName}
    </h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;margin-bottom:24px;">
      <tbody>
        ${fieldRow("Contact", opts.contactName)}
        ${fieldRow("Email", opts.contactEmail)}
        ${fieldRow("Phone", opts.phone)}
        ${fieldRow("Company Size", opts.companySize)}
        ${fieldRow("Revenue Range", opts.revenueRange)}
        ${fieldRow("Challenge", opts.primaryChallenge)}
        ${fieldRow("Message", opts.message)}
      </tbody>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:8px 0 24px;">
          <a href="${opts.portalUrl}" style="display:inline-block;background:#0F1F3D;color:#C9A84C;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0.5px;">
            View in CRM →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;color:#94A3B8;font-size:12px;text-align:center;">
      This is an automated notification from ${firm}.
    </p>
  `);
}
