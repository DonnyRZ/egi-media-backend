function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function row(label, value) {
  const text = escapeHtml(value).trim();
  if (!text) return "";
  return `<p><strong>${escapeHtml(label)}:</strong> ${text}</p>`;
}

function buildDemoRequestHtml(payload, submittedAt) {
  return [
    "<h1>Request a Demo</h1>",
    row("Name", payload.full_name),
    row("Company", payload.company_name),
    row("Title", payload.job_title),
    row("Work email", payload.work_email),
    row("Phone", payload.phone),
    row("Message", payload.message),
    row("Submitted at", submittedAt),
  ].join("");
}

module.exports = {
  escapeHtml,
  buildDemoRequestHtml,
};
