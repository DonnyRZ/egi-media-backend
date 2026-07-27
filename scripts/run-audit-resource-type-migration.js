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
    path.join(rootDir, "src/migrations/020_add_audit_log_resource_type.sql"),
    "utf8"
  );
  await client.query(migration);

  const stats = await client.query(`
    SELECT resource_type, COUNT(*)::int AS total
    FROM audit_logs
    GROUP BY resource_type
    ORDER BY total DESC
  `);
  console.log("migration 020_add_audit_log_resource_type OK");
  console.log(stats.rows);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
