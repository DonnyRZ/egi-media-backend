// Explicit target + checksum + transaction. The migration only adds metadata tables.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { Client } = require("pg");
const config = require("../src/config/global_config");

async function main() {
  const expected = process.argv.find((arg) => arg.startsWith("--expect-database="))?.split("=")[1];
  if (!expected) throw new Error("Pass --expect-database=<exact database name>");

  const source = fs.readFileSync(
    path.join(__dirname, "../src/migrations/033_category_ai_translations.sql"),
    "utf8",
  );
  const checksum = crypto.createHash("sha256").update(source).digest("hex");
  const client = new Client({ connectionString: config.get("/postgresqlUrl") });
  await client.connect();

  try {
    const database = (await client.query("SELECT current_database() AS name")).rows[0]?.name;
    if (database !== expected) throw new Error(`Database target mismatch: expected ${expected}, got ${database}`);
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout='10s'; SET LOCAL statement_timeout='120s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('egi.editorial.migrations'))");
    await client.query(`
      CREATE TABLE IF NOT EXISTS editorial_schema_migrations (
        version text PRIMARY KEY,
        checksum text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const version = "033_category_ai_translations";
    const previous = await client.query(
      "SELECT checksum FROM editorial_schema_migrations WHERE version = $1",
      [version],
    );
    if (previous.rows.length) {
      if (previous.rows[0].checksum !== checksum) throw new Error("Migration checksum mismatch");
      await client.query("COMMIT");
      console.log(`${version} already applied; checksum matches`);
      return;
    }
    await client.query(source);
    await client.query(
      "INSERT INTO editorial_schema_migrations(version, checksum) VALUES ($1, $2)",
      [version, checksum],
    );
    await client.query("COMMIT");
    console.log(`${version} applied to ${expected}; checksum ${checksum}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message || error.code || error.name || "Category translation migration failed");
  process.exitCode = 1;
});
