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
    path.join(rootDir, "src/migrations/019_topic_subscription_on_delete_cascade.sql"),
    "utf8"
  );
  await client.query(migration);
  console.log("migration 019_topic_subscription_on_delete_cascade OK");

  const constraint = await client.query(`
    SELECT confdeltype
    FROM pg_constraint
    WHERE conname = 'user_topic_subscriptions_topic_id_fkey'
  `);
  console.log("topic_id FK delete action:", constraint.rows[0]?.confdeltype, "(c = cascade)");
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
