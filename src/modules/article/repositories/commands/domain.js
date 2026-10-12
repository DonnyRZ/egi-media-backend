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
const { notifyTopicSubscribersOnPublish } = require("../../../../helpers/utils/topicPublishNotifier");
const { notifyEditorsOfSubmission } = require("../../../../helpers/utils/reviewNotifier");
const { translateArticle } = require("../../../../services/aiTranslation");
const {
  localesComplete,
  enqueueArticleTranslation,
} = require("../../../../helpers/utils/articleTranslationEnqueue");
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

// AI auto-translate runs only when the article is final (or becoming final).
const AI_TRANSLATION_STATUSES = ["published", "scheduled"];

function isAiTranslationStatus(status) {
  return AI_TRANSLATION_STATUSES.includes(status);
}

function buildTranslationValues(resolvedTranslations) {
  const translationValues = {};
  for (const loc of TRANSLATION_LOCALES) {
    const entry = resolvedTranslations?.[loc];
    if (!entry?.title?.trim() || !entry?.content?.trim()) continue;
    translationValues[`title_${loc}`] = entry.title.trim();
    translationValues[`slug_${loc}`] = generateSlug(entry.title);
    translationValues[`summary_${loc}`] = entry.summary ?? null;
    translationValues[`content_${loc}`] = entry.content;
  }
  return translationValues;
}

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
    article_title = null,
  }) {
    const result = await insertAuditLog(this.db, {
      user_id,
      table_name: "articles",
      resource_type: "Article",
      record_id,
      action,
      old_data,
      new_data,
      ip_address,
      user_agent,
      article_title,
    });

    if (result.err) {
      logger.error(ctx, "writeAudit", "Audit log write failed", {
        action,
        record_id,
        user_id,
        error: result.err?.message || result.err,
      });
    }

    return result;
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

  /**
   * Resolve EN/UZ translations from explicit payload and optionally AI.
   * AI runs only when allowAi=true (article is / becoming published or scheduled).
   * On AI failure: keep Indonesian-only (do not block save). Errors are logged safely.
   */
  async resolveTranslations({ title, content, translations, allowAi = false }) {
    const next = {
      en: translations?.en ? { ...translations.en } : null,
      uz: translations?.uz ? { ...translations.uz } : null,
    };

    const needsAi = TRANSLATION_LOCALES.some((loc) => {
      const entry = next[loc];
      return !(entry?.title?.trim() && entry?.content?.trim());
    });

    if (!needsAi || !allowAi) return next;

    const aiResult = await translateArticle(title, content);
    if (aiResult.status !== "success") {
      logger.warn(ctx, "resolveTranslations", "AI translation fallback to Indonesian-only", {
        status: aiResult.status,
        requestId: aiResult.meta?.requestId || null,
        promptId: aiResult.meta?.promptId || null,
        promptVersion: aiResult.meta?.promptVersion || null,
      });
      return next;
    }

    for (const loc of TRANSLATION_LOCALES) {
      const existing = next[loc];
      const generated = aiResult.result?.[loc];
      if (existing?.title?.trim() && existing?.content?.trim()) continue;
      if (!generated?.title?.trim() || !generated?.content?.trim()) continue;

      next[loc] = {
        title: generated.title.trim(),
        content: generated.content,
        // AI schema covers title/content only; keep existing summary override if any.
        summary:
          existing?.summary !== undefined && existing?.summary !== null
            ? existing.summary
            : null,
      };
    }

    return next;
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

    // Draft/review: persist explicit EN/UZ only.
    // Final statuses: explicit overrides win; otherwise enqueue async AI translate.
    const resolvedTranslations = await this.resolveTranslations({
      title,
      content,
      translations,
      allowAi: false,
    });
    const translationValues = buildTranslationValues(resolvedTranslations);
    const finalStatus = status || "draft";
    let translationStatus = "none";
    if (isAiTranslationStatus(finalStatus)) {
      translationStatus = localesComplete({
        en: resolvedTranslations.en,
        uz: resolvedTranslations.uz,
      })
        ? "ready"
        : "pending";
    }

    const articleResult = await this.command.insertArticle({
      imageMetadata: payload,
      id, author_id, category_id, series_id,
      title, slug, summary, content,
      featured_image, status, published_at,
      placements: placements && placements.length > 0 ? placements : ["latest_news"],
      translationValues, topic_ids, tag_ids,
      translation_status: translationStatus,
    });

    if (articleResult.err) {
      logger.error(ctx, "createArticle", "Failed to insert article", articleResult.err);
      return wrapper.error(articleResult.err);
    }

    await this.writeAudit({
      user_id: author_id,
      record_id: id,
      action: "CREATE",
      article_title: title,
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

    if (finalStatus === "review") {
      void notifyEditorsOfSubmission({
        db: this.db,
        actorId: author_id,
        resourceLabel: "article",
        title,
      });
    }

    if (isAiTranslationStatus(finalStatus) && translationStatus === "pending") {
      await enqueueArticleTranslation({
        db: this.db,
        articleId: id,
        requestedBy: author_id,
        targetStatus: finalStatus,
      });
    } else if (finalStatus === "published" && translationStatus === "ready") {
      void notifyTopicSubscribersOnPublish({
        db: this.db,
        article: articleResult.data,
        topicIds: topic_ids || [],
      });
    }

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
    for (const key of ["featured_image_alt", "featured_image_caption", "featured_image_credit"]) { if(payload[key] !== undefined) updatedFields.push(key); }
    if (title !== undefined) { updatedFields.push("title"); if(title !== article.title) updatedFields.push("slug"); }
    if (summary !== undefined) updatedFields.push("summary");
    if (content !== undefined) updatedFields.push("content");
    if (featured_image !== undefined) updatedFields.push("featured_image");
    if (status !== undefined) updatedFields.push("status");
    if (published_at !== undefined) updatedFields.push("published_at");
    if (category_id !== undefined) updatedFields.push("category_id");
    if (series_id !== undefined) updatedFields.push("series_id");
    if (placements !== undefined) updatedFields.push("placements");

    const effectiveTitle = title !== undefined ? title : article.title;
    const effectiveContent = content !== undefined ? content : article.content;
    const contentChanged = (title !== undefined && title !== article.title) || (content !== undefined && content !== article.content);

    const becomingFinal =
      isAiTranslationStatus(nextStatus) &&
      (!isAiTranslationStatus(article.status) || contentChanged);
    const missingLocales = TRANSLATION_LOCALES.some((loc) => {
      const entry = translations?.[loc];
      const hasPayload = entry?.title?.trim() && entry?.content?.trim();
      const hasStored =
        article[`title_${loc}`]?.trim() && article[`content_${loc}`]?.trim();
      return !hasPayload && (contentChanged || !hasStored);
    });

    // Persist explicit EN/UZ overrides only (AI runs async via the queue).
    const translationValues = {};
    if (translations) {
      const resolvedTranslations = await this.resolveTranslations({
        title: effectiveTitle,
        content: effectiveContent,
        translations,
        allowAi: false,
      });
      for (const loc of TRANSLATION_LOCALES) {
        const entry = resolvedTranslations?.[loc];
        if (!entry) continue;
        if (entry.title !== undefined) {
          updatedFields.push(`title_${loc}`);
          if(entry.title !== article[`title_${loc}`]) updatedFields.push(`slug_${loc}`);
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
    }

    let nextTranslationStatus;
    if (isAiTranslationStatus(nextStatus)) {
      const mergedForCheck = {
        title_en: translationValues.title_en ?? article.title_en,
        content_en: translationValues.content_en ?? article.content_en,
        title_uz: translationValues.title_uz ?? article.title_uz,
        content_uz: translationValues.content_uz ?? article.content_uz,
      };
      if (localesComplete(mergedForCheck)) {
        nextTranslationStatus = "ready";
      } else if (becomingFinal || missingLocales || article.translation_status === "failed") {
        nextTranslationStatus = "pending";
      }
    } else if (status !== undefined && !isAiTranslationStatus(nextStatus)) {
      nextTranslationStatus = "none";
    }
    if (nextTranslationStatus) {
      updatedFields.push("translation_status");
    }

    if (updatedFields.length === 0 && topic_ids === undefined && tag_ids === undefined) {
      return wrapper.error(new BadRequestError("At least one field must be provided"));
    }

    const slug = title ? generateSlug(title) : undefined;

    const updateResult = await this.command.updateArticle({
      imageMetadata: payload,
      id, category_id, series_id, title, slug,
      summary, content, featured_image, placements, translationValues, status, published_at,
      topic_ids, tag_ids, updatedFields,
      translation_status: nextTranslationStatus,
    });

    if (updateResult.err) {
      logger.error(ctx, "updateArticle", "Failed to update article", updateResult.err);
      return wrapper.error(updateResult.err);
    }

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: "UPDATE",
      article_title: title ?? article.title,
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

    if (article.status !== "review" && nextStatus === "review") {
      void notifyEditorsOfSubmission({
        db: this.db,
        actorId: actor_id,
        resourceLabel: "article",
        title: title ?? article.title,
      });
    }

    if (nextTranslationStatus === "pending") {
      await enqueueArticleTranslation({
        db: this.db,
        articleId: id,
        requestedBy: actor_id,
        targetStatus: nextStatus,
      });
    } else if (
      article.status !== "published" &&
      nextStatus === "published" &&
      nextTranslationStatus === "ready"
    ) {
      void notifyTopicSubscribersOnPublish({
        db: this.db,
        article: updateResult.data,
        topicIds: topic_ids,
      });
    }

    return wrapper.data(updateResult.data);
  }

  // ─── Update Article Placements (quick edit) ─────────────────────────────────
  async updatePlacements(payload) {
    const {
      id,
      actor_id,
      actor_role,
      placements,
      headline_position,
      ip_address,
      user_agent,
    } = payload;

    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      logger.error(ctx, "updatePlacements", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to update this article"));
    }

    const hasHeadline = Array.isArray(placements) && placements.includes("headline");
    if (hasHeadline) {
      if (
        headline_position == null ||
        !Number.isInteger(headline_position) ||
        headline_position < 1 ||
        headline_position > 5
      ) {
        return wrapper.error(
          new BadRequestError(
            "headline_position (1-5) is required when Headline placement is selected",
          ),
        );
      }
    }

    const placementsResult = await this.command.updateArticlePlacements({
      id,
      placements,
    });
    if (placementsResult.err) {
      logger.error(ctx, "updatePlacements", "Failed to update placements", placementsResult.err);
      return wrapper.error(placementsResult.err);
    }

    const positionResult = await this.command.assignHeadlinePosition({
      id,
      position: hasHeadline ? headline_position : null,
    });
    if (positionResult.err) {
      logger.error(ctx, "updatePlacements", "Failed to assign headline position", positionResult.err);
      return wrapper.error(positionResult.err);
    }

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: "UPDATE",
      article_title: article.title,
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
        headline_position: hasHeadline ? headline_position : null,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "updatePlacements", "Article placements updated", {
      id,
      placements,
      headline_position: hasHeadline ? headline_position : null,
    });
    return wrapper.data(positionResult.data);
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
      article_title: article.title,
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

    // Final statuses: skip AI if EN+UZ already complete; else enqueue async translate.
    let translationStatus = article.translation_status || "none";
    let shouldEnqueue = false;
    if (isAiTranslationStatus(status)) {
      if (localesComplete(article)) {
        translationStatus = "ready";
      } else {
        translationStatus = "pending";
        shouldEnqueue = true;
      }
    } else if (["draft", "review", "archived"].includes(status)) {
      translationStatus = "none";
    }

    const result = await this.command.updateArticleStatus({
      id,
      status,
      published_at: finalPublishedAt,
      translation_status: translationStatus,
    });
    if (result.err) {
      logger.error(ctx, "changeStatus", "Failed to update article status", result.err);
      return wrapper.error(result.err);
    }

    const auditAction = resolveStatusAuditAction(article.status, status);

    await this.writeAudit({
      user_id: actor_id,
      record_id: id,
      action: auditAction,
      article_title: article.title,
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
        translation_status: translationStatus,
      },
      ip_address,
      user_agent,
    });

    logger.info(ctx, "changeStatus", "Article status changed", {
      id,
      status,
      auditAction,
      translationStatus,
    });

    if (status === "review" && article.status !== "review") {
      void notifyEditorsOfSubmission({
        db: this.db,
        actorId: actor_id,
        resourceLabel: "article",
        title: article.title,
      });
    }

    if (shouldEnqueue) {
      await enqueueArticleTranslation({
        db: this.db,
        articleId: id,
        requestedBy: actor_id,
        targetStatus: status,
      });
    } else if (
      article.status !== "published" &&
      status === "published" &&
      translationStatus === "ready"
    ) {
      void notifyTopicSubscribersOnPublish({
        db: this.db,
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          featured_image: article.featured_image,
        },
      });
    }

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
    if (articleExists.data.translation_status !== "ready") {
      return wrapper.error(
        new BadRequestError("Article translations are not ready")
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
    if (articleExists.data.translation_status !== "ready") {
      return wrapper.error(
        new BadRequestError("Article translations are not ready")
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

  // ─── Retry failed AI translation ────────────────────────────────────────────
  async retryTranslate(payload) {
    const { id, actor_id, actor_role } = payload;

    const articleExists = await this.query.findArticleExistsById(id);
    if (articleExists.err) {
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const article = articleExists.data;
    if (actor_role !== "superadmin" && article.author_id !== actor_id) {
      return wrapper.error(new ForbiddenError("You are not allowed to retry translation for this article"));
    }

    if (article.translation_status !== "failed") {
      return wrapper.error(
        new BadRequestError("Retry is only available when translation_status is failed")
      );
    }

    if (!isAiTranslationStatus(article.status)) {
      return wrapper.error(
        new BadRequestError("Article must be published or scheduled to translate")
      );
    }

    const enqueueResult = await enqueueArticleTranslation({
      db: this.db,
      articleId: id,
      requestedBy: actor_id,
      targetStatus: article.status,
    });

    if (enqueueResult.error) {
      return wrapper.error(new BadRequestError(enqueueResult.error));
    }

    logger.info(ctx, "retryTranslate", "Translation re-queued", { id, jobId: enqueueResult.jobId });
    return wrapper.data({
      article_id: id,
      job_id: enqueueResult.jobId,
      translation_status: "pending",
    });
  }
}

module.exports = ArticleCommandDomain;
