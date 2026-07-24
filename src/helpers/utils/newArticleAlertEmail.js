/**
 * HTML template for topic-subscription "new article published" alerts.
 * @param {{ title: string, summary?: string|null, imageUrl?: string|null, articleUrl: string, siteName?: string }} params
 */
module.exports = ({
  title,
  summary,
  imageUrl,
  articleUrl,
  siteName = "EGI Media",
}) => {
  const safeTitle = escapeHtml(title || "New article");
  const safeSummary = summary ? escapeHtml(summary) : "";
  const safeImageUrl = imageUrl ? escapeHtml(imageUrl) : "";
  const safeArticleUrl = escapeHtml(articleUrl);
  const safeSiteName = escapeHtml(siteName);

  const imageBlock = safeImageUrl
    ? `<img src="${safeImageUrl}" alt="${safeTitle}" style="display:block;width:100%;max-height:280px;object-fit:cover;border:0;" />`
    : "";

  const summaryBlock = safeSummary
    ? `<p style="font-size:15px;line-height:1.6;color:#4b5563;margin:0 0 24px;">${safeSummary}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="580" cellspacing="0" cellpadding="0" style="max-width:580px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a8a 0%,#0f172a 100%);padding:28px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:0.4px;">${safeSiteName}</h1>
              <p style="margin:8px 0 0;color:#cbd5e1;font-size:13px;text-transform:uppercase;letter-spacing:0.12em;">New Article Alert</p>
            </td>
          </tr>
          ${imageBlock ? `<tr><td>${imageBlock}</td></tr>` : ""}
          <tr>
            <td style="padding:36px 30px;">
              <h2 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:#111827;">${safeTitle}</h2>
              ${summaryBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px auto 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#2563eb;">
                    <a href="${safeArticleUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;">
                      Read Article
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#f9fafb;padding:20px 30px;text-align:center;font-size:12px;color:#9ca3af;">
              You received this email because you subscribed to a related topic on ${safeSiteName}.
              Manage preferences in your account settings.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
