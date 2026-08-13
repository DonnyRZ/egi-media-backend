const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const validator = require("../src/helpers/utils/validator");
const { ServiceUnavailableError } = require("../src/helpers/errors");
const commandModel = require("../src/modules/profesional/repositories/commands/command_model");
const { createDomain } = require("../src/modules/profesional/repositories/commands/domain");
const { createDemoRequest } = require("../src/modules/profesional/handlers/api_handler");
const {
  consumeRateLimit,
  resetRateLimit,
} = require("../src/modules/profesional/rate-limit");

const validBody = {
  full_name: "Ayu Pratama",
  company_name: "PT Contoh",
  job_title: "CEO",
  work_email: "ayu@contoh.co.id",
  phone: "+62811111111",
  message: "Please contact us.",
};

describe("profesional demo request validation", () => {
  it("accepts a complete payload", () => {
    const result = validator.isValidPayload(
      validBody,
      commandModel.createDemoRequestParamType,
    );
    assert.equal(result.err, null);
    assert.equal(result.data.work_email, validBody.work_email);
  });

  it("rejects an empty name", () => {
    const result = validator.isValidPayload(
      { ...validBody, full_name: "" },
      commandModel.createDemoRequestParamType,
    );
    assert.ok(result.err);
  });

  it("rejects viral-style invalid email", () => {
    const result = validator.isValidPayload(
      { ...validBody, work_email: "not-an-email" },
      commandModel.createDemoRequestParamType,
    );
    assert.ok(result.err);
  });

  it("allows a honeypot website field", () => {
    const result = validator.isValidPayload(
      { ...validBody, website: "http://spam.example" },
      commandModel.createDemoRequestParamType,
    );
    assert.equal(result.err, null);
    assert.equal(result.data.website, "http://spam.example");
  });
});

describe("profesional demo request domain", () => {
  it("does not send mail when SMTP is missing", async () => {
    let sent = 0;
    const domain = createDomain({
      sendMail: async () => {
        sent += 1;
      },
      hasSmtpConfig: () => false,
      getRecipient: () => "egi.egiholding@gmail.com",
      now: () => new Date("2026-08-13T07:00:00.000Z"),
    });

    const result = await domain.submitDemoRequest(validBody);
    assert.equal(sent, 0);
    assert.ok(result.err instanceof ServiceUnavailableError);
  });

  it("sends mail when SMTP is configured", async () => {
    const calls = [];
    const domain = createDomain({
      sendMail: async (payload) => {
        calls.push(payload);
      },
      hasSmtpConfig: () => true,
      getRecipient: () => "egi.egiholding@gmail.com",
      now: () => new Date("2026-08-13T07:00:00.000Z"),
    });

    const result = await domain.submitDemoRequest(validBody);
    assert.equal(result.err, null);
    assert.equal(result.data.message, "received");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].to, "egi.egiholding@gmail.com");
    assert.equal(calls[0].replyTo, validBody.work_email);
    assert.match(calls[0].subject, /PT Contoh/);
    assert.match(calls[0].html, /Ayu Pratama/);
  });
});

describe("profesional demo request rate limit", () => {
  it("allows five hits then blocks", () => {
    resetRateLimit();
    const now = 1_000;
    for (let index = 0; index < 5; index += 1) {
      assert.equal(consumeRateLimit("1.1.1.1", now), true);
    }
    assert.equal(consumeRateLimit("1.1.1.1", now), false);
    assert.equal(consumeRateLimit("2.2.2.2", now), true);
  });
});

describe("profesional demo request honeypot", () => {
  it("returns 204 without sending mail", async () => {
    resetRateLimit();
    const res = {
      statusCode: 0,
      ended: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      end() {
        this.ended = true;
        return this;
      },
      send() {
        return this;
      },
    };

    await createDemoRequest(
      {
        body: { ...validBody, website: "http://spam.example" },
        headers: {},
        ip: "8.8.8.8",
      },
      res,
    );

    assert.equal(res.statusCode, 204);
    assert.equal(res.ended, true);
  });
});
