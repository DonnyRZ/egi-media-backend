const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { InternalServerError } = require("../../../../helpers/errors");
const ctx = "Column-Command";

const TRANSLATION_COLUMNS = [
  "title_en", "slug_en", "summary_en", "content_en",
  "title_uz", "slug_uz", "summary_uz", "content_uz",
];

class Command {
  constructor(db) {
    this.db = db;
  }

  async insertColumn({
    id,
    author_id,
    title,
    slug,
    summary,
    content,
    featured_image,
    status,
    translationValues,
  }) {
    try {
      const query = `
        INSERT INTO "columns" (
          id, author_id, title, slug, summary, content, featured_image,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          status, created_at, updated_at
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, NOW(), NOW()
        )
        RETURNING
          id, author_id, title, slug, summary, content, featured_image,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          status, rejection_reason, reviewed_by, reviewed_at, published_at,
          created_at, updated_at
      `;

      const values = [
        id, author_id, title, slug, summary || null, content, featured_image || null,
        ...TRANSLATION_COLUMNS.map((col) => translationValues?.[col] ?? null),
        status,
      ];

      const result = await this.db.executeQuery(query, values);
      if (!result || result.rowCount === 0) {
        return wrapper.error(new InternalServerError("Unable to create column"));
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "insertColumn", "Error inserting column", error);
      return wrapper.error(error);
    }
  }

  async updateColumn({ id, title, slug, summary, content, featured_image, translationValues, updatedFields }) {
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

      for (const col of TRANSLATION_COLUMNS) {
        if (updatedFields.includes(col)) {
          setClauses.push(`${col} = $${idx}`);
          values.push(translationValues?.[col] ?? null);
          idx++;
        }
      }

      setClauses.push("updated_at = NOW()");
      values.push(id);

      const query = `
        UPDATE "columns"
        SET ${setClauses.join(", ")}
        WHERE id = $${idx}
          AND deleted_at IS NULL
        RETURNING
          id, author_id, title, slug, summary, content, featured_image,
          title_en, slug_en, summary_en, content_en,
          title_uz, slug_uz, summary_uz, content_uz,
          status, rejection_reason, reviewed_by, reviewed_at, published_at,
          created_at, updated_at
      `;

      const result = await this.db.executeQuery(query, values);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateColumn", "Error updating column", error);
      return wrapper.error(error);
    }
  }

  async softDeleteColumn(id) {
    try {
      const query = `
        UPDATE "columns"
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
      `;
      const result = await this.db.executeQuery(query, [id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "softDeleteColumn", "Error soft deleting column", error);
      return wrapper.error(error);
    }
  }

  async updateColumnReview({ id, status, rejection_reason, reviewed_by, published_at }) {
    try {
      const query = `
        UPDATE "columns"
        SET status = $1,
            rejection_reason = $2,
            reviewed_by = $3,
            reviewed_at = NOW(),
            published_at = $4,
            updated_at = NOW()
        WHERE id = $5
          AND deleted_at IS NULL
        RETURNING
          id, author_id, title, slug, status, rejection_reason,
          reviewed_by, reviewed_at, published_at, updated_at
      `;
      const result = await this.db.executeQuery(query, [
        status,
        rejection_reason ?? null,
        reviewed_by,
        published_at ?? null,
        id,
      ]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateColumnReview", "Error updating column review", error);
      return wrapper.error(error);
    }
  }

  async updateColumnStatus({ id, status }) {
    try {
      const query = `
        UPDATE "columns"
        SET status = $1,
            updated_at = NOW()
        WHERE id = $2
          AND deleted_at IS NULL
        RETURNING id, status, updated_at
      `;
      const result = await this.db.executeQuery(query, [status, id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Column not found");
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "updateColumnStatus", "Error updating column status", error);
      return wrapper.error(error);
    }
  }

  async insertSavedColumn({ user_id, column_id }) {
    try {
      const query = `
        INSERT INTO saved_columns (user_id, column_id, created_at)
        VALUES ($1, $2, NOW())
      `;
      await this.db.executeQuery(query, [user_id, column_id]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertSavedColumn", "Error saving column", error);
      return wrapper.error(error);
    }
  }

  async deleteSavedColumn({ user_id, column_id }) {
    try {
      const query = `
        DELETE FROM saved_columns
        WHERE user_id = $1
          AND column_id = $2
      `;
      const result = await this.db.executeQuery(query, [user_id, column_id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Saved column not found");
      }
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "deleteSavedColumn", "Error removing saved column", error);
      return wrapper.error(error);
    }
  }

  async insertColumnShare({ id, column_id, user_id, platform }) {
    try {
      const query = `
        INSERT INTO column_shares (id, column_id, user_id, platform, shared_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await this.db.executeQuery(query, [id, column_id, user_id || null, platform]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertColumnShare", "Error recording column share", error);
      return wrapper.error(error);
    }
  }

  async insertColumnView({ id, column_id, user_id, ip_address }) {
    try {
      const query = `
        INSERT INTO column_views (id, column_id, user_id, ip_address, viewed_at)
        VALUES ($1, $2, $3, $4, NOW())
      `;
      await this.db.executeQuery(query, [id, column_id, user_id || null, ip_address || null]);
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "insertColumnView", "Error recording column view", error);
      return wrapper.error(error);
    }
  }

  async insertComment({ id, column_id, user_id, content }) {
    try {
      const query = `
        INSERT INTO column_comments (id, column_id, user_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING id, column_id, user_id, content, created_at, updated_at
      `;
      const result = await this.db.executeQuery(query, [id, column_id, user_id, content]);
      if (!result || result.rowCount === 0) {
        return wrapper.error(new InternalServerError("Unable to create comment"));
      }
      return wrapper.data(result.rows[0]);
    } catch (error) {
      logger.error(ctx, "insertComment", "Error inserting comment", error);
      return wrapper.error(error);
    }
  }

  async softDeleteComment(comment_id) {
    try {
      const query = `
        UPDATE column_comments
        SET deleted_at = NOW(), updated_at = NOW()
        WHERE id = $1
          AND deleted_at IS NULL
      `;
      const result = await this.db.executeQuery(query, [comment_id]);
      if (!result || result.rowCount === 0) {
        return wrapper.error("Comment not found");
      }
      return wrapper.data(true);
    } catch (error) {
      logger.error(ctx, "softDeleteComment", "Error soft deleting comment", error);
      return wrapper.error(error);
    }
  }
}

module.exports = Command;
