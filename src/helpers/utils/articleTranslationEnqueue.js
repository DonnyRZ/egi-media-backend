const { v4: uuidv4 } = require("uuid");
const { addTranslationJob } = require("../queues/article-translation.queue");
const logger = require("./logger");

const ctx = "ArticleTranslationEnqueue";

function localesComplete(source) {
  if (!source) return false;
  const enTitle = source.title_en ?? source.en?.title;
  const enContent = source.content_en ?? source.en?.content;
  const uzTitle = source.title_uz ?? source.uz?.title;
  const uzContent = source.content_uz ?? source.uz?.content;
  return Boolean(
    enTitle?.trim() &&
      enContent?.trim() &&
      uzTitle?.trim() &&
      uzContent?.trim(),
  );
}

/**
 * Persist a translation job and enqueue BullMQ work.
 * @returns {Promise<{ jobId: string, queued: boolean, ready: boolean, error?: string }>}
 */
async function enqueueArticleTranslation({
  db,
  articleId,
  requestedBy = null,
  targetStatus,
}) {
  const jobId = uuidv4();

  await db.executeQuery(
    `INSERT INTO article_translation_jobs (
       id, article_id, requested_by, target_status, job_status, created_at
     ) VALUES ($1, $2, $3, $4, 'queued', NOW())`,
    [jobId, articleId, requestedBy, targetStatus],
  );

  await db.executeQuery(
    `UPDATE articles
     SET translation_status = 'pending', updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [articleId],
  );

  try {
    const bullJob = await addTranslationJob({
      jobId,
      articleId,
      requestedBy,
      targetStatus,
    });
    if (bullJob?.id) {
      await db.executeQuery(
        `UPDATE article_translation_jobs
         SET bull_job_id = $1
         WHERE id = $2`,
        [String(bullJob.id), jobId],
      );
    }
    return { jobId, queued: true, ready: false };
  } catch (error) {
    logger.error(ctx, "enqueueArticleTranslation", "Queue failed", error);
    await db.executeQuery(
      `UPDATE article_translation_jobs
       SET job_status = 'failed',
           error_message = $1,
           finished_at = NOW()
       WHERE id = $2`,
      [error.message || "Queue unavailable", jobId],
    );
    await db.executeQuery(
      `UPDATE articles
       SET translation_status = 'failed', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [articleId],
    );
    return {
      jobId,
      queued: false,
      ready: false,
      error: error.message || "Queue unavailable",
    };
  }
}

module.exports = {
  localesComplete,
  enqueueArticleTranslation,
};
