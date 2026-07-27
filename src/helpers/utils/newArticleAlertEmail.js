const config = require("../../config/global_config");

/**
 * Turn a relative media path into an absolute http(s) URL for email clients.
 * Already-absolute URLs are returned unchanged.
 *
 * @param {string|null|undefined} value
 * @returns {string|null}
 */
function toAbsoluteUrl(value) {
  if (!value || typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("//")) {
    return trimmed.startsWith("//") ? `https:${trimmed}` : trimmed;
  }

  const frontendUrl = String(config.get("/frontendUrl") || "")
    .trim()
    .replace(/\/+$/, "");
  const r2Base = String(config.get("/r2BucketAuth/publicBaseUrl") || "")
    .trim()
    .replace(/\/+$/, "");

  // Prefer R2 public base for upload-style paths; otherwise FE_URL.
  const base =
    trimmed.startsWith("/images/") || trimmed.startsWith("images/")
      ? frontendUrl || r2Base
      : r2Base || frontendUrl;

  if (!base) return null;

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}

/**
 * Premium editorial HTML template for topic-subscription article alerts.
 * Table-based layout for Gmail / Apple Mail compatibility.
 *
 * @param {{
 *   title: string,
 *   summary?: string|null,
 *   imageUrl?: string|null,
 *   articleUrl: string,
 *   siteName?: string,
 *   preferencesUrl?: string|null,
 * }} params
 */
module.exports = ({
  title,
  summary,
  imageUrl,
  articleUrl,
  siteName = "EGI Media",
  preferencesUrl = null,
}) => {
  const safeTitle = escapeHtml(title || "New article");
  const safeSummary = summary ? escapeHtml(summary) : "";
  const absoluteImageUrl = toAbsoluteUrl(imageUrl);
  const safeImageUrl = absoluteImageUrl ? escapeHtml(absoluteImageUrl) : "";
  const safeArticleUrl = escapeHtml(articleUrl);
  const safeSiteName = escapeHtml(siteName);
  const safePreferencesUrl = preferencesUrl
    ? escapeHtml(preferencesUrl)
    : "";

  const preheader = escapeHtml(
    "Pilihan redaksi EGI Media khusus untuk Anda..."
  );

  const brandBlock = `
    <tr>
      <td align="center" style="padding:40px 32px 12px;">
        <h2 style="margin:0;font-family:Merriweather,Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:#0a0a0a;">
          ${safeSiteName}
        </h2>
      </td>
    </tr>`;

  const eyebrowBlock = `
    <tr>
      <td align="center" style="padding:8px 32px 28px;">
        <p style="margin:0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#6b7280;">
          ✨ Cerita Terbaru Untuk Anda
        </p>
      </td>
    </tr>`;

  const imageBlock = safeImageUrl
    ? `
    <tr>
      <td align="center" style="padding:0 24px 32px;">
        <img
          src="${safeImageUrl}"
          alt="${safeTitle}"
          width="552"
          style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:10px;outline:none;"
        />
      </td>
    </tr>`
    : "";

  const introBlock = `
      <p style="margin:0 0 20px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#4b5563;">
        Halo, kami telah merangkum laporan terbaru yang paling relevan dengan topik pilihan Anda hari ini:
      </p>`;

  const summaryBlock = safeSummary
    ? `
      <p style="margin:0 0 32px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.75;color:#4b5563;">
        ${safeSummary}
      </p>`
    : `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td style="height:24px;line-height:24px;font-size:24px;">&nbsp;</td></tr>
      </table>`;

  const preferencesBlock = safePreferencesUrl
    ? `<a href="${safePreferencesUrl}" style="color:#6b7280;text-decoration:underline;">Kelola preferensi topik</a>`
    : "Kelola preferensi topik di pengaturan akun Anda";

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${safeTitle}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Georgia, serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f7f7f5;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f7f7f5;margin:0;padding:0;width:100%;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid #eceae6;">
          ${brandBlock}
          ${eyebrowBlock}
          ${imageBlock}
          <tr>
            <td style="padding:4px 32px 44px;">
              ${introBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr><td style="height:8px;line-height:8px;font-size:8px;">&nbsp;</td></tr>
              </table>
              <h1 style="margin:0 0 20px;font-family:Merriweather,Georgia,'Times New Roman',serif;font-size:28px;line-height:1.35;font-weight:700;color:#0a0a0a;letter-spacing:-0.02em;">
                ${safeTitle}
              </h1>
              ${summaryBlock}
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 0;">
                <tr>
                  <td align="left" bgcolor="#000000" style="border-radius:6px;background-color:#000000;">
                    <a href="${safeArticleUrl}" style="display:inline-block;padding:15px 30px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.02em;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Baca Kisah Selengkapnya
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #eceae6;background-color:#fafaf8;">
              <p style="margin:0 0 8px;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#6b7280;">
                Anda menerima email ini karena mengikuti topik terkait di ${safeSiteName}.
              </p>
              <p style="margin:0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6;color:#9ca3af;">
                ${preferencesBlock}
              </p>
            </td>
          </tr>
        </table>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="width:100%;max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 16px 0;font-family:Inter,Helvetica,Arial,sans-serif;font-size:11px;line-height:1.5;color:#9ca3af;">
              © ${new Date().getFullYear()} ${safeSiteName}. Editorial journalism for curious readers.
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

module.exports.toAbsoluteUrl = toAbsoluteUrl;
