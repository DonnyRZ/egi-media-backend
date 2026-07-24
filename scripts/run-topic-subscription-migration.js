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
    path.join(rootDir, "src/migrations/017_create_user_topic_subscriptions.sql"),
    "utf8"
  );
  await client.query(migration);
  console.log("migration 017_create_user_topic_subscriptions OK");

  const tables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ('topic_followers', 'user_topic_subscriptions')
    ORDER BY table_name
  `);
  console.log("tables:", tables.rows);

  const count = await client.query(
    "SELECT COUNT(*)::int AS n FROM user_topic_subscriptions"
  );
  console.log("subscription rows:", count.rows[0].n);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
