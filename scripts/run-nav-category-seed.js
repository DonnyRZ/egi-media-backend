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
  const sql = fs.readFileSync(
    path.join(rootDir, "src/seeds/027_nav_category_seed.sql"),
    "utf8",
  );
  await client.query(sql);
  const categories = await client.query(
    `SELECT slug, name, name_en
     FROM categories
     WHERE slug IN ('business', 'technology', 'politics', 'egi-news')
     ORDER BY slug`,
  );
  const counts = await client.query(
    `SELECT c.slug, COUNT(a.id)::int AS articles
     FROM categories c
     LEFT JOIN articles a
       ON a.category_id = c.id
      AND a.status = 'published'
      AND a.deleted_at IS NULL
     WHERE c.slug IN ('business', 'technology', 'politics', 'egi-news')
     GROUP BY c.slug
     ORDER BY c.slug`,
  );
  console.log("categories:", categories.rows);
  console.log("article counts:", counts.rows);
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
