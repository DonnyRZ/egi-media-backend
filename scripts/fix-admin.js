const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { Client } = require("pg");
const {
  encrypt,
  decrypt,
  emailLookupCandidates,
} = require("../src/helpers/utils/crypto_helper");
const {
  generateHash,
  compareHash,
} = require("../src/helpers/utils/hash_helper");

const ADMIN_ID = "00000000-0000-4000-8000-000000000099";
const ADMIN_EMAIL = "superadmin@egimedia.com";
const ADMIN_PASSWORD = "SuperAdmin@123";
const ADMIN_ROLE = "superadmin";
const ADMIN_NAME = "Super Admin";

async function findAdmin(client, encryptedEmail) {
  const candidates = emailLookupCandidates(ADMIN_EMAIL);
  const result = await client.query(
    `
    SELECT id, email, role, password_hash, email_verified_at, deleted_at
    FROM users
    WHERE id = $1
       OR email = ANY($2::text[])
       OR email = $3
    ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [ADMIN_ID, candidates, encryptedEmail],
  );
  return result.rows[0] ?? null;
}

async function main() {
  const connectionString = process.env.POSTGRESQL_URL;
  if (!connectionString) {
    throw new Error("POSTGRESQL_URL is missing from .env");
  }
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is missing from .env");
  }

  const encryptedEmail = encrypt(ADMIN_EMAIL);
  const passwordHash = await generateHash(ADMIN_PASSWORD);

  const client = new Client({ connectionString });
  await client.connect();

  try {
    const existing = await findAdmin(client, encryptedEmail);

    if (existing) {
      await client.query(
        `
        UPDATE users
        SET email = $1,
            password_hash = $2,
            full_name = $3,
            role = $4::user_role,
            login_provider = 'email',
            email_verified_at = COALESCE(email_verified_at, NOW()),
            deleted_at = NULL,
            updated_at = NOW()
        WHERE id = $5
        `,
        [encryptedEmail, passwordHash, ADMIN_NAME, ADMIN_ROLE, existing.id],
      );
      console.log(`updated existing admin id=${existing.id}`);
    } else {
      await client.query(
        `
        INSERT INTO users (
          id, email, password_hash, full_name, role,
          login_provider, email_verified_at, last_login_at,
          created_at, updated_at, deleted_at
        )
        VALUES (
          $1, $2, $3, $4, $5::user_role,
          'email', NOW(), NULL,
          NOW(), NOW(), NULL
        )
        `,
        [ADMIN_ID, encryptedEmail, passwordHash, ADMIN_NAME, ADMIN_ROLE],
      );
      console.log(`inserted admin id=${ADMIN_ID}`);
    }

    const verify = await client.query(
      `
      SELECT id, email, role, password_hash, email_verified_at, deleted_at
      FROM users
      WHERE id = $1 OR email = $2
      LIMIT 1
      `,
      [existing?.id ?? ADMIN_ID, encryptedEmail],
    );
    const row = verify.rows[0];
    if (!row) {
      throw new Error("admin row not found after upsert");
    }

    const emailMatches = decrypt(row.email) === ADMIN_EMAIL;
    const passwordMatches = await compareHash(ADMIN_PASSWORD, row.password_hash);
    const roleMatches = row.role === ADMIN_ROLE;
    const verified = row.email_verified_at != null;
    const active = row.deleted_at == null;

    if (!emailMatches || !passwordMatches || !roleMatches || !verified || !active) {
      throw new Error(
        `verification failed email=${emailMatches} password=${passwordMatches} role=${roleMatches} verified=${verified} active=${active}`,
      );
    }

    console.log("success: superadmin@egimedia.com is ready with role superadmin");
  } finally {
    await client.end();
    console.log("database connection closed");
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
