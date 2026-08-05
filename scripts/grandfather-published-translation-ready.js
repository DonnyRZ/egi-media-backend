const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const url = fs
  .readFileSync(path.join(__dirname, "../.env"), "utf8")
  .match(/^POSTGRESQL_URL=(.+)$/m)[1]
  .trim();

(async () => {
  const c = new Client({ connectionString: url });
  await c.connect();
  await c.query(`
    UPDATE articles
    SET translation_status = 'ready'
    WHERE deleted_at IS NULL AND status = 'published'
  `);
  const r = await c.query(`
    SELECT translation_status::text AS status, COUNT(*)::int AS n
    FROM articles
    WHERE deleted_at IS NULL
    GROUP BY translation_status
    ORDER BY 1
  `);
  console.log(r.rows);
  await c.end();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
