const { v4: uuidv4 } = require("uuid");
const Command = require("./command");
const Query = require("../queries/query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { insertAuditLog } = require("../../../../helpers/utils/audit_log");
const {
  NotFoundError,
  ConflictError,
  BadRequestError,
  ForbiddenError,
} = require("../../../../helpers/errors");
const ctx = "Article-Command-Domain";

// ─── Helper: generate slug dari title ────────────────────────────────────────
const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${base}-${uuidv4().split("-")[0]}`;
};

// Optional translated locales (Indonesian is primary and stored in base columns).
const TRANSLATION_LOCALES = ["en", "uz"];

const NON_DRAFT_STATUSES = ["review", "scheduled", "published"];

// ─── Validasi status transition yang diizinkan ────────────────────────────────
const ALLOWED_TRANSITIONS = {
  draft: ["review", "scheduled", "published"],
  review: ["published", "draft"],
  scheduled: ["published", "draft"],
  published: ["archived"],
  archived: ["draft", "published"],
};

/** Map status transitions to newsroom-readable audit action labels. */
const resolveStatusAuditAction = (fromStatus, toStatus) => {
  if (toStatus === "archived") return "ARCHIVED";
  if (fromStatus === "archived") return "RESTORED";
  if (toStatus === "published") return "PUBLISHED";
  if (toStatus === "scheduled") return "SCHEDULED";
  if (toStatus === "review") return "SUBMITTED_FOR_REVIEW";
  if (toStatus === "draft") return "REVERTED_TO_DRAFT";
  return "STATUS_CHANGE";
};

class ArticleCommandDomain {
  constructor(db) {
    this.db = db;
    this.command = new Command(db);
    this.query = new Query(db);
  }

  async writeAudit({
    user_id,
    record_id,
    action,
    old_data = null,
    new_data = null,
    ip_address = null,
    user_agent = null,
  }) {
    await insertAuditLog(this.db, {
      user_id,
      table_name: "articles",
      record_id,
      action,
      old_data,
      new_data,
      ip_address,
      user_agent,
    });
  }

  requireCategoryForStatus(status, categoryId) {
    if (!NON_DRAFT_STATUSES.includes(status)) return null;
    if (categoryId) return null;
    return wrapper.error(
      new BadRequestError(
        "category_id is required before submit for review, schedule, or publish",
      ),
    );
  }

  // ─── Create Article ─────────────────────────────────────────────────────────
  async createArticle(payload) {
    const {
      author_id, category_id, series_id,
      title, summary, content, featured_image,
      translations, status, published_at, topic_ids, tag_ids, placements,
      ip_address, user_agent,
    } = payload;

    // Validasi: jika status scheduled maka published_at wajib
    if (status === "scheduled" && !published_at) {
      return wrapper.error(new BadRequestError("published_at is required when status is 'scheduled'"));
    }

    const categoryError = this.requireCategoryForStatus(status, category_id);
    if (categoryError) return categoryError;

    const id = uuidv4();
    const slug = generateSlug(title);

    // Bangun kolom terjemahan (en/uz) beserta slug per locale bila disediakan.
    const translationValues = {};
    for (const loc of TRANSLATION_LOCALES) {
      const entry = translations?.[loc];
      if (!entry) continue;
      translationValues[`title_${loc}`] = entry.title;
      translationValues[`slug_${loc}`] = generateSlug(entry.title);
      translationValues[`summary_${loc}`] = entry.summary ?? null;
      translationValues[`content_${loc}`] = entry.content;
    }

    const articleResult = await this.command.insertArticle({
      id, author_id, category_id, series_id,
      title, slug, summary, content,
      featured_image, status, published_at,
      placements: placements && placements.length > 0 ? placements : ["latest_news"],
      translationValues, topic_ids, tag_ids,
    });

    if (articleResult.err) {
      logger.error(ctx, "createArticle", "Failed to insert article", articleResult.err);
      return wrapper.error(articleResult.err);
    }

    await this.writeAudit({
      user_id: author_id,
      record_id: id,
      action: "CREATE",
      new_data: {
        article_title: title,
        title,
        status: status || "draft",
        category_id: category_id || null,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "createArticle", "Article created successfully", { id });
    return wrapper.data(articleResult.data);
  }

  // ─── Update Article ─────────────────────────────────────────────────────────
  async updateArticle(payload) {
    const {
      id, actor_id, actor_role,
      category_id, series_id, title, summary,
      content, featured_image, translations, status, published_at,
      topic_ids, tag_ids, placements,
      ip_address, user_agent,
    } = payload;

    // Cek artikel exists
    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      logger.error(ctx, "updateArticle", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;

    // Cek ownership: hanya superadmin atau author artikel itu sendiri
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this article"));
    }

    const nextStatus = status !== undefined ? status : article.status;
    const nextCategoryId =
      category_id !== undefined ? category_id : article.category_id;
    const categoryError = this.requireCategoryForStatus(nextStatus, nextCategoryId);
    if (categoryError) return categoryError;

    // Tentukan field mana yang akan diupdate
    const updatedFields = [];
    if (title !== undefined) updatedFields.push("title", "slug");
    if (summary !== undefined) updatedFields.push("summary");
    if (content !== undefined) updatedFields.push("content");
    if (featured_image !== undefined) updatedFields.push("featured_image");
    if (status !== undefined) updatedFields.push("status");
    if (published_at !== undefined) updatedFields.push("published_at");
    if (category_id !== undefined) updatedFields.push("category_id");
    if (series_id !== undefined) updatedFields.push("series_id");
    if (placements !== undefined) updatedFields.push("placements");

    // Terjemahan opsional (en/uz): patch per field, regenerasi slug bila title diubah.
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

    if (updatedFields.length === 0 && topic_ids === undefined && tag_ids === undefined) {
      return wrapper.error(new BadRequestError("At least one field must be provided"));
    }

    const slug = title ? generateSlug(title) : undefined;

    const updateResult = await this.command.updateArticle({
      id, category_id, series_id, title, slug,
      summary, content, featured_image, placements, translationValues, status, published_at,
      topic_ids, tag_ids, updatedFields,
    });

    if (updateResult.err) {
      logger.error(ctx, "updateArticle", "Failed to update article", updateResult.err);
      return wrapper.error(updateResult.err);
    }

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: "UPDATE",
      old_data: {
        article_title: article.title,
        title: article.title,
        status: article.status,
        category_id: article.category_id,
      },
      new_data: {
        article_title: title ?? article.title,
        title: title ?? article.title,
        status: nextStatus,
        category_id: nextCategoryId ?? null,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "updateArticle", "Article updated successfully", { id });
    return wrapper.data(updateResult.data);
  }

  // ─── Update Article Placements (quick edit) ─────────────────────────────────
  async updatePlacements(payload) {
    const { id, actor_id, actor_role, placements, ip_address, user_agent } = payload;

    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      logger.error(ctx, "updatePlacements", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this article"));
    }

    const result = await this.command.updateArticlePlacements({ id, placements });
    if (result.err) {
      logger.error(ctx, "updatePlacements", "Failed to update placements", result.err);
      return wrapper.error(result.err);
    }

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: "UPDATE",
      old_data: {
        article_title: article.title,
        title: article.title,
        status: article.status,
      },
      new_data: {
        article_title: article.title,
        title: article.title,
        status: article.status,
        placements,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "updatePlacements", "Article placements updated", { id, placements });
    return wrapper.data(result.data);
  }

  // ─── Delete Article (Soft Delete) ───────────────────────────────────────────
  async deleteArticle(payload) {
    const { id, actor_id, actor_role, ip_address, user_agent } = payload;

    // Cek artikel exists
    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      logger.error(ctx, "deleteArticle", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;

    // Cek ownership
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to delete this article"));
    }

    const result = await this.command.softDeleteArticle(id);
    if (result.err) {
      logger.error(ctx, "deleteArticle", "Failed to delete article", result.err);
      return wrapper.error(result.err);
    }

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: "TRASHED",
      old_data: {
        article_title: article.title,
        title: article.title,
        status: article.status,
        category_id: article.category_id,
      },
      new_data: {
        article_title: article.title,
        title: article.title,
        status: "trashed",
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "deleteArticle", "Article soft deleted successfully", { id });
    return wrapper.data(true);
  }

  // ─── Change Article Status ──────────────────────────────────────────────────
  async changeStatus(payload) {
    const { id, actor_id, actor_role, status, published_at, ip_address, user_agent } = payload;

    // Cek artikel exists
    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      logger.error(ctx, "changeStatus", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;

    // Cek ownership
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to change this article's status"));
    }

    // Author hanya boleh submit review atau kembali ke draft (termasuk unarchive
    // ke draft). Publish, schedule, archive, dan republish = superadmin.
    const AUTHOR_ALLOWED_STATUS = ["review", "draft"];
    if (actor_role !== "superadmin" && !AUTHOR_ALLOWED_STATUS.includes(status)) {
      return wrapper.error(
        new ForbiddenError("Only superadmin can publish, schedule, archive, or republish articles")
      );
    }

    // Validasi status transition
    const allowedNext = ALLOWED_TRANSITIONS[article.status] || [];
    if (!allowedNext.includes(status)) {
      return wrapper.error(
        new BadRequestError(`Cannot transition from '${article.status}' to '${status}'`)
      );
    }

    const categoryError = this.requireCategoryForStatus(status, article.category_id);
    if (categoryError) return categoryError;

    // Validasi: scheduled butuh published_at
    if (status === "scheduled" && !published_at) {
      return wrapper.error(new BadRequestError("published_at is required when status is 'scheduled'"));
    }

    // Preserve the original publication date whenever it already exists.
    // Only stamp "now" the first time an article becomes published.
    let finalPublishedAt = article.published_at ?? null;
    if (status === "published") {
      finalPublishedAt = published_at ?? article.published_at ?? new Date();
    } else if (status === "scheduled") {
      finalPublishedAt = published_at;
    } else if (published_at !== undefined && published_at !== null) {
      finalPublishedAt = published_at;
    }

    const result = await this.command.updateArticleStatus({ id, status, published_at: finalPublishedAt });
    if (result.err) {
      logger.error(ctx, "changeStatus", "Failed to update article status", result.err);
      return wrapper.error(result.err);
    }

    const auditAction = resolveStatusAuditAction(article.status, status);

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: auditAction,
      old_data: {
        article_title: article.title,
        title: article.title,
        status: article.status,
        from_status: article.status,
        published_at: article.published_at,
      },
      new_data: {
        article_title: article.title,
        title: article.title,
        status,
        from_status: article.status,
        to_status: status,
        published_at: finalPublishedAt,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "changeStatus", "Article status changed", {
      id,
      status,
      auditAction,
    });
    return wrapper.data(result.data);
  }

  // ─── Save Article ───────────────────────────────────────────────────────────
  async saveArticle(payload) {
    const { id: article_id, user_id } = payload;

    // Cek artikel exists
    const articleExists = await this.query.findArticleExistsById(article_id);
    if (articleExists.err) {
      logger.error(ctx, "saveArticle", "Article not found", { article_id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    // Cek apakah sudah disave
    const savedRecord = await this.query.findSavedRecord(user_id, article_id);
    if (!savedRecord.err) {
      return wrapper.error(new ConflictError("Article already saved"));
    }

    const result = await this.command.insertSavedArticle({ user_id, article_id });
    if (result.err) {
      logger.error(ctx, "saveArticle", "Failed to save article", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "saveArticle", "Article saved successfully", { article_id, user_id });
    return wrapper.data(true);
  }

  // ─── Unsave Article ─────────────────────────────────────────────────────────
  async unsaveArticle(payload) {
    const { id: article_id, user_id } = payload;

    // Cek apakah save record ada
    const savedRecord = await this.query.findSavedRecord(user_id, article_id);
    if (savedRecord.err) {
      return wrapper.error(new NotFoundError("Saved article not found"));
    }

    const result = await this.command.deleteSavedArticle({ user_id, article_id });
    if (result.err) {
      logger.error(ctx, "unsaveArticle", "Failed to unsave article", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "unsaveArticle", "Article unsaved successfully", { article_id, user_id });
    return wrapper.data(true);
  }

  // ─── Share Article ──────────────────────────────────────────────────────────
  async shareArticle(payload) {
    const { id: article_id, user_id, platform } = payload;

    const articleExists = await this.query.findArticleExistsById(article_id);
    if (articleExists.err) {
      logger.error(ctx, "shareArticle", "Article not found", { article_id });
      return wrapper.error(new NotFoundError("Article not found"));
    }
    if (articleExists.data.status !== "published") {
      return wrapper.error(
        new BadRequestError("Only published articles can be shared")
      );
    }

    const shareId = uuidv4();
    const result = await this.command.insertArticleShare({
      id: shareId,
      article_id,
      user_id: user_id || null,
      platform,
    });
    if (result.err) {
      logger.error(ctx, "shareArticle", "Failed to record article share", result.err);
      return wrapper.error(result.err);
    }

    const countResult = await this.query.countArticleShares(article_id);
    const share_count = countResult.err ? null : countResult.data;

    logger.info(ctx, "shareArticle", "Article share recorded", { article_id, user_id, platform });
    return wrapper.data({ share_count });
  }

  // ─── Record Article View ────────────────────────────────────────────────────
  async recordArticleView(payload) {
    const { id: article_id, user_id, ip_address } = payload;

    const articleExists = await this.query.findArticleExistsById(article_id);
    if (articleExists.err) {
      logger.error(ctx, "recordArticleView", "Article not found", { article_id });
      return wrapper.error(new NotFoundError("Article not found"));
    }
    if (articleExists.data.status !== "published") {
      return wrapper.error(
        new BadRequestError("Only published articles can be viewed")
      );
    }

    const viewId = uuidv4();
    const result = await this.command.insertArticleView({
      id: viewId,
      article_id,
      user_id: user_id || null,
      ip_address: ip_address || null,
    });
    if (result.err) {
      logger.error(ctx, "recordArticleView", "Failed to record article view", result.err);
      return wrapper.error(result.err);
    }

    const countResult = await this.query.countArticleViews(article_id);
    const view_count = countResult.err ? null : countResult.data;

    logger.info(ctx, "recordArticleView", "Article view recorded", { article_id });
    return wrapper.data({ view_count });
  }
}

module.exports = ArticleCommandDomain;
