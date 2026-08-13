const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const DATABASE_URL =
  process.env.POSTGRESQL_URL ||
  "postgresql://postgres:postgres@localhost:5432/egi_media";

async function main() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("connected to", DATABASE_URL.replace(/:[^:@/]+@/, ":***@"));

  const migrationPath = path.join(
    __dirname,
    "src/migrations/021_create_social_media_links.sql",
  );
  const seedPath = path.join(
    __dirname,
    "src/seeds/030_social_media_link_seed.sql",
  );

  const migrationSql = fs.readFileSync(migrationPath, "utf8");
  await client.query(migrationSql);
  console.log("OK: migration 021_create_social_media_links.sql");

  const seedSql = fs.readFileSync(seedPath, "utf8");
  await client.query(seedSql);
  console.log("OK: seed 030_social_media_link_seed.sql");

  const result = await client.query(
    "SELECT COUNT(*)::int AS n FROM social_media_links",
  );
  console.log(`success: social_media_links has ${result.rows[0].n} row(s)`);

  await client.end();
}

main().catch(async (error) => {
  console.error("migrate-social failed:", error.message);
  process.exit(1);
});
