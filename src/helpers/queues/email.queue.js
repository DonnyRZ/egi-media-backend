const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const { sendMail } = require("../utils/mailer");
const logger = require("../utils/logger");

const EMAIL_QUEUE_NAME = "email";
const ctx = "EmailQueue";
const QUEUE_ADD_TIMEOUT_MS = 3000;

const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms);
    }),
  ]);
}

/**
 * Add an email job to the queue.
 * Falls back to direct SMTP send when Redis/queue is unavailable.
 * @param {{ to: string, subject: string, html: string }} data
 * @param {import("bullmq").JobsOptions} [opts]
 */
const addEmailJob = async (data, opts = {}) => {
  const connection = getConnection();
  const redisReady = connection?.status === "ready";

  if (!redisReady) {
    console.warn("[EmailQueue] Redis unavailable, sending email directly", {
      status: connection?.status,
      to: data?.to,
    });
    logger.error(ctx, "addEmailJob", "Redis unavailable, sending email directly", {
      status: connection?.status,
    });
    try {
      await withTimeout(sendMail(data), QUEUE_ADD_TIMEOUT_MS, "Direct SMTP send timed out");
      console.log("[EmailQueue] Direct SMTP send completed", { to: data?.to });
    } catch (error) {
      console.error("Email Send Error:", error);
      throw error;
    }
    return null;
  }

  try {
    const job = await withTimeout(
      emailQueue.add("send-email", data, opts),
      QUEUE_ADD_TIMEOUT_MS,
      "Email queue add timed out",
    );
    console.log("[EmailQueue] Job queued", { to: data?.to, jobId: job?.id });
    return job;
  } catch (error) {
    console.error("[EmailQueue] Queue unavailable, falling back to direct SMTP", error);
    logger.error(ctx, "addEmailJob", "Queue unavailable, sending email directly", error);
    try {
      await withTimeout(sendMail(data), QUEUE_ADD_TIMEOUT_MS, "Direct SMTP send timed out");
      console.log("[EmailQueue] Direct SMTP fallback completed", { to: data?.to });
    } catch (sendError) {
      console.error("Email Send Error:", sendError);
      throw sendError;
    }
    return null;
  }
};

module.exports = { emailQueue, addEmailJob };
