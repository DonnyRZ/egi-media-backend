const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "User-Command";

class Command {
  constructor(db) {
    this.db = db;
  }

  // ─── Update User (full_name dan/atau role) ──────────────────────────────────
  async updateUser({ id, full_name, role }) {
    try {
      const setClauses = [];
      const values = [];
      let idx = 1;

      if (full_name !== undefined) {
        setClauses.push(`full_name = $${idx}`);
        values.push(full_name);
        idx++;
      }

      if (role !== undefined) {
        setClauses.push(`role = $${idx}`);
        values.push(role);
        idx++;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE users
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
          AND deleted_at IS NULL
        RETURNING id, email, full_name, role, login_provider, email_verified_at, last_login_at, created_at, updated_at
      `;

      const result = await this.db.executeQuery(query, values);

      if (!result || result.rowCount === 0) {
        return wrapper.error("User not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateUser", "Error updating user", error);
      return wrapper.error(error);
    }
  }

  // ─── Soft Delete User (set deleted_at) ─────────────────────────────────────
  async softDeleteUser(id) {
    try {
      const query = `
        UPDATE users
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rowCount === 0) {
        return wrapper.error("User not found");
      }

      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "softDeleteUser", "Error soft deleting user", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Follow Record ────────────────────────────────────────────────────
  async insertFollow({ author_id, follower_id }) {
    try {
      const query = `
        INSERT INTO author_followers (author_id, follower_id, created_at)
        VALUES ($1, $2, NOW())
      `;

      await this.db.executeQuery(query, [author_id, follower_id]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertFollow", "Error inserting follow record", error);
      return wrapper.error(error);
    }
  }

  // ─── Delete Follow Record ────────────────────────────────────────────────────
  async deleteFollow({ author_id, follower_id }) {
    try {
      const query = `
        DELETE FROM author_followers
        WHERE author_id = $1
          AND follower_id = $2
      `;

      const result = await this.db.executeQuery(query, [author_id, follower_id]);

      if (!result || result.rowCount === 0) {
        return wrapper.error("Follow record not found");
      }

      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "deleteFollow", "Error deleting follow record", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
