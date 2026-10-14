const { randomUUID } = require("crypto");
const { addCategoryTranslationJob } = require("../queues/category-translation.queue");
const logger = require("./logger");

const ctx = "CategoryTranslationEnqueue";

async function enqueueCategoryTranslation({
  db,
  categoryId,
  requestedBy = null,
  sourceName,
  sourceDescription = "",
  targets,
}) {
  if (!Array.isArray(targets) || targets.length === 0) {
    return { queued: false, ready: true };
  }

  const jobId = randomUUID();
  const insert = await db.executeQuery(
    `INSERT INTO category_translation_jobs (
       id, category_id, requested_by, source_name, source_description, targets, job_status
     ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, 'queued')`,
    [jobId, categoryId, requestedBy, sourceName, sourceDescription, JSON.stringify(targets)],
  );
  if (!insert) {
    const message = "Unable to persist translation job";
    await db.executeQuery(
      `UPDATE category_translation_state
       SET status = 'failed', last_error = $1, updated_at = NOW()
       WHERE category_id = $2 AND locale = ANY($3::varchar[]) AND status = 'pending'`,
      [message, categoryId, [...new Set(targets.map((target) => target.locale))]],
    );
    logger.error(ctx, "enqueueCategoryTranslation", "Unable to persist translation job", { categoryId });
    return { jobId, queued: false, ready: false, error: message };
  }

  try {
    const bullJob = await addCategoryTranslationJob({
      jobId,
      categoryId,
      sourceName,
      sourceDescription,
      targets,
    });
    await db.executeQuery(
      "UPDATE category_translation_jobs SET bull_job_id = $1 WHERE id = $2",
      [String(bullJob.id), jobId],
    );
    return { jobId, queued: true, ready: false };
  } catch (error) {
    await db.executeQuery(
      `UPDATE category_translation_jobs
       SET job_status = 'failed', error_message = $1, finished_at = NOW()
       WHERE id = $2`,
      [error.message || "Translation queue unavailable", jobId],
    );
    await db.executeQuery(
      `UPDATE category_translation_state SET status = 'failed', last_error = $1, updated_at = NOW()
       WHERE category_id = $2 AND locale = ANY($3::varchar[]) AND status = 'pending'`,
      [error.message || "Translation queue unavailable", categoryId, [...new Set(targets.map((target) => target.locale))]],
    );
    logger.error(ctx, "enqueueCategoryTranslation", "Queue failed", {
      categoryId,
      jobId,
      code: error.code || null,
    });
    return { jobId, queued: false, ready: false, error: error.message || "Translation queue unavailable" };
  }
}

module.exports = { enqueueCategoryTranslation };
