const { Worker } = require("bullmq");
const { getConnection } = require("../databases/redis/connection");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const { translateCategory } = require("../../services/aiCategoryTranslation");
const { CATEGORY_TRANSLATION_QUEUE_NAME } = require("./category-translation.queue");
const { toSlug } = require("../../helpers/utils/slug");
const { isCategorySourceCurrent } = require("../../modules/category/repositories/commands/translation_plan");
const logger = require("../utils/logger");

const ctx = "CategoryTranslationWorker";
let translationWorker = null;
const db = new DB(config.get("/postgresqlUrl"));

async function markJob(database, jobId, fields) {
  const entries = Object.entries(fields);
  const values = entries.map(([, value]) => value);
  values.push(jobId);
  const setClauses = entries.map(([column], index) => `${column} = $${index + 1}`);
  await database.executeQuery(
    `UPDATE category_translation_jobs SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
    values,
  );
}

function fieldKeys(target) {
  const suffix = target.locale;
  return target.field === "name"
    ? { value: `name_${suffix}`, slug: `slug_${suffix}`, origin: "name_origin", source: "name_source_text" }
    : { value: `description_${suffix}`, origin: "description_origin", source: "description_source_text" };
}

async function setProcessing(database, job) {
  await database.executeQuery(
    `UPDATE category_translation_state s
     SET status = 'processing', last_error = NULL, updated_at = NOW()
     FROM categories c
     WHERE s.category_id = $1 AND s.locale = ANY($2::varchar[])
       AND s.category_id = c.id AND s.status IN ('pending', 'failed', 'processing')
       AND c.name = $3 AND COALESCE(c.description, '') = $4`,
    [job.categoryId, [...new Set(job.targets.map((target) => target.locale))], job.sourceName, job.sourceDescription],
  );
}

async function applyField(database, job, target, translated) {
  const keys = fieldKeys(target);
  const sourceText = target.field === "name" ? job.sourceName : job.sourceDescription;
  const generated = String(translated || "").trim();
  if (!generated) return false;

  const categorySet = target.field === "name"
    ? `${keys.value} = $1, ${keys.slug} = $2, updated_at = NOW()`
    : `${keys.value} = $1, updated_at = NOW()`;
  const categoryValues = target.field === "name"
    ? [generated, toSlug(generated) || null, job.categoryId, job.sourceName, job.sourceDescription, target.locale, sourceText]
    : [generated, job.categoryId, job.sourceName, job.sourceDescription, target.locale, sourceText];
  const sourceNameIndex = target.field === "name" ? 4 : 3;
  const sourceDescriptionIndex = target.field === "name" ? 5 : 4;
  const localeIndex = target.field === "name" ? 6 : 5;
  const sourceTextIndex = target.field === "name" ? 7 : 6;

  const sql = `WITH eligible AS (
      SELECT c.id
      FROM categories c
      JOIN category_translation_state s ON s.category_id = c.id
      WHERE c.id = $${target.field === "name" ? 3 : 2}
        AND c.name = $${sourceNameIndex}
        AND COALESCE(c.description, '') = $${sourceDescriptionIndex}
        AND s.locale = $${localeIndex}
        AND s.${keys.origin} = 'ai'
        AND s.${keys.source} = $${sourceTextIndex}
      FOR UPDATE OF c, s
    ), updated_category AS (
      UPDATE categories c SET ${categorySet}
      FROM eligible e
      WHERE c.id = e.id
      RETURNING c.id
    )
    UPDATE category_translation_state s
    SET ${keys.source} = $${sourceTextIndex}, updated_at = NOW()
    FROM updated_category u
    WHERE s.category_id = u.id AND s.locale = $${localeIndex}
    RETURNING s.category_id`;
  const result = await database.executeQuery(sql, categoryValues);
  return Boolean(result?.rowCount);
}

async function finishLocales(database, job, status, errorMessage = null) {
  const locales = [...new Set(job.targets.map((target) => target.locale))];
  for (const locale of locales) {
    const suffix = locale;
    await database.executeQuery(
      `UPDATE category_translation_state s
       SET status = CASE
             WHEN $5::text IS NOT NULL THEN 'failed'::article_translation_status
             WHEN NULLIF(BTRIM(c.name_${suffix}), '') IS NOT NULL
               AND (COALESCE(BTRIM(c.description), '') = '' OR NULLIF(BTRIM(c.description_${suffix}), '') IS NOT NULL)
               THEN 'ready'::article_translation_status
             WHEN s.status = 'pending' THEN 'pending'::article_translation_status
             ELSE 'failed'::article_translation_status
           END,
           last_error = $5,
           updated_at = NOW()
       FROM categories c
       WHERE s.category_id = $1 AND s.locale = $2 AND s.category_id = c.id
         AND c.name = $3 AND COALESCE(c.description, '') = $4
         AND (
           ($5::text IS NOT NULL AND s.status = $6)
           OR ($5::text IS NULL AND s.status IN ($6, 'pending', 'failed'))
         )`,
      [job.categoryId, locale, job.sourceName, job.sourceDescription, errorMessage, status],
    );
  }
}

async function processTranslationJob(bullJob) {
  const job = bullJob.data || {};
  const database = db;
  await markJob(database, job.jobId, {
    job_status: "processing",
    started_at: new Date(),
    bull_job_id: String(bullJob.id),
  });

  const current = await database.executeQuery(
    "SELECT id, name, description FROM categories WHERE id = $1 LIMIT 1",
    [job.categoryId],
  );
  const category = current?.rows?.[0];
  if (!category) throw new Error("Category not found");
  if (!isCategorySourceCurrent(job, category)) {
    await markJob(database, job.jobId, { job_status: "succeeded", error_message: "Superseded by newer category text", finished_at: new Date() });
    return { stale: true };
  }

  await setProcessing(database, job);
  let translated;
  try {
    translated = await translateCategory(job.sourceName, job.sourceDescription);
  } catch (error) {
    const message = error?.message || "AI category translation failed";
    await finishLocales(database, job, "processing", message);
    await markJob(database, job.jobId, { job_status: "failed", error_message: message, finished_at: new Date() });
    throw error;
  }
  if (translated.status !== "success") {
    const message = translated.meta?.error || "AI category translation failed";
    await finishLocales(database, job, "processing", message);
    await markJob(database, job.jobId, { job_status: "failed", error_message: message, finished_at: new Date() });
    throw new Error(message);
  }

  for (const target of job.targets) {
    const value = translated.result?.[target.locale]?.[target.field];
    await applyField(database, job, target, value);
  }
  await finishLocales(database, job, "processing");
  await markJob(database, job.jobId, { job_status: "succeeded", error_message: null, finished_at: new Date() });
  return { ok: true };
}

const start = () => {
  if (translationWorker) return translationWorker;
  translationWorker = new Worker(
    CATEGORY_TRANSLATION_QUEUE_NAME,
    processTranslationJob,
    { connection: getConnection(), concurrency: 2 },
  );
  translationWorker.on("completed", (job) => logger.info(ctx, `Job ${job.id} succeeded`, "category-translation.worker"));
  translationWorker.on("failed", (job, error) => logger.error(ctx, `Job ${job?.id} failed`, "category-translation.worker", error.message));
  translationWorker.on("error", (error) => logger.error(ctx, "Worker error", "category-translation.worker", error.message));
  logger.info(ctx, "Category translation worker started", "category-translation.worker");
  return translationWorker;
};

const stop = async () => {
  if (!translationWorker) return;
  await translationWorker.close();
  translationWorker = null;
  logger.info(ctx, "Category translation worker stopped", "category-translation.worker");
};

module.exports = { start, stop, processTranslationJob, applyField, finishLocales };
