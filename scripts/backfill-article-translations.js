#!/usr/bin/env node
/**
 * Backfill EN/UZ translations for articles missing locale fields.
 * Uses the same BullMQ enqueue path as publish/retry.
 *
 * Usage (from backend root, with .env loaded by app deps):
 *   node scripts/backfill-article-translations.js
 *   node scripts/backfill-article-translations.js --dry-run
 *   node scripts/backfill-article-translations.js --limit=20
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const {
  enqueueArticleTranslation,
} = require("../src/helpers/utils/articleTranslationEnqueue");

const rootDir = path.join(__dirname, "..");

function loadEnvUrl() {
  const envPath = path.join(rootDir, ".env");
  const match = fs.readFileSync(envPath, "utf8").match(/^POSTGRESQL_URL=(.+)$/m);
  if (!match) throw new Error("POSTGRESQL_URL not found in .env");
  return match[1].trim();
}

function parseArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const limitArg = argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.split("=")[1]) : null;
  const statusArg = argv.find((a) => a.startsWith("--status="));
  // Default: final statuses that appear (or will appear) on news / schedule.
  const statuses = statusArg
    ? statusArg.split("=")[1].split(",").map((s) => s.trim())
    : ["published", "scheduled"];
  return { dryRun, limit, statuses };
}

async function main() {
  const { dryRun, limit, statuses } = parseArgs(process.argv.slice(2));
  const client = new Client({ connectionString: loadEnvUrl() });
  await client.connect();

  // Minimal db adapter matching enqueue helper expectations.
  const db = {
    executeQuery: (text, values) => client.query(text, values),
  };

  const statusPlaceholders = statuses.map((_, i) => `$${i + 1}`).join(", ");
  const sql = `
    SELECT id, title, status, translation_status,
           title_en, content_en, summary_en,
           title_uz, content_uz, summary_uz,
           summary
    FROM articles
    WHERE deleted_at IS NULL
      AND status IN (${statusPlaceholders})
      AND (
        title_en IS NULL OR btrim(title_en) = '' OR
        content_en IS NULL OR btrim(content_en) = '' OR
        title_uz IS NULL OR btrim(title_uz) = '' OR
        content_uz IS NULL OR btrim(content_uz) = '' OR
        (
          summary IS NOT NULL AND btrim(summary) <> '' AND (
            summary_en IS NULL OR btrim(summary_en) = '' OR
            summary_uz IS NULL OR btrim(summary_uz) = ''
          )
        )
      )
    ORDER BY published_at DESC NULLS LAST, created_at DESC
    ${limit ? `LIMIT ${Number(limit)}` : ""}
  `;

  const result = await client.query(sql, statuses);
  const rows = result.rows;
  console.log(
    JSON.stringify({
      found: rows.length,
      dryRun,
      statuses,
      sample: rows.slice(0, 5).map((r) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        translation_status: r.translation_status,
      })),
    }),
  );

  if (dryRun) {
    await client.end();
    return;
  }

  let queued = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const out = await enqueueArticleTranslation({
        db,
        articleId: row.id,
        requestedBy: null,
        targetStatus: row.status === "scheduled" ? "scheduled" : "published",
      });
      if (out.queued) {
        queued += 1;
        console.log("queued", row.id, row.title?.slice(0, 60));
      } else {
        failed += 1;
        console.error("enqueue_failed", row.id, out.error);
      }
    } catch (error) {
      failed += 1;
      console.error("enqueue_error", row.id, error.message);
    }
  }

  console.log(JSON.stringify({ queued, failed, total: rows.length }));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
