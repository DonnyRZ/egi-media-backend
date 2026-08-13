const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRESQL_URL });
  await client.connect();

  const migration = fs.readFileSync(
    path.join(__dirname, "..", "src/migrations/021_create_social_media_links.sql"),
    "utf8",
  );
  await client.query(migration);
  console.log("migration 021_create_social_media_links OK");

  const seed = fs.readFileSync(
    path.join(__dirname, "..", "src/seeds/030_social_media_link_seed.sql"),
    "utf8",
  );
  await client.query(seed);
  console.log("seed 030_social_media_link_seed OK");

  const count = await client.query(
    "SELECT COUNT(*)::int AS n FROM social_media_links",
  );
  console.log("social_media_links count:", count.rows[0].n);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
