const { Worker } = require("bullmq");
const { v4: uuidv4 } = require("uuid");
const { getConnection } = require("../databases/redis/connection");
const config = require("../../config/global_config");
const DB = require("../databases/postgresql/db");
const { translateArticle } = require("../../services/aiTranslation");
const { notifyTopicSubscribersOnPublish } = require("../utils/topicPublishNotifier");
const { TRANSLATION_QUEUE_NAME } = require("./article-translation.queue");
const logger = require("../utils/logger");

const ctx = "ArticleTranslationWorker";
const PROMOTE_INTERVAL_MS = 45_000;

let translationWorker = null;
let promoteTimer = null;
const db = new DB(config.get("/postgresqlUrl"));

const generateSlug = (title) => {
  const base = String(title || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base || "article"}-${uuidv4().split("-")[0]}`;
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
    `UPDATE article_translation_jobs SET ${sets.join(", ")} WHERE id = $${idx}`,
    values,
  );
}

async function setArticleTranslationStatus(db, articleId, status) {
  await db.executeQuery(
    `UPDATE articles
     SET translation_status = $1, updated_at = NOW()
     WHERE id = $2 AND deleted_at IS NULL`,
    [status, articleId],
  );
}

async function applyTranslations(db, articleId, result) {
  const en = result?.en || {};
  const uz = result?.uz || {};
  await db.executeQuery(
    `UPDATE articles SET
       title_en = $1, slug_en = $2, summary_en = $3, content_en = $4,
       title_uz = $5, slug_uz = $6, summary_uz = $7, content_uz = $8,
       translation_status = 'ready',
       updated_at = NOW()
     WHERE id = $9 AND deleted_at IS NULL`,
    [
      en.title || null,
      en.title ? generateSlug(en.title) : null,
      en.summary ?? null,
      en.content || null,
      uz.title || null,
      uz.title ? generateSlug(uz.title) : null,
      uz.summary ?? null,
      uz.content || null,
      articleId,
    ],
  );
}

async function maybePromoteScheduled(db, articleId) {
  const result = await db.executeQuery(
    `UPDATE articles
     SET status = 'published', updated_at = NOW()
     WHERE id = $1
       AND deleted_at IS NULL
       AND status = 'scheduled'
       AND translation_status = 'ready'
       AND published_at IS NOT NULL
       AND published_at <= NOW()
     RETURNING id, title, slug, summary, featured_image`,
    [articleId],
  );
  if (result?.rowCount > 0) {
    const article = result.rows[0];
    void notifyTopicSubscribersOnPublish({ db, article });
    return true;
  }
  return false;
}

async function promoteDueScheduled(db) {
  const result = await db.executeQuery(
    `UPDATE articles
     SET status = 'published', updated_at = NOW()
     WHERE deleted_at IS NULL
       AND status = 'scheduled'
       AND translation_status = 'ready'
       AND published_at IS NOT NULL
       AND published_at <= NOW()
     RETURNING id, title, slug, summary, featured_image`,
  );
  const rows = result?.rows || [];
  for (const article of rows) {
    void notifyTopicSubscribersOnPublish({ db, article });
  }
  if (rows.length) {
    logger.info(ctx, "promoteDueScheduled", "Promoted scheduled articles", {
      count: rows.length,
    });
  }
}

async function processTranslationJob(job) {
  const { jobId, articleId, targetStatus } = job.data || {};
  const db = getDb();

  await markJob(db, jobId, {
    job_status: "processing",
    started_at: new Date(),
    bull_job_id: String(job.id),
  });
  await setArticleTranslationStatus(db, articleId, "processing");

  const articleResult = await db.executeQuery(
    `SELECT id, title, content, summary, slug, featured_image, status, published_at,
            title_en, content_en, summary_en, title_uz, content_uz, summary_uz
     FROM articles
     WHERE id = $1 AND deleted_at IS NULL
     LIMIT 1`,
    [articleId],
  );
  const article = articleResult?.rows?.[0];
  if (!article) {
    throw new Error("Article not found");
  }

  const hasEn = article.title_en?.trim() && article.content_en?.trim();
  const hasUz = article.title_uz?.trim() && article.content_uz?.trim();
  if (hasEn && hasUz) {
    await setArticleTranslationStatus(db, articleId, "ready");
    await markJob(db, jobId, {
      job_status: "succeeded",
      finished_at: new Date(),
      error_message: null,
    });
    if (targetStatus === "published" || article.status === "published") {
      void notifyTopicSubscribersOnPublish({ db, article });
    }
    await maybePromoteScheduled(db, articleId);
    return { skippedAi: true };
  }

  const aiResult = await translateArticle(article.title, article.content);
  if (aiResult.status !== "success" || !aiResult.result?.en || !aiResult.result?.uz) {
    const message =
      aiResult.meta?.error ||
      (aiResult.status === "invalid_input"
        ? "AI translation invalid input"
        : "AI translation failed");
    await setArticleTranslationStatus(db, articleId, "failed");
    await markJob(db, jobId, {
      job_status: "failed",
      finished_at: new Date(),
      error_message: message,
    });
    throw new Error(message);
  }

  await applyTranslations(db, articleId, aiResult.result);
  await markJob(db, jobId, {
    job_status: "succeeded",
    finished_at: new Date(),
    error_message: null,
  });

  const refreshed = await db.executeQuery(
    `SELECT id, title, slug, summary, featured_image, status, published_at, translation_status
     FROM articles WHERE id = $1 LIMIT 1`,
    [articleId],
  );
  const latest = refreshed?.rows?.[0];
  if (latest?.status === "published" && latest.translation_status === "ready") {
    void notifyTopicSubscribersOnPublish({ db, article: latest });
  }
  await maybePromoteScheduled(db, articleId);
  return { ok: true };
}

const start = () => {
  if (translationWorker) return translationWorker;

  translationWorker = new Worker(
    TRANSLATION_QUEUE_NAME,
    async (job) => processTranslationJob(job),
    {
      connection: getConnection(),
      concurrency: 2,
    },
  );

  translationWorker.on("completed", (job) => {
    logger.info(ctx, `Job ${job.id} succeeded`, "article-translation.worker");
  });

  translationWorker.on("failed", (job, err) => {
    logger.error(ctx, `Job ${job?.id} failed`, "article-translation.worker", err.message);
  });

  translationWorker.on("error", (err) => {
    logger.error(ctx, "Worker error", "article-translation.worker", err.message);
  });

  promoteTimer = setInterval(() => {
    try {
      const db = getDb();
      void promoteDueScheduled(db).catch((error) => {
        logger.error(ctx, "promoteDueScheduled", "Interval promote failed", error);
      });
    } catch (error) {
      logger.error(ctx, "promoteDueScheduled", "DB unavailable", error);
    }
  }, PROMOTE_INTERVAL_MS);
  if (typeof promoteTimer.unref === "function") promoteTimer.unref();

  logger.info(ctx, "Article translation worker started", "article-translation.worker");
  return translationWorker;
};

const stop = async () => {
  if (promoteTimer) {
    clearInterval(promoteTimer);
    promoteTimer = null;
  }
  if (translationWorker) {
    await translationWorker.close();
    translationWorker = null;
    logger.info(ctx, "Article translation worker stopped", "article-translation.worker");
  }
};

module.exports = { start, stop, processTranslationJob, promoteDueScheduled };
