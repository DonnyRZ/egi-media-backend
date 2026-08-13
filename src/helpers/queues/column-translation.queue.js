const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const logger = require("../utils/logger");

const COLUMN_TRANSLATION_QUEUE_NAME = "column-translation";
const ctx = "ColumnTranslationQueue";
const QUEUE_ADD_TIMEOUT_MS = 3000;

const columnTranslationQueue = new Queue(COLUMN_TRANSLATION_QUEUE_NAME, {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "exponential",
      delay: 8000,
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
 * @param {{ jobId: string, columnId: string, requestedBy?: string|null, targetStatus: string }} data
 * @param {import("bullmq").JobsOptions} [opts]
 */
const addColumnTranslationJob = async (data, opts = {}) => {
  const connection = getConnection();
  const redisReady = connection?.status === "ready";

  if (!redisReady) {
    logger.error(ctx, "addColumnTranslationJob", "Redis unavailable", {
      status: connection?.status,
      columnId: data?.columnId,
    });
    const err = new Error("Translation queue unavailable (Redis down)");
    err.code = "TRANSLATION_QUEUE_UNAVAILABLE";
    throw err;
  }

  try {
    const job = await withTimeout(
      columnTranslationQueue.add("translate-column", data, {
        jobId: data.jobId,
        ...opts,
      }),
      QUEUE_ADD_TIMEOUT_MS,
      "Translation queue add timed out",
    );
    logger.info(ctx, "addColumnTranslationJob", "Job queued", {
      columnId: data.columnId,
      jobId: job?.id,
    });
    return job;
  } catch (error) {
    logger.error(ctx, "addColumnTranslationJob", "Failed to enqueue", error);
    throw error;
  }
};

module.exports = {
  COLUMN_TRANSLATION_QUEUE_NAME,
  columnTranslationQueue,
  addColumnTranslationJob,
};
