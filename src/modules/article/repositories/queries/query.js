const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "Article-Query";

class Query {
  constructor(db) {
    this.db = db;
  }

  // ─── Cek Article Exists ───────────────────────────────────────────────────────
  async findArticleExistsById(id) {
    try {
      const query = `
        SELECT id, author_id, status
        FROM articles
        WHERE id = $1
          AND deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findArticleExistsById", "Error checking article existence", error);
      return wrapper.error(error);
    }
  }

  // ─── Cek Saved Record ─────────────────────────────────────────────────────────
  async findSavedRecord(user_id, article_id) {
    try {
      const query = `
        SELECT user_id, article_id
        FROM saved_articles
        WHERE user_id = $1
          AND article_id = $2
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [user_id, article_id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Saved record not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findSavedRecord", "Error checking saved record", error);
      return wrapper.error(error);
    }
  }

  // ─── List Published Articles dengan filter & pagination ───────────────────────
  async findAllPublishedArticles({ page, limit, search, category_id, topic_id, tag_id, author_id, series_id, sort }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["a.deleted_at IS NULL", "a.status = 'published'"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          a.title ILIKE $${idx} OR a.summary ILIKE $${idx}
          OR a.title_en ILIKE $${idx} OR a.summary_en ILIKE $${idx}
          OR a.title_uz ILIKE $${idx} OR a.summary_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if (category_id) {
        conditions.push(`a.category_id = $${idx}`);
        values.push(category_id);
        idx++;
      }

      if (author_id) {
        conditions.push(`a.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      if (series_id) {
        conditions.push(`a.series_id = $${idx}`);
        values.push(series_id);
        idx++;
      }

      if (topic_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_topics at2
          WHERE at2.article_id = a.id AND at2.topic_id = $${idx}
        )`);
        values.push(topic_id);
        idx++;
      }

      if (tag_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_tags atg
          WHERE atg.article_id = a.id AND atg.tag_id = $${idx}
        )`);
        values.push(tag_id);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const orderClause =
        sort === "oldest"
          ? "ORDER BY a.published_at ASC NULLS LAST"
          : sort === "popular"
          ? "ORDER BY (SELECT COUNT(*) FROM article_views av WHERE av.article_id = a.id) DESC, a.published_at DESC NULLS LAST"
          : "ORDER BY a.published_at DESC NULLS LAST";

      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          u.id AS author_id,
          u.full_name AS author_full_name,
          c.id AS category_id,
          c.name AS category_name,
          c.name_en AS category_name_en,
          c.name_uz AS category_name_uz
        FROM articles a
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        ${whereClause}
        ${orderClause}
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findAllPublishedArticles", "Error querying articles", error);
      return wrapper.error(error);
    }
  }

  // ─── Count Published Articles ─────────────────────────────────────────────────
  async countAllPublishedArticles({ search, category_id, topic_id, tag_id, author_id, series_id }) {
    try {
      const conditions = ["a.deleted_at IS NULL", "a.status = 'published'"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          a.title ILIKE $${idx} OR a.summary ILIKE $${idx}
          OR a.title_en ILIKE $${idx} OR a.summary_en ILIKE $${idx}
          OR a.title_uz ILIKE $${idx} OR a.summary_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if (category_id) {
        conditions.push(`a.category_id = $${idx}`);
        values.push(category_id);
        idx++;
      }

      if (author_id) {
        conditions.push(`a.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      if (series_id) {
        conditions.push(`a.series_id = $${idx}`);
        values.push(series_id);
        idx++;
      }

      if (topic_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_topics at2
          WHERE at2.article_id = a.id AND at2.topic_id = $${idx}
        )`);
        values.push(topic_id);
        idx++;
      }

      if (tag_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_tags atg
          WHERE atg.article_id = a.id AND atg.tag_id = $${idx}
        )`);
        values.push(tag_id);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const query = `
        SELECT COUNT(*)::int AS total
        FROM articles a
        ${whereClause}
      `;

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countAllPublishedArticles", "Error counting articles", error);
      return wrapper.error(error);
    }
  }

  // ─── Get Article Detail By ID ─────────────────────────────────────────────────
  async findArticleById(id) {
    try {
      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.content,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.content_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.content_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          a.updated_at,
          a.author_id,
          a.category_id,
          a.series_id,
          u.id AS author_id,
          u.full_name AS author_full_name,
          u.email AS author_email,
          u.role AS author_role,
          c.id AS cat_id,
          c.name AS cat_name,
          c.name_en AS cat_name_en,
          c.name_uz AS cat_name_uz,
          c.slug AS cat_slug,
          c.slug_en AS cat_slug_en,
          c.slug_uz AS cat_slug_uz,
          c.description AS cat_description,
          c.description_en AS cat_description_en,
          c.description_uz AS cat_description_uz,
          c.created_at AS cat_created_at,
          c.updated_at AS cat_updated_at,
          s.id AS series_id,
          s.name AS series_name,
          s.slug AS series_slug,
          s.description AS series_description,
          s.image AS series_image,
          s.created_at AS series_created_at,
          (SELECT COUNT(*)::int FROM article_views av WHERE av.article_id = a.id) AS view_count,
          (SELECT COUNT(*)::int FROM article_shares ash WHERE ash.article_id = a.id) AS share_count
        FROM articles a
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        LEFT JOIN series s ON s.id = a.series_id
        WHERE a.id = $1
          AND a.deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findArticleById", "Error querying article by id", error);
      return wrapper.error(error);
    }
  }

  // ─── Get Article Detail By Slug (published) ───────────────────────────────────
  async findArticleBySlug(slug) {
    try {
      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.content,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.content_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.content_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          a.updated_at,
          a.author_id,
          a.category_id,
          a.series_id,
          u.id AS author_id,
          u.full_name AS author_full_name,
          u.email AS author_email,
          u.role AS author_role,
          c.id AS cat_id,
          c.name AS cat_name,
          c.name_en AS cat_name_en,
          c.name_uz AS cat_name_uz,
          c.slug AS cat_slug,
          c.slug_en AS cat_slug_en,
          c.slug_uz AS cat_slug_uz,
          c.description AS cat_description,
          c.description_en AS cat_description_en,
          c.description_uz AS cat_description_uz,
          c.created_at AS cat_created_at,
          c.updated_at AS cat_updated_at,
          s.id AS series_id,
          s.name AS series_name,
          s.slug AS series_slug,
          s.description AS series_description,
          s.image AS series_image,
          s.created_at AS series_created_at,
          (SELECT COUNT(*)::int FROM article_views av WHERE av.article_id = a.id) AS view_count,
          (SELECT COUNT(*)::int FROM article_shares ash WHERE ash.article_id = a.id) AS share_count
        FROM articles a
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        LEFT JOIN series s ON s.id = a.series_id
        WHERE (a.slug = $1 OR a.slug_en = $1 OR a.slug_uz = $1)
          AND a.status = 'published'
          AND a.deleted_at IS NULL
        LIMIT 1
      `;

      const result = await this.db.executeQuery(query, [slug]);

      if (!result || result.rows.length === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "findArticleBySlug", "Error querying article by slug", error);
      return wrapper.error(error);
    }
  }

  async countArticleViews(article_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM article_views
        WHERE article_id = $1
      `;
      const result = await this.db.executeQuery(query, [article_id]);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countArticleViews", "Error counting article views", error);
      return wrapper.error(error);
    }
  }

  async countArticleShares(article_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM article_shares
        WHERE article_id = $1
      `;
      const result = await this.db.executeQuery(query, [article_id]);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countArticleShares", "Error counting article shares", error);
      return wrapper.error(error);
    }
  }

  // ─── Get Topics of Article ────────────────────────────────────────────────────
  async findArticleTopics(article_id) {
    try {
      const query = `
        SELECT
          t.id,
          t.name,
          t.name_en,
          t.name_uz,
          t.slug,
          t.slug_en,
          t.slug_uz,
          t.description,
          t.description_en,
          t.description_uz,
          t.created_at,
          t.updated_at
        FROM article_topics at2
        INNER JOIN topics t ON t.id = at2.topic_id
        WHERE at2.article_id = $1
      `;

      const result = await this.db.executeQuery(query, [article_id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findArticleTopics", "Error querying article topics", error);
      return wrapper.error(error);
    }
  }

  // ─── Get Tags of Article ──────────────────────────────────────────────────────
  async findArticleTags(article_id) {
    try {
      const query = `
        SELECT
          tg.id,
          tg.name,
          tg.slug,
          tg.created_at
        FROM article_tags atg
        INNER JOIN tags tg ON tg.id = atg.tag_id
        WHERE atg.article_id = $1
      `;

      const result = await this.db.executeQuery(query, [article_id]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findArticleTags", "Error querying article tags", error);
      return wrapper.error(error);
    }
  }

  // ─── List My Articles (filter by author_id) ───────────────────────────────────
  async findMyArticles({ author_id, page, limit, status }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["a.author_id = $1", "a.deleted_at IS NULL"];
      const values = [author_id];
      let idx = 2;

      if (status) {
        conditions.push(`a.status = $${idx}`);
        values.push(status);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          a.updated_at,
          u.id AS author_id,
          u.full_name AS author_full_name,
          c.id AS category_id,
          c.name AS category_name,
          c.name_en AS category_name_en,
          c.name_uz AS category_name_uz
        FROM articles a
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findMyArticles", "Error querying my articles", error);
      return wrapper.error(error);
    }
  }

  // ─── List Manage Articles (semua author, semua status) ────────────────────────
  // Dipakai CMS editorial: superadmin & author bisa melihat seluruh artikel.
  // Kontrol edit/hapus/ubah-status tetap divalidasi ownership di command domain.
  async findManageArticles({ page, limit, search, status, author_id, category_id, topic_id, tag_id, series_id }) {
    try {
      const offset = (page - 1) * limit;
      const conditions = ["a.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          a.title ILIKE $${idx} OR a.summary ILIKE $${idx}
          OR a.title_en ILIKE $${idx} OR a.title_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if (status) {
        conditions.push(`a.status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (author_id) {
        conditions.push(`a.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      if (category_id) {
        conditions.push(`a.category_id = $${idx}`);
        values.push(category_id);
        idx++;
      }

      if (series_id) {
        conditions.push(`a.series_id = $${idx}`);
        values.push(series_id);
        idx++;
      }

      if (topic_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_topics at2
          WHERE at2.article_id = a.id AND at2.topic_id = $${idx}
        )`);
        values.push(topic_id);
        idx++;
      }

      if (tag_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_tags atg
          WHERE atg.article_id = a.id AND atg.tag_id = $${idx}
        )`);
        values.push(tag_id);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          a.updated_at,
          u.id AS author_id,
          u.full_name AS author_full_name,
          c.id AS category_id,
          c.name AS category_name,
          c.name_en AS category_name_en,
          c.name_uz AS category_name_uz
        FROM articles a
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        ${whereClause}
        ORDER BY a.updated_at DESC NULLS LAST, a.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `;

      values.push(limit, offset);

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findManageArticles", "Error querying manage articles", error);
      return wrapper.error(error);
    }
  }

  // ─── Count Manage Articles ────────────────────────────────────────────────────
  async countManageArticles({ search, status, author_id, category_id, topic_id, tag_id, series_id }) {
    try {
      const conditions = ["a.deleted_at IS NULL"];
      const values = [];
      let idx = 1;

      if (search) {
        conditions.push(`(
          a.title ILIKE $${idx} OR a.summary ILIKE $${idx}
          OR a.title_en ILIKE $${idx} OR a.title_uz ILIKE $${idx}
        )`);
        values.push(`%${search}%`);
        idx++;
      }

      if (status) {
        conditions.push(`a.status = $${idx}`);
        values.push(status);
        idx++;
      }

      if (author_id) {
        conditions.push(`a.author_id = $${idx}`);
        values.push(author_id);
        idx++;
      }

      if (category_id) {
        conditions.push(`a.category_id = $${idx}`);
        values.push(category_id);
        idx++;
      }

      if (series_id) {
        conditions.push(`a.series_id = $${idx}`);
        values.push(series_id);
        idx++;
      }

      if (topic_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_topics at2
          WHERE at2.article_id = a.id AND at2.topic_id = $${idx}
        )`);
        values.push(topic_id);
        idx++;
      }

      if (tag_id) {
        conditions.push(`EXISTS (
          SELECT 1 FROM article_tags atg
          WHERE atg.article_id = a.id AND atg.tag_id = $${idx}
        )`);
        values.push(tag_id);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const query = `
        SELECT COUNT(*)::int AS total
        FROM articles a
        ${whereClause}
      `;

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countManageArticles", "Error counting manage articles", error);
      return wrapper.error(error);
    }
  }

  // ─── Dashboard stats (superadmin = all authors; author = own only) ───────────
  async countArticleStats({ author_id }) {
    try {
      const conditions = ["deleted_at IS NULL"];
      const values = [];
      if (author_id) {
        conditions.push("author_id = $1");
        values.push(author_id);
      }
      const whereClause = `WHERE ${conditions.join(" AND ")}`;
      const query = `
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
          COUNT(*) FILTER (WHERE status = 'review')::int AS review,
          COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
          COUNT(*) FILTER (WHERE status = 'published')::int AS published,
          COUNT(*) FILTER (WHERE status = 'archived')::int AS archived
        FROM articles
        ${whereClause}
      `;
      const result = await this.db.executeQuery(query, values);
      return wrapper.data(
        result.rows[0] || {
          total: 0,
          draft: 0,
          review: 0,
          scheduled: 0,
          published: 0,
          archived: 0,
        },
      );
    } catch (error) {
      logger.error(ctx, "countArticleStats", "Error counting article stats", error);
      return wrapper.error(error);
    }
  }

  // ─── Count My Articles ────────────────────────────────────────────────────────
  async countMyArticles({ author_id, status }) {
    try {
      const conditions = ["a.author_id = $1", "a.deleted_at IS NULL"];
      const values = [author_id];
      let idx = 2;

      if (status) {
        conditions.push(`a.status = $${idx}`);
        values.push(status);
        idx++;
      }

      const whereClause = `WHERE ${conditions.join(" AND ")}`;

      const query = `
        SELECT COUNT(*)::int AS total
        FROM articles a
        ${whereClause}
      `;

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countMyArticles", "Error counting my articles", error);
      return wrapper.error(error);
    }
  }

  // ─── List Saved Articles ──────────────────────────────────────────────────────
  async findSavedArticles({ user_id, page, limit }) {
    try {
      const offset = (page - 1) * limit;

      const query = `
        SELECT
          a.id,
          a.title,
          a.slug,
          a.summary,
          a.title_en,
          a.slug_en,
          a.summary_en,
          a.title_uz,
          a.slug_uz,
          a.summary_uz,
          a.featured_image,
          a.status,
          a.published_at,
          a.created_at,
          u.id AS author_id,
          u.full_name AS author_full_name,
          c.id AS category_id,
          c.name AS category_name,
          c.name_en AS category_name_en,
          c.name_uz AS category_name_uz,
          sa.created_at AS saved_at
        FROM saved_articles sa
        INNER JOIN articles a ON a.id = sa.article_id
        INNER JOIN users u ON u.id = a.author_id
        LEFT JOIN categories c ON c.id = a.category_id
        WHERE sa.user_id = $1
          AND a.deleted_at IS NULL
        ORDER BY sa.created_at DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.db.executeQuery(query, [user_id, limit, offset]);
      return wrapper.data(result.rows);
    } catch (error) {
      logger.error(ctx, "findSavedArticles", "Error querying saved articles", error);
      return wrapper.error(error);
    }
  }

  // ─── Count Saved Articles ─────────────────────────────────────────────────────
  async countSavedArticles(user_id) {
    try {
      const query = `
        SELECT COUNT(*)::int AS total
        FROM saved_articles sa
        INNER JOIN articles a ON a.id = sa.article_id
        WHERE sa.user_id = $1
          AND a.deleted_at IS NULL
      `;

      const result = await this.db.executeQuery(query, [user_id]);
      return wrapper.data(result.rows[0]?.total || 0);
    } catch (error) {
      logger.error(ctx, "countSavedArticles", "Error counting saved articles", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Query;
