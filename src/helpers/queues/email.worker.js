const { Worker } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const { sendMail } = require("../utils/mailer");
const logger = require("../utils/logger");

const ctx = "EmailWorker";

let emailWorker = null;

const start = () => {
  if (emailWorker) return emailWorker;

  emailWorker = new Worker(
    "email",
    async (job) => {
      const { to, subject, html } = job.data;
      console.log("[EmailWorker] Processing job", { jobId: job.id, to, subject });
      logger.info(ctx, `Processing job ${job.id}`, `Sending email to ${to}`);

      try {
        await sendMail({ to, subject, html });
        console.log("[EmailWorker] Job completed", { jobId: job.id, to });
        logger.info(ctx, `Job ${job.id} completed`, `Email sent to ${to}`);
      } catch (error) {
        console.error("Email Send Error:", error);
        throw error;
      }
    },
    {
      connection: getConnection(),
      concurrency: 5,
    },
  );

  emailWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, "email.worker");
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, "email.worker", err.message);
  });

  emailWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "email.worker", err.message);
  });

  logger.info(ctx, "Email worker started", "email.worker");

  return emailWorker;
};

const stop = async () => {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info(ctx, "Email worker stopped", "email.worker");
  }
};

module.exports = { start, stop };
