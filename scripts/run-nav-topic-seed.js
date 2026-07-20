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
    path.join(rootDir, "src/seeds/026_nav_topic_seed.sql"),
    "utf8",
  );
  await client.query(sql);
  const topics = await client.query(
    `SELECT slug, name, name_en
     FROM topics
     WHERE slug IN ('business', 'technology', 'politics', 'egi-news')
     ORDER BY slug`,
  );
  const counts = await client.query(
    `SELECT t.slug, COUNT(at.article_id)::int AS articles
     FROM topics t
     LEFT JOIN article_topics at ON at.topic_id = t.id
     WHERE t.slug IN ('business', 'technology', 'politics', 'egi-news')
     GROUP BY t.slug
     ORDER BY t.slug`,
  );
  console.log("topics:", topics.rows);
  console.log("article counts:", counts.rows);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
