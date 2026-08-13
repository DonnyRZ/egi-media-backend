const { createDomain } = require("./domain");
const mailer = require("../../../../helpers/utils/mailer");
const config = require("../../../../config/global_config");

const domain = createDomain({
  sendMail: mailer.sendMail,
  hasSmtpConfig: () => mailer.hasSmtpConfig,
  getRecipient: () => config.get("/demoRequestTo"),
  now: () => new Date(),
});

const submitDemoRequest = (payload) => domain.submitDemoRequest(payload);

module.exports = {
  submitDemoRequest,
};
