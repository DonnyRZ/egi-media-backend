#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const rootDir = path.join(__dirname, "..");

function loadEnvUrl() {
  const envPath = path.join(rootDir, ".env");
  const match = fs.readFileSync(envPath, "utf8").match(/^POSTGRESQL_URL=(.+)$/m);
  if (!match) throw new Error("POSTGRESQL_URL not found in .env");
  return match[1].trim();
}

async function main() {
  const client = new Client({ connectionString: loadEnvUrl() });
  await client.connect();
  const sql = fs.readFileSync(
    path.join(rootDir, "src/migrations/022_article_translation_jobs.sql"),
    "utf8",
  );
  await client.query(sql);
  const counts = await client.query(`
    SELECT translation_status::text AS status, COUNT(*)::int AS n
    FROM articles
    WHERE deleted_at IS NULL
    GROUP BY translation_status
    ORDER BY translation_status
  `);
  console.log("migration 022 OK", counts.rows);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
