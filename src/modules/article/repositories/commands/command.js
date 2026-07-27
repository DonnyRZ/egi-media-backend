const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { InternalServerError } = require("../../../../helpers/errors");
const ctx = "Article-Command";

const buildRelationInsert = (table, relationColumn, articleId, relationIds) => {
  const placeholders = relationIds.map((_, index) => `($1, $${index + 2})`).join(", ");
  return {
    query: `
      INSERT INTO ${table} (article_id, ${relationColumn})
      VALUES ${placeholders}
      ON CONFLICT DO NOTHING
    `,
    values: [articleId, ...relationIds],
  };
};

// Translatable columns for the optional en/uz locales (id lives in the base columns).
const TRANSLATION_COLUMNS = [
  "title_en", "slug_en", "summary_en", "content_en",
  "title_uz", "slug_uz", "summary_uz", "content_uz",
];

class Command {
  constructor(db) {
    this.db = db;
  }

  // ─── Insert Article ───────────────────────────────────────────────────────────
  async insertArticle({
    id,
    author_id,
    category_id,
    series_id,
    title,
    slug,
    summary,
    content,
    featured_image,
    status,
    published_at,
    placements,
    translationValues,
    topic_ids,
    tag_ids,
  }) {
    try {
      const query = `
        INSERT INTO articles (
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at, placements,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20,
          NOW(), NOW()
        )
        RETURNING
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at, placements,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          created_at, updated_at
      `;

      const values = [
        id, author_id, category_id || null, series_id || null,
        title, slug, summary || null, content,
        featured_image || null, status, published_at || null,
        placements && placements.length > 0 ? placements : ["latest_news"],
        ...TRANSLATION_COLUMNS.map((col) => translationValues?.[col] ?? null),
      ];
      const queries = [{ query, values }];

      if (topic_ids.length > 0) {
        // Hierarchy rule: one article ↔ one topic.
        queries.push(
          buildRelationInsert("article_topics", "topic_id", id, topic_ids.slice(0, 1))
        );
      }
      if (tag_ids.length > 0) {
        queries.push(buildRelationInsert("article_tags", "tag_id", id, tag_ids));
      }

      const results = await this.db.executeTransaction(queries);
      if (!results || !results[0] || results[0].rowCount === 0) {
        return wrapper.error(new InternalServerError("Unable to create article"));
      }

      return wrapper.data(results[0].rows[0]);
    } catch (error) {
      logger.error(ctx, "insertArticle", "Error inserting article", error);
      return wrapper.error(error);
    }
  }

  // ─── Update Article ───────────────────────────────────────────────────────────
  async updateArticle({ id, category_id, series_id, title, slug, summary, content, featured_image, status, published_at, placements, translationValues, topic_ids, tag_ids, updatedFields }) {
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
      if (updatedFields.includes("placements")) {
        setClauses.push(`placements = $${idx}`);
        values.push(placements ?? []);
        idx++;
      }

      for (const col of TRANSLATION_COLUMNS) {
        if (updatedFields.includes(col)) {
          setClauses.push(`${col} = $${idx}`);
          values.push(translationValues?.[col] ?? null);
          idx++;
        }
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
          featured_image, status, published_at, placements,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          created_at, updated_at
      `;

      const queries = [{ query, values }];
      if (topic_ids !== undefined) {
        queries.push({
          query: "DELETE FROM article_topics WHERE article_id = $1",
          values: [id],
        });
        if (topic_ids.length > 0) {
          queries.push(
            buildRelationInsert("article_topics", "topic_id", id, topic_ids.slice(0, 1))
          );
        }
      }
      if (tag_ids !== undefined) {
        queries.push({
          query: "DELETE FROM article_tags WHERE article_id = $1",
          values: [id],
        });
        if (tag_ids.length > 0) {
          queries.push(buildRelationInsert("article_tags", "tag_id", id, tag_ids));
        }
      }

      const results = await this.db.executeTransaction(queries);
      if (!results || !results[0] || results[0].rowCount === 0) {
        return wrapper.error("Article not found");
      }

      return wrapper.data(results[0].rows[0]);
    } catch (error) {
      logger.error(ctx, "updateArticle", "Error updating article", error);
      return wrapper.error(error);
    }
  }

  async updateArticlePlacements({ id, placements }) {
    try {
      const query = `
        UPDATE articles
        SET placements = $1,
            updated_at = NOW()
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING id, placements, updated_at
      `;
      const result = await this.db.executeQuery(query, [placements ?? [], id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Article not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateArticlePlacements", "Error updating placements", error);
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

      await this.db.executeQuery(query, [id, article_id, user_id || null, platform]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertArticleShare", "Error recording article share", error);
      return wrapper.error(error);
    }
  }

  // ─── Insert Article View ──────────────────────────────────────────────────────
  async insertArticleView({ id, article_id, user_id, ip_address }) {
    try {
      const query = `
        INSERT INTO article_views (id, article_id, user_id, ip_address, viewed_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;

      await this.db.executeQuery(query, [id, article_id, user_id || null, ip_address || null]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertArticleView", "Error recording article view", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
