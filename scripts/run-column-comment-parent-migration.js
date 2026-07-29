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
    path.join(rootDir, "src/migrations/021_column_comment_parent_id.sql"),
    "utf8",
  );
  await client.query(migration);
  console.log("migration 021_column_comment_parent_id OK");

  const column = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'column_comments'
      AND column_name = 'parent_id'
  `);
  console.log("parent_id column present:", column.rows.length > 0);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
