const { Worker } = require("bullmq");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("../databases/redis/connection");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const { translateArticle } = require("../../services/aiTranslation");
const { COLUMN_TRANSLATION_QUEUE_NAME } = require("./column-translation.queue");
const logger = require("../utils/logger");

const ctx = "ColumnTranslationWorker";

let translationWorker = null;
const db = new DB(config.get("/postgresqlUrl"));

const generateSlug = (title) => {
  const base = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base || "column"}-${uuidv4().split("-")[0]}`;
};

function getDb() {
  return db;
}

async function markJob(db, jobId, fields) {
  const sets = [];
  const values = [];
  let idx = 1;
  for (const [col, val] of Object.entries(fields)) {
    sets.push(`${col} = $${idx}`);
    values.push(val);
    idx += 1;
  }
  values.push(jobId);
  await db.executeQuery(
    `UPDATE column_translation_jobs SET ${sets.join(", ")} WHERE id = $${idx}`,
    values,
  );
}

async function setColumnTranslationStatus(db, columnId, status) {
  await db.executeQuery(
    `UPDATE "columns"
     SET translation_status = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL`,
    [status, columnId],
  );
}

async function applyTranslations(db, columnId, result) {
  const en = result?.en || {};
  const uz = result?.uz || {};
  await db.executeQuery(
    `UPDATE "columns" SET
       title_en = $1, slug_en = $2, summary_en = $3, content_en = $4,
       title_uz = $5, slug_uz = $6, summary_uz = $7, content_uz = $8,
       translation_status = 'ready',
       updated_at = NOW()
     WHERE id = $9 AND deleted_at IS NULL`,
    [
      en.title || null,
      en.title ? generateSlug(en.title) : null,
      en.summary != null && String(en.summary).trim() ? String(en.summary).trim() : null,
      en.content || null,
      uz.title || null,
      uz.title ? generateSlug(uz.title) : null,
      uz.summary != null && String(uz.summary).trim() ? String(uz.summary).trim() : null,
      uz.content || null,
      columnId,
    ],
  );
}

async function processTranslationJob(job) {
  const { jobId, columnId } = job.data || {};
  const db = getDb();

  await markJob(db, jobId, {
    job_status: "processing",
    started_at: new Date(),
    bull_job_id: String(job.id),
  });
  await setColumnTranslationStatus(db, columnId, "processing");

  const columnResult = await db.executeQuery(
    `SELECT id, title, content, summary, status,
            title_en, content_en, summary_en, title_uz, content_uz, summary_uz
     FROM "columns"
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [columnId],
  );
  const column = columnResult?.rows?.[0];
  if (!column) {
    throw new Error("Column not found");
  }

  const needSummary = Boolean(column.summary?.trim());
  const hasEn =
    column.title_en?.trim() &&
    column.content_en?.trim() &&
    (!needSummary || column.summary_en?.trim());
  const hasUz =
    column.title_uz?.trim() &&
    column.content_uz?.trim() &&
    (!needSummary || column.summary_uz?.trim());
  if (hasEn && hasUz) {
    await setColumnTranslationStatus(db, columnId, "ready");
    await markJob(db, jobId, {
      job_status: "succeeded",
      finished_at: new Date(),
      error_message: null,
    });
    return { skippedAi: true };
  }

  const aiResult = await translateArticle(
    column.title,
    column.content,
    column.summary || "",
  );
  if (aiResult.status !== "success" || !aiResult.result?.en || !aiResult.result?.uz) {
    const message =
      aiResult.meta?.error ||
      (aiResult.status === "invalid_input"
        ? "AI translation invalid input"
        : "AI translation failed");
    await setColumnTranslationStatus(db, columnId, "failed");
    await markJob(db, jobId, {
      job_status: "failed",
      finished_at: new Date(),
      error_message: message,
    });
    throw new Error(message);
  }

  await applyTranslations(db, columnId, aiResult.result);
  await markJob(db, jobId, {
    job_status: "succeeded",
    finished_at: new Date(),
    error_message: null,
  });
  return { ok: true };
}

const start = () => {
  if (translationWorker) return translationWorker;

  translationWorker = new Worker(
    COLUMN_TRANSLATION_QUEUE_NAME,
    async (job) => processTranslationJob(job),
    {
      connection: getConnection(),
      concurrency: 2,
    },
  );

  translationWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, "column-translation.worker");
  });

  translationWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, "column-translation.worker", err.message);
  });

  translationWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "column-translation.worker", err.message);
  });

  logger.info(ctx, "Column translation worker started", "column-translation.worker");
  return translationWorker;
};

const stop = async () => {
  if (translationWorker) {
    await translationWorker.close();
    translationWorker = null;
    logger.info(ctx, "Column translation worker stopped", "column-translation.worker");
  }
};

module.exports = { start, stop, processTranslationJob };
