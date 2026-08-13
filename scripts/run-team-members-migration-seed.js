const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

async function main() {
  const client = new Client({ connectionString: process.env.POSTGRESQL_URL });
  await client.connect();

  const migration = fs.readFileSync(
    path.join(__dirname, "..", "src/migrations/023_create_team_members.sql"),
    "utf8",
  );
  await client.query(migration);
  console.log("migration 023_create_team_members OK");

  const seed = fs.readFileSync(
    path.join(__dirname, "..", "src/seeds/031_team_member_seed.sql"),
    "utf8",
  );
  await client.query(seed);
  console.log("seed 031_team_member_seed OK");

  const count = await client.query(
    "SELECT COUNT(*)::int AS n FROM team_members",
  );
  console.log("team_members count:", count.rows[0].n);

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
