const logger = require("../../../../helpers/utils/logger");
const wrapper = require("../../../../helpers/utils/wrapper");
const ctx = "Auth-Query";

const usersCollection = "users";
const tokensCollection = "password_reset_tokens";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findUserByEmail(email) {
    return this.db.findOne(
      { email },
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
      usersCollection
    );
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
      usersCollection
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
      tokensCollection
    );
  }
}

module.exports = Query;
