const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const ctx = "Column-Command-Domain";

const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base}-${uuidv4().split("-")[0]}`;
};

const TRANSLATION_LOCALES = ["en", "uz"];
const EDITABLE_STATUSES = ["draft", "pending_approval", "rejected"];

class ColumnCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  _buildTranslationValues(translations) {
    const translationValues = {};
    for (const loc of TRANSLATION_LOCALES) {
      const entry = translations?.[loc];
      if (!entry) continue;
      translationValues[`title_${loc}`] = entry.title;
      translationValues[`slug_${loc}`] = generateSlug(entry.title);
      translationValues[`summary_${loc}`] = entry.summary ?? null;
      translationValues[`content_${loc}`] = entry.content;
    }
    return translationValues;
  }

  async createColumn(payload) {
    const {
      author_id, title, summary, content, featured_image, translations, status,
    } = payload;

    const id = uuidv4();
    const slug = generateSlug(title);
    const translationValues = this._buildTranslationValues(translations);

    const result = await this.command.insertColumn({
      id,
      author_id,
      title,
      slug,
      summary,
      content,
      featured_image,
      status,
      translationValues,
    });

    if (result.err) {
      logger.error(ctx, "createColumn", "Failed to insert column", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "createColumn", "Column created successfully", { id, status });
    return wrapper.data(result.data);
  }

  async updateColumn(payload) {
    const {
      id, actor_id, actor_role,
      title, summary, content, featured_image, translations,
    } = payload;

    const columnExists = await this.query.findColumnExistsById(id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const column = columnExists.data;

    if (actor_role !== "superadmin" && column.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this column"));
    }

    if (actor_role !== "superadmin" && !EDITABLE_STATUSES.includes(column.status)) {
      return wrapper.error(
        new BadRequestError(`Cannot edit column with status '${column.status}'`)
      );
    }

    const updatedFields = [];
    if (title !== undefined) updatedFields.push("title", "slug");
    if (summary !== undefined) updatedFields.push("summary");
    if (content !== undefined) updatedFields.push("content");
    if (featured_image !== undefined) updatedFields.push("featured_image");

    const translationValues = {};
    for (const loc of TRANSLATION_LOCALES) {
      const entry = translations?.[loc];
      if (!entry) continue;
      if (entry.title !== undefined) {
        updatedFields.push(`title_${loc}`, `slug_${loc}`);
        translationValues[`title_${loc}`] = entry.title;
        translationValues[`slug_${loc}`] = generateSlug(entry.title);
      }
      if (entry.summary !== undefined) {
        updatedFields.push(`summary_${loc}`);
        translationValues[`summary_${loc}`] = entry.summary ?? null;
      }
      if (entry.content !== undefined) {
        updatedFields.push(`content_${loc}`);
        translationValues[`content_${loc}`] = entry.content;
      }
    }

    if (updatedFields.length === 0) {
      return wrapper.error(new BadRequestError("At least one field must be provided"));
    }

    const slug = title ? generateSlug(title) : undefined;
    const result = await this.command.updateColumn({
      id, title, slug, summary, content, featured_image, translationValues, updatedFields,
    });

    if (result.err) {
      logger.error(ctx, "updateColumn", "Failed to update column", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "updateColumn", "Column updated successfully", { id });
    return wrapper.data(result.data);
  }

  async deleteColumn(payload) {
    const { id, actor_id, actor_role } = payload;

    const columnExists = await this.query.findColumnExistsById(id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const column = columnExists.data;
    if (actor_role !== "superadmin" && column.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to delete this column"));
    }

    const result = await this.command.softDeleteColumn(id);
    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "deleteColumn", "Column soft deleted", { id });
    return wrapper.data(true);
  }

  async submitColumn(payload) {
    const { id, actor_id, actor_role } = payload;

    const columnExists = await this.query.findColumnExistsById(id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const column = columnExists.data;
    if (actor_role !== "superadmin" && column.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to submit this column"));
    }

    if (!["draft", "rejected"].includes(column.status)) {
      return wrapper.error(
        new BadRequestError(`Cannot submit column with status '${column.status}'`)
      );
    }

    const result = await this.command.updateColumnStatus({ id, status: "pending_approval" });
    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "submitColumn", "Column submitted for approval", { id });
    return wrapper.data(result.data);
  }

  async approveColumn(payload) {
    const { id, actor_id, actor_role } = payload;

    if (actor_role !== "superadmin") {
      return wrapper.error(new ForbiddenError("Only superadmin can approve columns"));
    }

    const columnExists = await this.query.findColumnExistsById(id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    if (columnExists.data.status !== "pending_approval") {
      return wrapper.error(
        new BadRequestError(`Cannot approve column with status '${columnExists.data.status}'`)
      );
    }

    const result = await this.command.updateColumnReview({
      id,
      status: "published",
      rejection_reason: null,
      reviewed_by: actor_id,
      published_at: new Date(),
    });

    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "approveColumn", "Column approved", { id });
    return wrapper.data(result.data);
  }

  async rejectColumn(payload) {
    const { id, actor_id, actor_role, rejection_reason } = payload;

    if (actor_role !== "superadmin") {
      return wrapper.error(new ForbiddenError("Only superadmin can reject columns"));
    }

    const columnExists = await this.query.findColumnExistsById(id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    if (columnExists.data.status !== "pending_approval") {
      return wrapper.error(
        new BadRequestError(`Cannot reject column with status '${columnExists.data.status}'`)
      );
    }

    const result = await this.command.updateColumnReview({
      id,
      status: "rejected",
      rejection_reason,
      reviewed_by: actor_id,
      published_at: null,
    });

    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "rejectColumn", "Column rejected", { id });
    return wrapper.data(result.data);
  }

  async saveColumn(payload) {
    const { id: column_id, user_id } = payload;

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }
    if (columnExists.data.status !== "published") {
      return wrapper.error(new BadRequestError("Only published columns can be saved"));
    }

    const savedRecord = await this.query.findSavedRecord(user_id, column_id);
    if (!savedRecord.err) {
      return wrapper.error(new ConflictError("Column already saved"));
    }

    const result = await this.command.insertSavedColumn({ user_id, column_id });
    if (result.err) {
      return wrapper.error(result.err);
    }

    return wrapper.data(true);
  }

  async unsaveColumn(payload) {
    const { id: column_id, user_id } = payload;

    const savedRecord = await this.query.findSavedRecord(user_id, column_id);
    if (savedRecord.err) {
      return wrapper.error(new NotFoundError("Saved column not found"));
    }

    const result = await this.command.deleteSavedColumn({ user_id, column_id });
    if (result.err) {
      return wrapper.error(result.err);
    }

    return wrapper.data(true);
  }

  async shareColumn(payload) {
    const { id: column_id, user_id, platform } = payload;

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }
    if (columnExists.data.status !== "published") {
      return wrapper.error(new BadRequestError("Only published columns can be shared"));
    }

    const shareId = uuidv4();
    const result = await this.command.insertColumnShare({
      id: shareId,
      column_id,
      user_id: user_id || null,
      platform,
    });
    if (result.err) {
      return wrapper.error(result.err);
    }

    const countResult = await this.query.countColumnShares(column_id);
    return wrapper.data({ share_count: countResult.err ? null : countResult.data });
  }

  async recordColumnView(payload) {
    const { id: column_id, user_id, ip_address } = payload;

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }
    if (columnExists.data.status !== "published") {
      return wrapper.error(new BadRequestError("Only published columns can be viewed"));
    }

    const viewId = uuidv4();
    const result = await this.command.insertColumnView({
      id: viewId,
      column_id,
      user_id: user_id || null,
      ip_address: ip_address || null,
    });
    if (result.err) {
      return wrapper.error(result.err);
    }

    const countResult = await this.query.countColumnViews(column_id);
    return wrapper.data({ view_count: countResult.err ? null : countResult.data });
  }

  async createComment(payload) {
    const { column_id, user_id, content } = payload;

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }
    if (columnExists.data.status !== "published") {
      return wrapper.error(new BadRequestError("Only published columns can be commented on"));
    }

    const id = uuidv4();
    const result = await this.command.insertComment({ id, column_id, user_id, content });
    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "createComment", "Comment created", { id, column_id });
    return wrapper.data(result.data);
  }

  async deleteComment(payload) {
    const { column_id, comment_id, actor_id, actor_role } = payload;

    const commentExists = await this.query.findCommentExistsById(comment_id, column_id);
    if (commentExists.err) {
      return wrapper.error(new NotFoundError("Comment not found"));
    }

    const columnExists = await this.query.findColumnExistsById(column_id);
    if (columnExists.err) {
      return wrapper.error(new NotFoundError("Column not found"));
    }

    const actorId = actor_id ? String(actor_id) : "";
    const commentAuthorId = commentExists.data.user_id
      ? String(commentExists.data.user_id)
      : "";
    const columnAuthorId = columnExists.data.author_id
      ? String(columnExists.data.author_id)
      : "";
    const role = typeof actor_role === "string" ? actor_role.trim().toLowerCase() : "";

    // Registered default role is visitor — they may comment, but never delete.
    if (!role || role === "visitor") {
      return wrapper.error(
        new ForbiddenError("Visitors are not allowed to delete comments")
      );
    }

    const isCommentOwner = Boolean(actorId) && actorId === commentAuthorId;
    const isColumnAuthor = Boolean(actorId) && actorId === columnAuthorId;
    const isSuperadmin = role === "superadmin";

    if (!isCommentOwner && !isColumnAuthor && !isSuperadmin) {
      logger.info(ctx, "deleteComment", "Delete denied", {
        comment_id,
        actor_id: actorId,
        comment_author_id: commentAuthorId,
        column_author_id: columnAuthorId,
        actor_role: role,
      });
      return wrapper.error(
        new ForbiddenError(
          "Only the comment owner, column author, or superadmin can delete this comment"
        )
      );
    }

    const result = await this.command.softDeleteComment(comment_id);
    if (result.err) {
      return wrapper.error(result.err);
    }

    logger.info(ctx, "deleteComment", "Comment deleted", {
      comment_id,
      by: isSuperadmin ? "superadmin" : isColumnAuthor ? "column_author" : "comment_owner",
    });
    return wrapper.data(true);
  }
}

module.exports = ColumnCommandDomain;
