const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Article-Query-Domain";

// Indonesian (id) is the primary language; en/uz are optional translations.
const DEFAULT_LOCALE = "id";
const TRANSLATION_LOCALES = ["en", "uz"];

// A locale counts as available when its translated title exists.
const getAvailableLocales = (row) => {
  const locales = [DEFAULT_LOCALE];
  for (const loc of TRANSLATION_LOCALES) {
    if (row[`title_${loc}`]) locales.push(loc);
  }
  return locales;
};

// Falls back to the requested locale only when the article has that translation.
const resolveLocale = (requested, available) =>
  available.includes(requested) ? requested : DEFAULT_LOCALE;

// Returns a field value for the resolved locale, falling back to the primary column.
const pickLocalized = (row, field, locale) => {
  if (locale === DEFAULT_LOCALE) return row[field];
  const value = row[`${field}_${locale}`];
  return value !== undefined && value !== null && value !== "" ? value : row[field];
};

class ArticleQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  // ─── Map a list row to a localized item ─────────────────────────────────────
  mapListItem(row, requestedLocale) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);
    return {
      id: row.id,
      locale,
      available_locales: available,
      title: pickLocalized(row, "title", locale),
      slug: pickLocalized(row, "slug", locale),
      summary: pickLocalized(row, "summary", locale) || null,
      featured_image: row.featured_image || null,
      status: row.status,
      placements: Array.isArray(row.placements) ? row.placements : ["latest_news"],
      headline_position: row.headline_position ?? null,
      published_at: row.published_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at || null,
      translation_status: row.translation_status || "none",
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
      },
      category: row.category_id
        ? {
            id: row.category_id,
            // Follow UI locale (requested), not article content locale.
            name: pickLocalized(
              {
                name: row.category_name,
                name_en: row.category_name_en,
                name_uz: row.category_name_uz,
              },
              "name",
              requestedLocale,
            ),
          }
        : null,
    };
  }

  // ─── Get All Published Articles ─────────────────────────────────────────────
  async getArticles(payload) {
    const { page, limit, search, category_id, topic_id, tag_id, author_id, series_id, placement, sort, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [articlesResult, countResult] = await Promise.all([
      this.query.findAllPublishedArticles({ page, limit, search, category_id, topic_id, tag_id, author_id, series_id, placement, sort }),
      this.query.countAllPublishedArticles({ search, category_id, topic_id, tag_id, author_id, series_id, placement }),
    ]);

    if (articlesResult.err) {
      logger.error(ctx, "getArticles", "Failed to fetch articles", articlesResult.err);
      return wrapper.error(articlesResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getArticles", "Failed to count articles", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    const items = articlesResult.data.map((row) => this.mapListItem(row, requestedLocale));

    logger.info(ctx, "getArticles", "Fetched articles successfully", { total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Get Article Detail By ID ───────────────────────────────────────────────
  mapArticleDetail(row, topics, tags, requestedLocale = DEFAULT_LOCALE) {
    const available = getAvailableLocales(row);
    const locale = resolveLocale(requestedLocale, available);

    // Full per-locale content so the frontend language switcher can render any
    // available translation without an extra request.
    const translations = {
      id: {
        title: row.title,
        slug: row.slug,
        summary: row.summary || null,
        content: row.content,
      },
    };
    for (const loc of TRANSLATION_LOCALES) {
      if (!available.includes(loc)) continue;
      translations[loc] = {
        title: row[`title_${loc}`],
        slug: row[`slug_${loc}`] || null,
        summary: row[`summary_${loc}`] || null,
        content: row[`content_${loc}`] ?? null,
      };
    }

    return {
      id: row.id,
      default_locale: DEFAULT_LOCALE,
      locale,
      requested_locale: requestedLocale,
      available_locales: available,
      title: pickLocalized(row, "title", locale),
      slug: pickLocalized(row, "slug", locale),
      summary: pickLocalized(row, "summary", locale) || null,
      content: pickLocalized(row, "content", locale),
      translations,
      featured_image: row.featured_image || null,
      status: row.status,
      translation_status: row.translation_status || "none",
      placements: Array.isArray(row.placements) ? row.placements : ["latest_news"],
      headline_position: row.headline_position ?? null,
      published_at: row.published_at || null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      view_count: row.view_count || 0,
      share_count: row.share_count || 0,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
        email: row.author_email,
        role: row.author_role,
      },
      category: row.cat_id
        ? {
            id: row.cat_id,
            name: pickLocalized(
              {
                name: row.cat_name,
                name_en: row.cat_name_en,
                name_uz: row.cat_name_uz,
              },
              "name",
              requestedLocale,
            ),
            slug: pickLocalized(
              {
                slug: row.cat_slug,
                slug_en: row.cat_slug_en,
                slug_uz: row.cat_slug_uz,
              },
              "slug",
              requestedLocale,
            ),
            description:
              pickLocalized(
                {
                  description: row.cat_description,
                  description_en: row.cat_description_en,
                  description_uz: row.cat_description_uz,
                },
                "description",
                requestedLocale,
              ) || null,
            created_at: row.cat_created_at,
            updated_at: row.cat_updated_at,
          }
        : null,
      series: row.series_id
        ? {
            id: row.series_id,
            name: row.series_name,
            slug: row.series_slug,
            description: row.series_description || null,
            image: row.series_image || null,
            created_at: row.series_created_at,
          }
        : null,
      topics: (topics || []).map((topic) => ({
        id: topic.id,
        name: pickLocalized(topic, "name", requestedLocale),
        slug: pickLocalized(topic, "slug", requestedLocale),
        description:
          pickLocalized(topic, "description", requestedLocale) || null,
        created_at: topic.created_at,
        updated_at: topic.updated_at,
      })),
      tags: tags || [],
    };
  }

  async getArticleById(payload) {
    const { id, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const articleResult = await this.query.findArticleById(id);

    if (articleResult.err) {
      logger.error(ctx, "getArticleById", "Article not found", { id });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const [topicsResult, tagsResult] = await Promise.all([
      this.query.findArticleTopics(id),
      this.query.findArticleTags(id),
    ]);

    const article = this.mapArticleDetail(
      articleResult.data,
      topicsResult.err ? [] : topicsResult.data,
      tagsResult.err ? [] : tagsResult.data,
      requestedLocale
    );

    logger.info(ctx, "getArticleById", "Fetched article successfully", { id });
    return wrapper.data(article);
  }

  async getArticleBySlug(payload) {
    const { slug, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const articleResult = await this.query.findArticleBySlug(slug);

    if (articleResult.err) {
      logger.error(ctx, "getArticleBySlug", "Article not found", { slug });
      return wrapper.error(new NotFoundError("Article not found"));
    }

    const id = articleResult.data.id;
    const [topicsResult, tagsResult] = await Promise.all([
      this.query.findArticleTopics(id),
      this.query.findArticleTags(id),
    ]);

    const article = this.mapArticleDetail(
      articleResult.data,
      topicsResult.err ? [] : topicsResult.data,
      tagsResult.err ? [] : tagsResult.data,
      requestedLocale
    );

    logger.info(ctx, "getArticleBySlug", "Fetched article successfully", { slug, id });
    return wrapper.data(article);
  }

  // ─── Get My Articles (author) ───────────────────────────────────────────────
  async getMyArticles(payload) {
    const { author_id, page, limit, status, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [articlesResult, countResult] = await Promise.all([
      this.query.findMyArticles({ author_id, page, limit, status }),
      this.query.countMyArticles({ author_id, status }),
    ]);

    if (articlesResult.err) {
      logger.error(ctx, "getMyArticles", "Failed to fetch my articles", articlesResult.err);
      return wrapper.error(articlesResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getMyArticles", "Failed to count my articles", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    const items = articlesResult.data.map((row) => this.mapListItem(row, requestedLocale));

    logger.info(ctx, "getMyArticles", "Fetched my articles successfully", { author_id, total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Get Manage Articles (editorial: semua author & status) ─────────────────
  async getManageArticles(payload) {
    const { page, limit, search, status, author_id, category_id, topic_id, tag_id, series_id, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const filters = { search, status, author_id, category_id, topic_id, tag_id, series_id };
    const [articlesResult, countResult] = await Promise.all([
      this.query.findManageArticles({ page, limit, ...filters }),
      this.query.countManageArticles(filters),
    ]);

    if (articlesResult.err) {
      logger.error(ctx, "getManageArticles", "Failed to fetch manage articles", articlesResult.err);
      return wrapper.error(articlesResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getManageArticles", "Failed to count manage articles", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    const items = articlesResult.data.map((row) => this.mapListItem(row, requestedLocale));

    logger.info(ctx, "getManageArticles", "Fetched manage articles successfully", { total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Dashboard article stats ────────────────────────────────────────────────
  async getArticleStats(payload) {
    const result = await this.query.countArticleStats({
      author_id: payload.author_id || null,
    });
    if (result.err) {
      logger.error(ctx, "getArticleStats", "Failed to count article stats", result.err);
      return wrapper.error(result.err);
    }
    return wrapper.data(result.data);
  }

  // ─── Get Saved Articles ─────────────────────────────────────────────────────
  async getSavedArticles(payload) {
    const { user_id, page, limit, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [articlesResult, countResult] = await Promise.all([
      this.query.findSavedArticles({ user_id, page, limit }),
      this.query.countSavedArticles(user_id),
    ]);

    if (articlesResult.err) {
      logger.error(ctx, "getSavedArticles", "Failed to fetch saved articles", articlesResult.err);
      return wrapper.error(articlesResult.err);
    }

    if (countResult.err) {
      logger.error(ctx, "getSavedArticles", "Failed to count saved articles", countResult.err);
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);

    const items = articlesResult.data.map((row) => ({
      ...this.mapListItem(row, requestedLocale),
      saved_at: row.saved_at,
    }));

    logger.info(ctx, "getSavedArticles", "Fetched saved articles successfully", { user_id, total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Personalized feed from subscribed topics ───────────────────────────────
  async getPersonalizedArticles(payload) {
    const { user_id, page, limit, lang } = payload;
    const requestedLocale = lang || DEFAULT_LOCALE;

    const [articlesResult, countResult] = await Promise.all([
      this.query.findPersonalizedArticles({ user_id, page, limit }),
      this.query.countPersonalizedArticles(user_id),
    ]);

    if (articlesResult.err) {
      logger.error(
        ctx,
        "getPersonalizedArticles",
        "Failed to fetch personalized articles",
        articlesResult.err
      );
      return wrapper.error(articlesResult.err);
    }

    if (countResult.err) {
      logger.error(
        ctx,
        "getPersonalizedArticles",
        "Failed to count personalized articles",
        countResult.err
      );
      return wrapper.error(countResult.err);
    }

    const total = countResult.data;
    const total_pages = Math.ceil(total / limit);
    const items = articlesResult.data.map((row) => this.mapListItem(row, requestedLocale));

    logger.info(ctx, "getPersonalizedArticles", "Fetched personalized articles", {
      user_id,
      total,
    });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Translation jobs for CMS bell ──────────────────────────────────────────
  async getTranslationJobs(payload) {
    const { user_id, actor_role, limit } = payload;
    const result = await this.query.findTranslationJobs({
      user_id,
      is_superadmin: actor_role === "superadmin",
      limit: limit || 30,
    });
    if (result.err) {
      logger.error(ctx, "getTranslationJobs", "Failed to fetch jobs", result.err);
      return wrapper.error(result.err);
    }

    const items = (result.data || []).map((row) => ({
      id: row.id,
      article_id: row.article_id,
      article_title: row.article_title,
      requested_by: row.requested_by,
      target_status: row.target_status,
      job_status: row.job_status,
      error_message: row.error_message || null,
      translation_status: row.translation_status,
      article_status: row.article_status,
      created_at: row.created_at,
      started_at: row.started_at || null,
      finished_at: row.finished_at || null,
    }));

    return wrapper.data({ items });
  }
}

module.exports = ArticleQueryDomain;
