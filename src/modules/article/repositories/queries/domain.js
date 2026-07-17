const Query = require("./query");
const wrapper = require("../../../../helpers/utils/wrapper");
const logger = require("../../../../helpers/utils/logger");
const { NotFoundError } = require("../../../../helpers/errors");
const ctx = "Article-Query-Domain";

class ArticleQueryDomain {
  constructor(db) {
    this.query = new Query(db);
  }

  // ─── Get All Published Articles ─────────────────────────────────────────────
  async getArticles(payload) {
    const { page, limit, search, category_id, topic_id, tag_id, author_id, series_id, sort } = payload;

    const [articlesResult, countResult] = await Promise.all([
      this.query.findAllPublishedArticles({ page, limit, search, category_id, topic_id, tag_id, author_id, series_id, sort }),
      this.query.countAllPublishedArticles({ search, category_id, topic_id, tag_id, author_id, series_id }),
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

    const items = articlesResult.data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary || null,
      featured_image: row.featured_image || null,
      status: row.status,
      published_at: row.published_at || null,
      created_at: row.created_at,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
      },
      category: row.category_id
        ? { id: row.category_id, name: row.category_name }
        : null,
    }));

    logger.info(ctx, "getArticles", "Fetched articles successfully", { total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Get Article Detail By ID ───────────────────────────────────────────────
  mapArticleDetail(row, topics, tags) {
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary || null,
      content: row.content,
      featured_image: row.featured_image || null,
      status: row.status,
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
            name: row.cat_name,
            slug: row.cat_slug,
            description: row.cat_description || null,
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
            created_at: row.series_created_at,
          }
        : null,
      topics: topics || [],
      tags: tags || [],
    };
  }

  async getArticleById(payload) {
    const { id } = payload;

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
      tagsResult.err ? [] : tagsResult.data
    );

    logger.info(ctx, "getArticleById", "Fetched article successfully", { id });
    return wrapper.data(article);
  }

  async getArticleBySlug(payload) {
    const { slug } = payload;

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
      tagsResult.err ? [] : tagsResult.data
    );

    logger.info(ctx, "getArticleBySlug", "Fetched article successfully", { slug, id });
    return wrapper.data(article);
  }

  // ─── Get My Articles (author) ───────────────────────────────────────────────
  async getMyArticles(payload) {
    const { author_id, page, limit, status } = payload;

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

    const items = articlesResult.data.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary || null,
      featured_image: row.featured_image || null,
      status: row.status,
      published_at: row.published_at || null,
      created_at: row.created_at,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
      },
      category: row.category_id
        ? { id: row.category_id, name: row.category_name }
        : null,
    }));

    logger.info(ctx, "getMyArticles", "Fetched my articles successfully", { author_id, total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }

  // ─── Get Saved Articles ─────────────────────────────────────────────────────
  async getSavedArticles(payload) {
    const { user_id, page, limit } = payload;

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
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary || null,
      featured_image: row.featured_image || null,
      status: row.status,
      published_at: row.published_at || null,
      created_at: row.created_at,
      saved_at: row.saved_at,
      author: {
        id: row.author_id,
        full_name: row.author_full_name,
      },
      category: row.category_id
        ? { id: row.category_id, name: row.category_name }
        : null,
    }));

    logger.info(ctx, "getSavedArticles", "Fetched saved articles successfully", { user_id, total });

    return wrapper.data({
      items,
      meta: { total, page, limit, total_pages },
    });
  }
}

module.exports = ArticleQueryDomain;
