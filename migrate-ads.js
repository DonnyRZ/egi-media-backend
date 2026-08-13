const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const DATABASE_URL =
  process.env.POSTGRESQL_URL ||
  "postgresql://postgres:postgres@localhost:5432/egi_media";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("connected to", DATABASE_URL.replace(/:[^:@/]+@/, ":***@"));

  const migrationPath = path.join(__dirname, "src/migrations/024_create_ads.sql");
  const seedPath = path.join(__dirname, "src/seeds/032_ads_seed.sql");

  await client.query(fs.readFileSync(migrationPath, "utf8"));
  console.log("OK: migration 024_create_ads.sql");

  await client.query(fs.readFileSync(seedPath, "utf8"));
  console.log("OK: seed 032_ads_seed.sql");

  const result = await client.query(
    "SELECT placement, COUNT(*)::int AS n FROM ads GROUP BY placement ORDER BY placement",
  );
  console.log("ads by placement:", result.rows);

  await client.end();
}

main().catch((error) => {
  console.error("migrate-ads failed:", error.message);
  process.exit(1);
});
