const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  emailLookupCandidates,
} = require("../../../../helpers/utils/crypto_helper");
const ctx = "User-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  // ─── Cek apakah email sudah terdaftar ──────────────────────────────────────
  async findUserByEmail(email) {
    try {
      const candidates = emailLookupCandidates(email);
      if (candidates.length === 0) {
        return wrapper.error("User not found");
      }

      const placeholders = candidates
        .map((_, index) => `$${index + 1}`)
        .join(", ");
      const query = `
        SELECT id, email
        FROM users
        WHERE email IN (${placeholders})
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, candidates);

      if (!result || result.rows.length === 0) {
        return wrapper.error("User not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findUserByEmail", "Error querying user by email", error);
      return wrapper.error(error);
    }
  }

  resolveUserSort(sort) {
    if (sort === "oldest") return "u.created_at ASC, u.full_name ASC, u.id ASC";
    if (sort === "name") return "u.full_name ASC, u.created_at DESC, u.id ASC";
    return "u.created_at DESC, u.full_name ASC, u.id ASC";
  }

  // ─── List Users dengan pagination, search, filter role, sort ───────────────
  async findAllUsers({ page, limit, search, role, sort }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["u.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }

      if (role) {
        conditions.push(`u.role = $${idx}`);
        values.push(role);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
      const orderBy = this.resolveUserSort(sort);

      const query = `
        SELECT
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.login_provider,
          u.email_verified_at,
          u.last_login_at,
          u.created_at,
          u.updated_at
        FROM users u
        ${whereClause}
        ORDER BY ${orderBy}
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findAllUsers", "Error querying users", error);
      return wrapper.error(error);
    }
  }

  // ─── Count Users untuk meta pagination ─────────────────────────────────────
  async countAllUsers({ search, role }) {
    try {
      const conditions = ["u.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(u.full_name ILIKE $${idx} OR u.email ILIKE $${idx})`);
        values.push(`%${search}%`);
        idx++;
      }

      if (role) {
        conditions.push(`u.role = $${idx}`);
        values.push(role);
        idx++;
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      const query = `
        SELECT COUNT(*)::int AS total
        FROM users u
        ${whereClause}
      `;

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countAllUsers", "Error counting users", error);
      return wrapper.error(error);
    }
  }

  // ─── Get User By ID beserta profile ────────────────────────────────────────
  async findUserById(id) {
    try {
      const query = `
        SELECT
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.login_provider,
          u.email_verified_at,
          u.last_login_at,
          u.created_at,
          u.updated_at,
          up.avatar_url,
          up.bio,
          up.industry,
          up.job_title,
          up.seniority,
          up.company,
          up.country,
          up.created_at AS profile_created_at,
          up.updated_at AS profile_updated_at
        FROM users u
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE u.id = $1
          AND u.deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("User not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findUserById", "Error querying user by id", error);
      return wrapper.error(error);
    }
  }

  // ─── Get Followers dari sebuah author ──────────────────────────────────────
  async findFollowers({ author_id, page, limit }) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT
          u.id,
          u.email,
          u.full_name,
          u.role,
          u.created_at,
          af.created_at AS followed_at
        FROM author_followers af
        INNER JOIN users u ON u.id = af.follower_id
        WHERE af.author_id = $1
          AND u.deleted_at IS NULL
        ORDER BY af.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.executeQuery(query, [author_id, limit, offset]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findFollowers", "Error querying followers", error);
      return wrapper.error(error);
    }
  }

  // ─── Count Followers ────────────────────────────────────────────────────────
  async countFollowers(author_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM author_followers af
        INNER JOIN users u ON u.id = af.follower_id
        WHERE af.author_id = $1
          AND u.deleted_at IS NULL
      `;

      const result = await this.db.executeQuery(query, [author_id]);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countFollowers", "Error counting followers", error);
      return wrapper.error(error);
    }
  }

  // ─── Cek apakah follow record sudah ada ────────────────────────────────────
  async findFollowRecord(author_id, follower_id) {
    try {
      const query = `
        SELECT author_id, follower_id
        FROM author_followers
        WHERE author_id = $1
          AND follower_id = $2
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [author_id, follower_id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Follow record not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findFollowRecord", "Error querying follow record", error);
      return wrapper.error(error);
    }
  }

  // ─── Cek apakah user ada (tanpa soft delete) ───────────────────────────────
  async findUserExistsById(id) {
    try {
      const query = `
        SELECT id, role
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("User not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findUserExistsById", "Error querying user existence", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Query;
