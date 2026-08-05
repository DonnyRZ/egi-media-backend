const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const logger = require("../utils/logger");

const TRANSLATION_QUEUE_NAME = "article-translation";
const ctx = "ArticleTranslationQueue";
const QUEUE_ADD_TIMEOUT_MS = 3000;

const translationQueue = new Queue(TRANSLATION_QUEUE_NAME, {
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
 * @param {{ jobId: string, articleId: string, requestedBy?: string|null, targetStatus: string }} data
 * @param {import("bullmq").JobsOptions} [opts]
 */
const addTranslationJob = async (data, opts = {}) => {
  const connection = getConnection();
  const redisReady = connection?.status === "ready";

  if (!redisReady) {
    logger.error(ctx, "addTranslationJob", "Redis unavailable", {
      status: connection?.status,
      articleId: data?.articleId,
    });
    const err = new Error("Translation queue unavailable (Redis down)");
    err.code = "TRANSLATION_QUEUE_UNAVAILABLE";
    throw err;
  }

  try {
    const job = await withTimeout(
      translationQueue.add("translate-article", data, {
        jobId: data.jobId,
        ...opts,
      }),
      QUEUE_ADD_TIMEOUT_MS,
      "Translation queue add timed out",
    );
    logger.info(ctx, "addTranslationJob", "Job queued", {
      articleId: data.articleId,
      jobId: job?.id,
    });
    return job;
  } catch (error) {
    logger.error(ctx, "addTranslationJob", "Failed to enqueue", error);
    throw error;
  }
};

module.exports = {
  TRANSLATION_QUEUE_NAME,
  translationQueue,
  addTranslationJob,
};
