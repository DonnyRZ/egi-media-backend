const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const connectionString = process.env.POSTGRESQL_URL;
  if (!connectionString) {
    throw new Error("POSTGRESQL_URL is not set");
  }

  const client = new Client({ connectionString });
  await client.connect();

  const migrationPath = path.join(
    __dirname,
    "..",
    "src/migrations/031_youtube_video_review.sql",
  );
  const sql = fs.readFileSync(migrationPath, "utf8");
  await client.query(sql);

  const columns = await client.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'youtube_videos'
      AND column_name IN ('author_id', 'status')
    ORDER BY column_name;
  `);

  console.log("migration 031_youtube_video_review OK");
  console.log(
    "youtube_videos columns:",
    columns.rows.map((row) => row.column_name).join(", "),
  );

  await client.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
