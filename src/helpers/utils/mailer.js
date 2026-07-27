const nodemailer = require("nodemailer");
const config = require("../../config/global_config");

const mailConfig = config.get("/mailConfig");

const hasSmtpConfig = Boolean(
  mailConfig?.host && mailConfig?.user && mailConfig?.pass
);

if (!hasSmtpConfig) {
  console.warn(
    "Email notifications disabled: Missing SMTP environment variables."
  );
  console.warn(
    "Required: SMTP_HOST (or MAIL_HOST), SMTP_USER (or MAIL_USER), SMTP_PASS (or MAIL_PASS). Optional: SMTP_PORT, SMTP_SECURE, SMTP_FROM."
  );
} else {
  console.log("[Mailer] SMTP configured", {
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.secure,
    user: mailConfig.user,
    from: mailConfig.from,
  });
}

const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: Number(mailConfig.port || 587),
  secure:
    mailConfig.secure === "true" ||
    mailConfig.secure === true ||
    Number(mailConfig.port) === 465,
  auth: {
    user: mailConfig.user,
    pass: mailConfig.pass,
  },
});

async function sendMail({ to, subject, html, bcc }) {
  if (!hasSmtpConfig) {
    const error = new Error(
      "Email notifications disabled: Missing SMTP environment variables."
    );
    console.error("Email Send Error:", error.message);
    throw error;
  }

  const payload = {
    from: mailConfig.from || mailConfig.user,
    to,
    subject,
    html,
  };
  if (bcc) {
    payload.bcc = bcc;
  }

  try {
    console.log("[Mailer] Sending email", { to, subject });
    const result = await transporter.sendMail(payload);
    console.log("[Mailer] Email sent", {
      to,
      messageId: result?.messageId,
      response: result?.response,
    });
    return result;
  } catch (error) {
    console.error("Email Send Error:", error);
    throw error;
  }
}

module.exports = {
  sendMail,
  hasSmtpConfig,
};
