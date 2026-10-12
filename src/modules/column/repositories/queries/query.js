const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "Column-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  async findColumnExistsById(id) {
    try {
      const query = `
        SELECT id, author_id, status, title, slug, summary, content,
               title_en, content_en, summary_en,
               title_uz, content_uz, summary_uz,
               translation_status
        FROM "columns"
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findColumnExistsById", "Error checking column existence", error);
      return wrapper.error(error);
    }
  }

  async findSavedRecord(user_id, column_id) {
    try {
      const query = `
        SELECT user_id, column_id
        FROM saved_columns
        WHERE user_id = $1
          AND column_id = $2
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [user_id, column_id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Saved record not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findSavedRecord", "Error checking saved record", error);
      return wrapper.error(error);
    }
  }

  async findCommentExistsById(comment_id, column_id) {
    try {
      const query = `
        SELECT id, column_id, user_id, parent_id
        FROM column_comments
        WHERE id = $1
          AND column_id = $2
          AND deleted_at IS NULL
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [comment_id, column_id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Comment not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findCommentExistsById", "Error checking comment", error);
      return wrapper.error(error);
    }
  }

  _listSelect() {
    return `
      c.id,
      c.title,
      c.slug,
      c.summary,
      c.title_en,
      c.slug_en,
      c.summary_en,
      c.title_uz,
      c.slug_uz,
      c.summary_uz,
      c.featured_image, c.category_id, c.featured_image_alt, c.featured_image_caption, c.featured_image_credit,
      c.status,
      c.translation_status,
      c.rejection_reason,
      c.published_at,
      c.created_at,
      c.updated_at,
      u.id AS author_id,
      u.full_name AS author_full_name, up.avatar_url AS author_avatar_url, up.bio AS author_bio,
      u.email AS author_email,
      u.role AS author_role
    `;
  }

  async findManageColumns({ page, limit, search, status }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["c.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (status) {
        conditions.push(`c.status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (search) {
        conditions.push(`(
          c.title ILIKE $${idx}
          OR c.title_en ILIKE $${idx}
          OR c.title_uz ILIKE $${idx}
          OR u.full_name ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      const query = `
        SELECT ${this._listSelect()}
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY
          CASE WHEN c.status = 'pending_approval' THEN 0 ELSE 1 END,
          c.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findManageColumns", "Error listing manage columns", error);
      return wrapper.error(error);
    }
  }

  async countManageColumns({ search, status }) {
    try {
      const conditions = ["c.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (status) {
        conditions.push(`c.status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (search) {
        conditions.push(`(
          c.title ILIKE $${idx}
          OR c.title_en ILIKE $${idx}
          OR c.title_uz ILIKE $${idx}
          OR u.full_name ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      const query = `
        SELECT COUNT(*)::int AS total
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE ${conditions.join(" AND ")}
      `;
      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countManageColumns", "Error counting manage columns", error);
      return wrapper.error(error);
    }
  }

  async findAllPublishedColumns({ page, limit, search, author_id, category_id, sort }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["c.deleted_at IS NULL", "c.status = 'published'", "c.translation_status = 'ready'"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          c.title ILIKE $${idx} OR c.summary ILIKE $${idx}
          OR c.title_en ILIKE $${idx} OR c.summary_en ILIKE $${idx}
          OR c.title_uz ILIKE $${idx} OR c.summary_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if(category_id){conditions.push(`c.category_id = $${idx}`);values.push(category_id);idx++;}
      if (author_id) {
        conditions.push(`c.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;
      const orderClause =
        sort === "oldest"
          ? "ORDER BY c.published_at ASC NULLS LAST"
          : sort === "popular"
          ? "ORDER BY (SELECT COUNT(*) FROM column_views cv WHERE cv.column_id = c.id) DESC, c.published_at DESC NULLS LAST"
          : "ORDER BY c.published_at DESC NULLS LAST";

      const query = `
        SELECT ${this._listSelect()}
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        ${whereClause}
        ${orderClause}
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findAllPublishedColumns", "Error listing columns", error);
      return wrapper.error(error);
    }
  }

  async countAllPublishedColumns({ search, author_id, category_id }) {
    try {
      const conditions = ["c.deleted_at IS NULL", "c.status = 'published'", "c.translation_status = 'ready'"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          c.title ILIKE $${idx} OR c.summary ILIKE $${idx}
          OR c.title_en ILIKE $${idx} OR c.summary_en ILIKE $${idx}
          OR c.title_uz ILIKE $${idx} OR c.summary_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if(category_id){conditions.push(`c.category_id = $${idx}`);values.push(category_id);idx++;}
      if (author_id) {
        conditions.push(`c.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      const query = `
        SELECT COUNT(*)::int AS total
        FROM "columns" c
        WHERE ${conditions.join(" AND ")}
      `;
      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countAllPublishedColumns", "Error counting columns", error);
      return wrapper.error(error);
    }
  }

  async findMyColumns({ author_id, page, limit, status }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["c.deleted_at IS NULL", "c.author_id = $1"];
      const values = [author_id];
      let idx = 2;

      if (status) {
        conditions.push(`c.status = $${idx}`);
        values.push(status);
        idx++;
      }

      const query = `
        SELECT ${this._listSelect()}
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE ${conditions.join(" AND ")}
        ORDER BY c.updated_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;
      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findMyColumns", "Error listing my columns", error);
      return wrapper.error(error);
    }
  }

  async countMyColumns({ author_id, status }) {
    try {
      const conditions = ["deleted_at IS NULL", "author_id = $1"];
      const values = [author_id];
      if (status) {
        conditions.push("status = $2");
        values.push(status);
      }
      const query = `
        SELECT COUNT(*)::int AS total
        FROM "columns"
        WHERE ${conditions.join(" AND ")}
      `;
      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countMyColumns", "Error counting my columns", error);
      return wrapper.error(error);
    }
  }

  async findPendingColumns({ page, limit }) {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT ${this._listSelect()}
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE c.deleted_at IS NULL
          AND c.status = 'pending_approval'
        ORDER BY c.created_at ASC
        LIMIT $1 OFFSET $2
      `;
      const result = await this.db.executeQuery(query, [limit, offset]);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findPendingColumns", "Error listing pending columns", error);
      return wrapper.error(error);
    }
  }

  async countPendingColumns() {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM "columns"
        WHERE deleted_at IS NULL
          AND status = 'pending_approval'
      `;
      const result = await this.db.executeQuery(query, []);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countPendingColumns", "Error counting pending columns", error);
      return wrapper.error(error);
    }
  }

  async findSavedColumns({ user_id, page, limit }) {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT ${this._listSelect()}, sc.created_at AS saved_at
        FROM saved_columns sc
        INNER JOIN "columns" c ON c.id = sc.column_id
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE sc.user_id = $1
          AND c.deleted_at IS NULL
          AND c.status = 'published'
          AND c.translation_status = 'ready'
        ORDER BY sc.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      const result = await this.db.executeQuery(query, [user_id, limit, offset]);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findSavedColumns", "Error listing saved columns", error);
      return wrapper.error(error);
    }
  }

  async countSavedColumns(user_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM saved_columns sc
        INNER JOIN "columns" c ON c.id = sc.column_id
        WHERE sc.user_id = $1
          AND c.deleted_at IS NULL
          AND c.status = 'published'
          AND c.translation_status = 'ready'
      `;
      const result = await this.db.executeQuery(query, [user_id]);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countSavedColumns", "Error counting saved columns", error);
      return wrapper.error(error);
    }
  }

  async findColumnById(id) {
    try {
      const query = `
        SELECT
          c.id,
          c.title, c.slug, c.summary, c.content,
          c.title_en, c.slug_en, c.summary_en, c.content_en,
          c.title_uz, c.slug_uz, c.summary_uz, c.content_uz,
          c.featured_image, c.category_id, c.featured_image_alt, c.featured_image_caption, c.featured_image_credit, c.status, c.translation_status, c.rejection_reason,
          c.reviewed_by, c.reviewed_at, c.published_at,
          c.created_at, c.updated_at,
          u.id AS author_id,
          u.full_name AS author_full_name, up.avatar_url AS author_avatar_url, up.bio AS author_bio,
          u.email AS author_email,
          u.role AS author_role,
          (SELECT COUNT(*)::int FROM column_views cv WHERE cv.column_id = c.id) AS view_count,
          (SELECT COUNT(*)::int FROM column_shares cs WHERE cs.column_id = c.id) AS share_count,
          (SELECT COUNT(*)::int FROM saved_columns sc WHERE sc.column_id = c.id) AS save_count,
          (SELECT COUNT(*)::int FROM column_comments cc WHERE cc.column_id = c.id AND cc.deleted_at IS NULL) AS comment_count
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE c.id = $1
          AND c.deleted_at IS NULL
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [id]);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findColumnById", "Error querying column by id", error);
      return wrapper.error(error);
    }
  }

  async findColumnBySlug(slug) {
    try {
      const query = `
        SELECT
          c.id,
          c.title, c.slug, c.summary, c.content,
          c.title_en, c.slug_en, c.summary_en, c.content_en,
          c.title_uz, c.slug_uz, c.summary_uz, c.content_uz,
          c.featured_image, c.category_id, c.featured_image_alt, c.featured_image_caption, c.featured_image_credit, c.status, c.translation_status, c.rejection_reason,
          c.reviewed_by, c.reviewed_at, c.published_at,
          c.created_at, c.updated_at,
          u.id AS author_id,
          u.full_name AS author_full_name, up.avatar_url AS author_avatar_url, up.bio AS author_bio,
          u.email AS author_email,
          u.role AS author_role,
          (SELECT COUNT(*)::int FROM column_views cv WHERE cv.column_id = c.id) AS view_count,
          (SELECT COUNT(*)::int FROM column_shares cs WHERE cs.column_id = c.id) AS share_count,
          (SELECT COUNT(*)::int FROM saved_columns sc WHERE sc.column_id = c.id) AS save_count,
          (SELECT COUNT(*)::int FROM column_comments cc WHERE cc.column_id = c.id AND cc.deleted_at IS NULL) AS comment_count
        FROM "columns" c
        INNER JOIN users u ON u.id = c.author_id
        LEFT JOIN user_profiles up ON up.user_id=u.id
        WHERE (c.slug = $1 OR c.slug_en = $1 OR c.slug_uz = $1)
          AND c.status = 'published'
          AND c.translation_status = 'ready'
          AND c.deleted_at IS NULL
        LIMIT 1
      `;
      const result = await this.db.executeQuery(query, [slug]);
      if (!result || result.rows.length === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findColumnBySlug", "Error querying column by slug", error);
      return wrapper.error(error);
    }
  }

  async findComments({ column_id, page, limit }) {
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT
          cc.id,
          cc.column_id,
          cc.parent_id,
          cc.content,
          cc.created_at,
          cc.updated_at,
          u.id AS user_id,
          u.full_name AS user_full_name,
          u.role AS user_role
        FROM column_comments cc
        INNER JOIN users u ON u.id = cc.user_id
        WHERE cc.column_id = $1
          AND cc.deleted_at IS NULL
        ORDER BY cc.created_at ASC
        LIMIT $2 OFFSET $3
      `;
      const result = await this.db.executeQuery(query, [column_id, limit, offset]);
      return wrapper.data(result ? result.rows : []);
    } catch (error) {
      logger.error(ctx, "findComments", "Error listing comments", error);
      return wrapper.error(error);
    }
  }

  async countComments(column_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM column_comments
        WHERE column_id = $1
          AND deleted_at IS NULL
      `;
      const result = await this.db.executeQuery(query, [column_id]);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countComments", "Error counting comments", error);
      return wrapper.error(error);
    }
  }

  async countColumnViews(column_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM column_views
        WHERE column_id = $1
      `;
      const result = await this.db.executeQuery(query, [column_id]);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countColumnViews", "Error counting views", error);
      return wrapper.error(error);
    }
  }

  async countColumnShares(column_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM column_shares
        WHERE column_id = $1
      `;
      const result = await this.db.executeQuery(query, [column_id]);
      return wrapper.data(result?.rows?.[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countColumnShares", "Error counting shares", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Query;
