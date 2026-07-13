const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const ctx = "Article-Command";

class Command {
  constructor(db) {
    this.db = db;
  }

  // ─── Insert Article ───────────────────────────────────────────────────────────
  async insertArticle({ id, author_id, category_id, series_id, title, slug, summary, content, featured_image, status, published_at }) {
    try {
      const query = `
        INSERT INTO articles (
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
        RETURNING
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at,
          created_at, updated_at
      `;

      const values = [
        id, author_id, category_id || null, series_id || null,
        title, slug, summary || null, content,
        featured_image || null, status, published_at || null,
      ];

      const result = await this.db.executeQuery(query, values);
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "insertArticle", "Error inserting article", error);
      return wrapper.error(error);
    }
  }

  // ─── Update Article ───────────────────────────────────────────────────────────
  async updateArticle({ id, category_id, series_id, title, slug, summary, content, featured_image, status, published_at, updatedFields }) {
    try {
      const setClauses = [];
      const values = [];
      let idx = 1;

      if (updatedFields.includes("title")) {
        setClauses.push(`title = $${idx}`);
        values.push(title);
        idx++;
      }
      if (updatedFields.includes("slug")) {
        setClauses.push(`slug = $${idx}`);
        values.push(slug);
        idx++;
      }
      if (updatedFields.includes("summary")) {
        setClauses.push(`summary = $${idx}`);
        values.push(summary ?? null);
        idx++;
      }
      if (updatedFields.includes("content")) {
        setClauses.push(`content = $${idx}`);
        values.push(content);
        idx++;
      }
      if (updatedFields.includes("featured_image")) {
        setClauses.push(`featured_image = $${idx}`);
        values.push(featured_image ?? null);
        idx++;
      }
      if (updatedFields.includes("status")) {
        setClauses.push(`status = $${idx}`);
        values.push(status);
        idx++;
      }
      if (updatedFields.includes("published_at")) {
        setClauses.push(`published_at = $${idx}`);
        values.push(published_at ?? null);
        idx++;
      }
      if (updatedFields.includes("category_id")) {
        setClauses.push(`category_id = $${idx}`);
        values.push(category_id ?? null);
        idx++;
      }
      if (updatedFields.includes("series_id")) {
        setClauses.push(`series_id = $${idx}`);
        values.push(series_id ?? null);
        idx++;
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE articles
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
          AND deleted_at IS NULL
        RETURNING
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at,
          created_at, updated_at
      `;

      const result = await this.db.executeQuery(query, values);

      if (!result || result.rowCount === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateArticle", "Error updating article", error);
      return wrapper.error(error);
    }
  }

  // ─── Soft Delete Article ──────────────────────────────────────────────────────
  async softDeleteArticle(id) {
    try {
      const query = `
        UPDATE articles
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
      `;

      const result = await this.db.executeQuery(query, [id]);

      if (!result || result.rowCount === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "softDeleteArticle", "Error soft deleting article", error);
      return wrapper.error(error);
    }
  }

  // ─── Update Article Status ────────────────────────────────────────────────────
  async updateArticleStatus({ id, status, published_at }) {
    try {
      const query = `
        UPDATE articles
        SET status = $1,
            published_at = $2,
            updated_at = NOW()
        WHERE id = $3
          AND deleted_at IS NULL
        RETURNING id, status, published_at, updated_at
      `;

      const result = await this.db.executeQuery(query, [status, published_at || null, id]);

      if (!result || result.rowCount === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateArticleStatus", "Error updating article status", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Article Topics (bulk) ─────────────────────────────────────────────
  async insertArticleTopics(article_id, topic_ids) {
    try {
      if (!topic_ids || topic_ids.length === 0) return wrapper.data(true);

      const placeholders = topic_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      const values = [article_id, ...topic_ids];

      const query = `
        INSERT INTO article_topics (article_id, topic_id)
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING
      `;

      await this.db.executeQuery(query, values);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertArticleTopics", "Error inserting article topics", error);
      return wrapper.error(error);
    }
  }

  // ─── Delete Article Topics ────────────────────────────────────────────────────
  async deleteArticleTopics(article_id) {
    try {
      const query = `DELETE FROM article_topics WHERE article_id = $1`;
      await this.db.executeQuery(query, [article_id]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "deleteArticleTopics", "Error deleting article topics", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Article Tags (bulk) ───────────────────────────────────────────────
  async insertArticleTags(article_id, tag_ids) {
    try {
      if (!tag_ids || tag_ids.length === 0) return wrapper.data(true);

      const placeholders = tag_ids.map((_, i) => `($1, $${i + 2})`).join(", ");
      const values = [article_id, ...tag_ids];

      const query = `
        INSERT INTO article_tags (article_id, tag_id)
        VALUES ${placeholders}
        ON CONFLICT DO NOTHING
      `;

      await this.db.executeQuery(query, values);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertArticleTags", "Error inserting article tags", error);
      return wrapper.error(error);
    }
  }

  // ─── Delete Article Tags ──────────────────────────────────────────────────────
  async deleteArticleTags(article_id) {
    try {
      const query = `DELETE FROM article_tags WHERE article_id = $1`;
      await this.db.executeQuery(query, [article_id]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "deleteArticleTags", "Error deleting article tags", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Saved Article ─────────────────────────────────────────────────────
  async insertSavedArticle({ user_id, article_id }) {
    try {
      const query = `
        INSERT INTO saved_articles (user_id, article_id, created_at)
        VALUES ($1, $2, NOW())
      `;

      await this.db.executeQuery(query, [user_id, article_id]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertSavedArticle", "Error saving article", error);
      return wrapper.error(error);
    }
  }

  // ─── Delete Saved Article ─────────────────────────────────────────────────────
  async deleteSavedArticle({ user_id, article_id }) {
    try {
      const query = `
        DELETE FROM saved_articles
        WHERE user_id = $1
          AND article_id = $2
      `;

      const result = await this.db.executeQuery(query, [user_id, article_id]);

      if (!result || result.rowCount === 0) {
        return wrapper.error("Saved article not found");
      }

      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "deleteSavedArticle", "Error removing saved article", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Article Share ─────────────────────────────────────────────────────
  async insertArticleShare({ id, article_id, user_id, platform }) {
    try {
      const query = `
        INSERT INTO article_shares (id, article_id, user_id, platform, shared_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;

      await this.db.executeQuery(query, [id, article_id, user_id, platform]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertArticleShare", "Error recording article share", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
