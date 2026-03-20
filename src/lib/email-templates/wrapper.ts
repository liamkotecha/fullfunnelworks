const FIRM_NAME = process.env.SENDGRID_FROM_NAME ?? "Full Funnel";

export function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${FIRM_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#F5F5F3;font-family:DM Sans,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F5F3;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:#0F1F3D;padding:32px 40px;border-radius:12px 12px 0 0;">
            <h1 style="margin:0;color:#C9A84C;font-size:28px;font-weight:900;letter-spacing:2px;font-family:Georgia,serif;">FULL FUNNEL</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Growth Strategy Framework</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="background:#ffffff;padding:40px;border-radius:0 0 12px 12px;box-shadow:0 4px 20px rgba(15,31,61,0.08);">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px;text-align:center;">
            <p style="margin:0;color:#94A3B8;font-size:12px;">
              © ${new Date().getFullYear()} ${FIRM_NAME}. All rights reserved.<br>
              <a href="#" style="color:#94A3B8;text-decoration:underline;">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
