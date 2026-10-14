const { Queue } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const logger = require("../utils/logger");

const CATEGORY_TRANSLATION_QUEUE_NAME = "category-translation";
const QUEUE_ADD_TIMEOUT_MS = 3000;
const ctx = "CategoryTranslationQueue";

const categoryTranslationQueue = new Queue(CATEGORY_TRANSLATION_QUEUE_NAME, {
  connection: getConnection(),
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 8000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

async function addCategoryTranslationJob(data) {
  const connection = getConnection();
  if (connection?.status !== "ready") {
    logger.error(ctx, "addCategoryTranslationJob", "Redis unavailable", {
      status: connection?.status,
      categoryId: data?.categoryId,
    });
    const error = new Error("Translation queue unavailable (Redis down)");
    error.code = "TRANSLATION_QUEUE_UNAVAILABLE";
    throw error;
  }
  let timeout;
  try {
    return await Promise.race([
      categoryTranslationQueue.add("translate-category", data, { jobId: data.jobId }),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Translation queue add timed out")), QUEUE_ADD_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    logger.error(ctx, "addCategoryTranslationJob", "Failed to enqueue", error);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = {
  CATEGORY_TRANSLATION_QUEUE_NAME,
  categoryTranslationQueue,
  addCategoryTranslationJob,
};
