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

  const migrationPath = path.join(
    __dirname,
    "src/migrations/028_headline_position.sql",
  );
  await client.query(fs.readFileSync(migrationPath, "utf8"));
  console.log("OK: migration 028_headline_position.sql");

  const result = await client.query(`
    SELECT headline_position, COUNT(*)::int AS n
    FROM articles
    WHERE deleted_at IS NULL AND headline_position IS NOT NULL
    GROUP BY headline_position
    ORDER BY headline_position
  `);
  console.log("headline positions:", result.rows);

  await client.end();
}

main().catch((error) => {
  console.error("migrate-headline-position failed:", error.message);
  process.exit(1);
});
