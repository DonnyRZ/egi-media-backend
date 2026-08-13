const { v4: uuidv4 } = require("uuid");
const { addColumnTranslationJob } = require("../queues/column-translation.queue");
const logger = require("./logger");

const ctx = "ColumnTranslationEnqueue";

function localesComplete(source) {
  if (!source) return false;
  const enTitle = source.title_en ?? source.en?.title;
  const enContent = source.content_en ?? source.en?.content;
  const enSummary = source.summary_en ?? source.en?.summary;
  const uzTitle = source.title_uz ?? source.uz?.title;
  const uzContent = source.content_uz ?? source.uz?.content;
  const uzSummary = source.summary_uz ?? source.uz?.summary;
  const sourceSummary = source.summary ?? "";
  const needSummary = Boolean(String(sourceSummary).trim());

  const coreReady = Boolean(
    enTitle?.trim() &&
      enContent?.trim() &&
      uzTitle?.trim() &&
      uzContent?.trim(),
  );
  if (!coreReady) return false;
  if (!needSummary) return true;
  return Boolean(enSummary?.trim() && uzSummary?.trim());
}

/**
 * Persist a translation job and enqueue BullMQ work.
 * @returns {Promise<{ jobId: string, queued: boolean, ready: boolean, error?: string }>}
 */
async function enqueueColumnTranslation({
  db,
  columnId,
  requestedBy = null,
  targetStatus = "published",
}) {
  const jobId = uuidv4();

  await db.executeQuery(
    `INSERT INTO column_translation_jobs (
       id, column_id, requested_by, target_status, job_status, created_at
     ) VALUES ($1, $2, $3, $4, 'queued', NOW())`,
    [jobId, columnId, requestedBy, targetStatus],
  );

  await db.executeQuery(
    `UPDATE "columns"
     SET translation_status = 'pending', updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL`,
    [columnId],
  );

  try {
    const bullJob = await addColumnTranslationJob({
      jobId,
      columnId,
      requestedBy,
      targetStatus,
    });
    if (bullJob?.id) {
      await db.executeQuery(
        `UPDATE column_translation_jobs
         SET bull_job_id = $1
         WHERE id = $2`,
        [String(bullJob.id), jobId],
      );
    }
    return { jobId, queued: true, ready: false };
  } catch (error) {
    logger.error(ctx, "enqueueColumnTranslation", "Queue failed", error);
    await db.executeQuery(
      `UPDATE column_translation_jobs
       SET job_status = 'failed',
           error_message = $1,
           finished_at = NOW()
       WHERE id = $2`,
      [error.message || "Queue unavailable", jobId],
    );
    await db.executeQuery(
      `UPDATE "columns"
       SET translation_status = 'failed', updated_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL`,
      [columnId],
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
  enqueueColumnTranslation,
};
