const wrapper = require("../../../../helpers/utils/wrapper");
const { ServiceUnavailableError } = require("../../../../helpers/errors");
const { buildDemoRequestHtml } = require("./demo-request-email");

function createDomain({ sendMail, hasSmtpConfig, getRecipient, now }) {
  async function submitDemoRequest(payload) {
    if (!hasSmtpConfig()) {
      return wrapper.error(
        new ServiceUnavailableError("Email service is unavailable"),
      );
    }

    const recipient = getRecipient();
    const clock = now || (() => new Date());
    const submittedAt = clock().toISOString();
    try {
      await sendMail({
        to: recipient,
        replyTo: payload.work_email,
        subject: `Request a Demo — ${payload.company_name} — ${payload.full_name}`,
        html: buildDemoRequestHtml(payload, submittedAt),
      });
    } catch {
      return wrapper.error(
        new ServiceUnavailableError("Email service is unavailable"),
      );
    }

    return wrapper.data({ message: "received" });
  }

  return { submitDemoRequest };
}

module.exports = { createDomain };
