const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const match = fs.readFileSync(envPath, "utf8").match(/^POSTGRESQL_URL=(.+)$/m);
if (!match) throw new Error("POSTGRESQL_URL not found in .env");

async function main() {
  const client = new Client({ connectionString: match[1].trim() });
  await client.connect();
  const migration = fs.readFileSync(
    path.join(rootDir, "src/migrations/018_taxonomy_hierarchy.sql"),
    "utf8"
  );
  await client.query(migration);
  console.log("migration 018_taxonomy_hierarchy OK");

  const topics = await client.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(category_id)::int AS with_category
    FROM topics
  `);
  const series = await client.query(`
    SELECT COUNT(*)::int AS total,
           COUNT(topic_id)::int AS with_topic
    FROM series
  `);
  console.log("topics:", topics.rows[0]);
  console.log("series:", series.rows[0]);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
