const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const { emailLookupCandidates } = require("../../../../helpers/utils/crypto_helper");
const ctx = "Auth-Query";

const usersCollection = "users";
const tokensCollection = "password_reset_tokens";

const USER_COLUMNS = `
  id,
  email,
  password_hash,
  full_name,
  role,
  login_provider,
  email_verified_at,
  last_login_at,
  created_at,
  updated_at
`;

class Query {
  constructor(db) {
    this.db = db;
  }

  /**
   * Resolve a user by email across storage formats:
   * encrypted with ENCRYPTION_KEY, legacy keys, or plaintext.
   */
  async findUserByEmail(email) {
    try {
      const candidates = emailLookupCandidates(email);
      if (candidates.length === 0) {
        return wrapper.error("Data Not Found Please Try Another Input");
      }

      const placeholders = candidates
        .map((_, index) => `$${index + 1}`)
        .join(", ");
      const sql = `
        SELECT ${USER_COLUMNS}
        FROM "${usersCollection}"
        WHERE email IN (${placeholders})
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(sql, candidates);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Data Not Found Please Try Another Input");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findUserByEmail", "Error querying user by email", error);
      return wrapper.error("Error querying PostgreSQL");
    }
  }

  async findUserById(id) {
    return this.db.findOne(
      { id },
      {
        id: 1,
        email: 1,
        password_hash: 1,
        full_name: 1,
        role: 1,
        login_provider: 1,
        email_verified_at: 1,
        last_login_at: 1,
        created_at: 1,
        updated_at: 1,
      },
      usersCollection,
    );
  }

  async findTokenByValue(token, type) {
    return this.db.findOne(
      { token, type },
      {
        id: 1,
        user_id: 1,
        token: 1,
        type: 1,
        expires_at: 1,
        used_at: 1,
        created_at: 1,
      },
      tokensCollection,
    );
  }
}

module.exports = Query;
