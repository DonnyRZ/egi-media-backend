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

  const runMigration = process.argv.includes("--migrate");
  if (runMigration) {
    const migration = fs.readFileSync(
      path.join(rootDir, "src/migrations/014_create_columns.sql"),
      "utf8",
    );
    await client.query(migration);
    console.log("migration 014_create_columns OK");
  }

  // Members are required FK authors for column fixtures.
  const memberSeed = fs.readFileSync(
    path.join(rootDir, "src/seeds/011_member_user_seed.sql"),
    "utf8",
  );
  await client.query(memberSeed);
  console.log("seed 011_member_user_seed OK");

  const seed = fs.readFileSync(
    path.join(rootDir, "src/seeds/029_column_seed.sql"),
    "utf8",
  );
  await client.query(seed);
  console.log("seed 029_column_seed OK");

  const counts = await client.query(
    'SELECT status, COUNT(*)::int AS n FROM "columns" GROUP BY status ORDER BY status',
  );
  console.log("column status counts:", counts.rows);

  const engagement = await client.query(`
    SELECT
      (SELECT COUNT(*)::int FROM column_views) AS views,
      (SELECT COUNT(*)::int FROM column_shares) AS shares,
      (SELECT COUNT(*)::int FROM saved_columns) AS saves,
      (SELECT COUNT(*)::int FROM column_comments WHERE deleted_at IS NULL) AS comments
  `);
  console.log("engagement:", engagement.rows[0]);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
