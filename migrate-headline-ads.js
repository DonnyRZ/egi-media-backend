const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const DATABASE_URL =
  process.env.POSTGRESQL_URL ||
  "postgresql://postgres:postgres@localhost:5432/egi_media";

async function runFile(client, relativePath) {
  const fullPath = path.join(__dirname, relativePath);
  await client.query(fs.readFileSync(fullPath, "utf8"));
  console.log("OK:", relativePath);
}

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("connected to", DATABASE_URL.replace(/:[^:@/]+@/, ":***@"));

  await runFile(client, "src/migrations/026_add_headline_sort_order.sql");
  await runFile(client, "src/migrations/027_streamline_ads_placements.sql");

  const headlines = await client.query(`
    SELECT COUNT(*)::int AS n
    FROM articles
    WHERE deleted_at IS NULL AND 'headline' = ANY(placements)
  `);
  console.log("headline articles:", headlines.rows[0]?.n ?? 0);

  const ads = await client.query(
    "SELECT placement, COUNT(*)::int AS n FROM ads GROUP BY placement ORDER BY placement",
  );
  console.log("ads by placement:", ads.rows);

  await client.end();
}

main().catch((error) => {
  console.error("migrate-headline-ads failed:", error.message);
  process.exit(1);
});
