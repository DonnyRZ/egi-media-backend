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

// ─── Validasi status transition yang diizinkan ────────────────────────────────
const ALLOWED_TRANSITIONS = {
  draft: ["review", "scheduled", "published"],
  review: ["published", "draft"],
  scheduled: ["published", "draft"],
  published: ["archived"],
  archived: [],
};

class ArticleCommandDomain {
  constructor(db) {
    this.command = new Command(db);
    this.query = new Query(db);
  }

  // ─── Create Article ─────────────────────────────────────────────────────────
  async createArticle(payload) {
    const {
      author_id, category_id, series_id,
      title, summary, content, featured_image,
      translations, status, published_at, topic_ids, tag_ids,
    } = payload;

    // Validasi: jika status scheduled maka published_at wajib
    if (status === "scheduled" && !published_at) {
      return wrapper.error(new BadRequestError("published_at is required when status is 'scheduled'"));
    }

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
      featured_image, status, published_at, translationValues, topic_ids, tag_ids,
    });

    if (articleResult.err) {
      logger.error(ctx, "createArticle", "Failed to insert article", articleResult.err);
      return wrapper.error(articleResult.err);
    }

    logger.info(ctx, "createArticle", "Article created successfully", { id });
    return wrapper.data(articleResult.data);
  }

  // ─── Update Article ─────────────────────────────────────────────────────────
  async updateArticle(payload) {
    const {
      id, actor_id, actor_role,
      category_id, series_id, title, summary,
      content, featured_image, translations, status, published_at,
      topic_ids, tag_ids,
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
      summary, content, featured_image, translationValues, status, published_at,
      topic_ids, tag_ids, updatedFields,
    });

    if (updateResult.err) {
      logger.error(ctx, "updateArticle", "Failed to update article", updateResult.err);
      return wrapper.error(updateResult.err);
    }

    logger.info(ctx, "updateArticle", "Article updated successfully", { id });
    return wrapper.data(updateResult.data);
  }

  // ─── Delete Article (Soft Delete) ───────────────────────────────────────────
  async deleteArticle(payload) {
    const { id, actor_id, actor_role } = payload;

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

    logger.info(ctx, "deleteArticle", "Article soft deleted successfully", { id });
    return wrapper.data(true);
  }

  // ─── Change Article Status ──────────────────────────────────────────────────
  async changeStatus(payload) {
    const { id, actor_id, actor_role, status, published_at } = payload;

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

    // Validasi status transition
    const allowedNext = ALLOWED_TRANSITIONS[article.status] || [];
    if (!allowedNext.includes(status)) {
      return wrapper.error(
        new BadRequestError(`Cannot transition from '${article.status}' to '${status}'`)
      );
    }

    // Validasi: scheduled butuh published_at
    if (status === "scheduled" && !published_at) {
      return wrapper.error(new BadRequestError("published_at is required when status is 'scheduled'"));
    }

    // Set published_at otomatis jika status published
    const finalPublishedAt = status === "published" && !published_at ? new Date() : published_at;

    const result = await this.command.updateArticleStatus({ id, status, published_at: finalPublishedAt });
    if (result.err) {
      logger.error(ctx, "changeStatus", "Failed to update article status", result.err);
      return wrapper.error(result.err);
    }

    logger.info(ctx, "changeStatus", "Article status changed", { id, status });
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

    // Cek artikel exists
    const articleExists = await this.query.findArticleExistsById(article_id);
    if (articleExists.err) {
      logger.error(ctx, "shareArticle", "Article not found", { article_id });
      return wrapper.error(new NotFoundError("Article not found"));
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
