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
    imageMetadata = {},
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
    translation_status = "none",
  }) {
    try {
      const query = `
        INSERT INTO articles (
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at, placements,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          translation_status, featured_image_alt, featured_image_caption, featured_image_credit,
          created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
          $13, $14, $15, $16, $17, $18, $19, $20,
          $21, $22, $23, $24,
          NOW(), NOW()
        )
        RETURNING
          id, author_id, category_id, series_id,
          title, slug, summary, content,
          featured_image, status, published_at, placements,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          translation_status, featured_image_alt, featured_image_caption, featured_image_credit,
          created_at, updated_at
      `;

      const values = [
        id, author_id, category_id || null, series_id || null,
        title, slug, summary || null, content,
        featured_image || null, status, published_at || null,
        placements && placements.length > 0 ? placements : ["latest_news"],
        ...TRANSLATION_COLUMNS.map((col) => translationValues?.[col] ?? null),
        translation_status || "none", imageMetadata.featured_image_alt || null, imageMetadata.featured_image_caption || null, imageMetadata.featured_image_credit || null,
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
  async updateArticle({imageMetadata = {},
    id,
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
    updatedFields,
    translation_status,
  }) {
    try {
      const setClauses = [];
      const values = [];
      let idx = 1;
      for (const key of ["featured_image_alt", "featured_image_caption", "featured_image_credit"]) {
        if(updatedFields.includes(key)) { setClauses.push(`${key} = $${idx}`); values.push(imageMetadata[key] || null); idx++; }
      }

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
      if (updatedFields.includes("translation_status") && translation_status) {
        setClauses.push(`translation_status = $${idx}`);
        values.push(translation_status);
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
          translation_status, featured_image_alt, featured_image_caption, featured_image_credit,
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
      const nextPlacements = placements ?? [];
      const query = `
        UPDATE articles
        SET placements = $1,
            headline_position = CASE
              WHEN NOT ('headline' = ANY($1::text[])) THEN NULL
              ELSE headline_position
            END,
            updated_at = NOW()
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING id, placements, headline_position, updated_at
      `;
      const result = await this.db.executeQuery(query, [nextPlacements, id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Article not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateArticlePlacements", "Error updating placements", error);
      return wrapper.error(error);
    }
  }

  /**
   * Assign headline slot 1-5 with collision shift.
   * Existing occupants at >= position move up by 1; anything past 5 drops off.
   * Pass position=null to clear the headline slot.
   */
  async assignHeadlinePosition({ id, position }) {
    try {
      if (position != null) {
        const current = await this.db.executeQuery(
          `
            SELECT headline_position
            FROM articles
            WHERE id = $1 AND deleted_at IS NULL
            LIMIT 1
          `,
          [id],
        );
        const currentPos = current?.rows?.[0]?.headline_position ?? null;
        if (currentPos === position) {
          const ensure = await this.db.executeQuery(
            `
              UPDATE articles
              SET placements = CASE
                    WHEN NOT ('headline' = ANY(placements))
                      THEN array_append(placements, 'headline')
                    ELSE placements
                  END,
                  headline_position = $2,
                  updated_at = NOW()
              WHERE id = $1
                AND deleted_at IS NULL
              RETURNING id, placements, headline_position, updated_at
            `,
            [id, position],
          );
          if (!ensure || ensure.rowCount === 0) {
            return wrapper.error(new InternalServerError("Unable to assign headline position"));
          }
          return wrapper.data(ensure.rows[0]);
        }
      }

      const queries = [];

      // Free this article's current slot first.
      queries.push({
        query: `
          UPDATE articles
          SET headline_position = NULL,
              updated_at = NOW()
          WHERE id = $1
            AND deleted_at IS NULL
        `,
        values: [id],
      });

      if (position == null) {
        queries.push({
          query: `
            UPDATE articles
            SET placements = array_remove(placements, 'headline'),
                headline_position = NULL,
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING id, placements, headline_position, updated_at
          `,
          values: [id],
        });
      } else {
        // Park colliding rows in a high temp band, then collapse +1.
        queries.push({
          query: `
            UPDATE articles
            SET headline_position = headline_position + 100,
                updated_at = NOW()
            WHERE deleted_at IS NULL
              AND id <> $1
              AND headline_position IS NOT NULL
              AND headline_position >= $2
          `,
          values: [id, position],
        });
        queries.push({
          query: `
            UPDATE articles
            SET headline_position = headline_position - 99,
                updated_at = NOW()
            WHERE deleted_at IS NULL
              AND headline_position > 100
          `,
          values: [],
        });
        queries.push({
          query: `
            UPDATE articles
            SET placements = array_remove(placements, 'headline'),
                headline_position = NULL,
                updated_at = NOW()
            WHERE deleted_at IS NULL
              AND headline_position IS NOT NULL
              AND headline_position > 5
          `,
          values: [],
        });
        queries.push({
          query: `
            UPDATE articles
            SET placements = CASE
                  WHEN NOT ('headline' = ANY(placements))
                    THEN array_append(placements, 'headline')
                  ELSE placements
                END,
                headline_position = $2,
                updated_at = NOW()
            WHERE id = $1
              AND deleted_at IS NULL
            RETURNING id, placements, headline_position, updated_at
          `,
          values: [id, position],
        });
      }

      const results = await this.db.executeTransaction(queries);
      if (!results) {
        return wrapper.error(new InternalServerError("Unable to assign headline position"));
      }
      const last = results[results.length - 1];
      return wrapper.data(last?.rows?.[0] ?? { id, headline_position: position });
    } catch (error) {
      logger.error(ctx, "assignHeadlinePosition", "Error assigning headline position", error);
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
  async updateArticleStatus({
    id,
    status,
    published_at,
    translationValues = null,
    translation_status = null,
  }) {
    try {
      const setClauses = [
        "status = $1",
        "published_at = $2",
        "updated_at = NOW()",
      ];
      const values = [status, published_at || null];
      let idx = 3;

      if (translation_status) {
        setClauses.push(`translation_status = $${idx}`);
        values.push(translation_status);
        idx += 1;
      }

      if (translationValues && typeof translationValues === "object") {
        for (const col of TRANSLATION_COLUMNS) {
          if (translationValues[col] === undefined) continue;
          setClauses.push(`${col} = $${idx}`);
          values.push(translationValues[col] ?? null);
          idx += 1;
        }
      }

      values.push(id);
      const query = `
        UPDATE articles
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
          AND deleted_at IS NULL
        RETURNING
          id, status, published_at, translation_status, updated_at,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz
      `;

      const result = await this.db.executeQuery(query, values);

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
