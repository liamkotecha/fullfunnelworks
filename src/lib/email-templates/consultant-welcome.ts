import { emailWrapper } from "./wrapper";

export function consultantWelcomeEmail(opts: {
  name: string;
  dashboardUrl: string;
}): string {
  const firstName = opts.name.split(" ")[0];

  return emailWrapper(`
    <!-- Accent bar -->
    <div style="height:4px;background:#6CC2FF;border-radius:4px;margin-bottom:28px;"></div>

    <h2 style="margin:0 0 8px;color:#0F1F3D;font-size:22px;font-family:Georgia,serif;">Welcome, ${firstName}.</h2>
    <p style="margin:0 0 24px;color:#6B7280;font-size:15px;line-height:1.6;">
      Your Full Funnel Works consultant account is active. Here's what to do next.
    </p>

    <!-- Steps -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
      ${[
        ["1", "Add your first client", "Go to Clients → Add client. You can invite them via email once created."],
        ["2", "Set up your profile", "Head to Settings to update your availability and specialisms."],
        ["3", "Explore the framework", "Each client project unlocks modules — Assessment, GTM, Financial Modeller and more."],
      ].map(([num, title, desc]) => `
      <tr>
        <td style="padding:0 0 16px 0;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="width:36px;vertical-align:top;">
                <div style="width:28px;height:28px;border-radius:50%;background:#0F1F3D;text-align:center;line-height:28px;color:#C9A84C;font-size:13px;font-weight:700;">${num}</div>
              </td>
              <td style="padding-left:12px;vertical-align:top;">
                <p style="margin:0 0 4px;color:#0F1F3D;font-size:14px;font-weight:600;">${title}</p>
                <p style="margin:0;color:#6B7280;font-size:13px;line-height:1.5;">${desc}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("")}
    </table>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:28px;">
      <a href="${opts.dashboardUrl}"
         style="display:inline-block;padding:14px 32px;background:#0F1F3D;color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.3px;">
        Go to your dashboard →
      </a>
    </div>

    <p style="margin:0;color:#9CA3AF;font-size:13px;text-align:center;">
      Questions? Reply to this email — we're here to help.
    </p>
  `);
}
