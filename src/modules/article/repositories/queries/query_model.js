const joi = require("joi");

// Supported content locales. `id` (Indonesian) is the primary/default language.
const localeParam = joi.string().valid("id", "en", "uz").default("id");

// ─── Get All Published Articles ───────────────────────────────────────────────
const ARTICLE_PLACEMENTS = [
  "latest_news",
  "homepage_hero",
  "headline",
  "trending",
];

const getArticlesParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().optional().allow("", null),
  category_id: joi.string().uuid().optional().allow("", null),
  topic_id: joi.string().uuid().optional().allow("", null),
  tag_id: joi.string().uuid().optional().allow("", null),
  author_id: joi.string().uuid().optional().allow("", null),
  series_id: joi.string().uuid().optional().allow("", null),
  placement: joi
    .string()
    .valid(...ARTICLE_PLACEMENTS)
    .optional()
    .allow("", null),
  sort: joi.string().valid("latest", "oldest", "popular").default("latest"),
  lang: localeParam,
});

// ─── Get Article By ID ────────────────────────────────────────────────────────
const getArticleByIdParamType = joi.object({
  id: joi.string().uuid().required(),
  lang: localeParam,
});

// ─── Get Article By Slug ──────────────────────────────────────────────────────
const getArticleBySlugParamType = joi.object({
  slug: joi.string().trim().min(1).max(255).required(),
  lang: localeParam,
});

// ─── Get My Articles (author) ─────────────────────────────────────────────────
const getMyArticlesParamType = joi.object({
  author_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .optional()
    .allow("", null),
  lang: localeParam,
});

// ─── Get Saved Articles ───────────────────────────────────────────────────────
const getSavedArticlesParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  lang: localeParam,
});

// ─── Personalized Articles (subscribed topics) ────────────────────────────────
const getPersonalizedArticlesParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  lang: localeParam,
});

// ─── Get Manage Articles (editorial: semua author & status) ───────────────────
const getManageArticlesParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().optional().allow("", null),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .optional()
    .allow("", null),
  author_id: joi.string().uuid().optional().allow("", null),
  category_id: joi.string().uuid().optional().allow("", null),
  topic_id: joi.string().uuid().optional().allow("", null),
  tag_id: joi.string().uuid().optional().allow("", null),
  series_id: joi.string().uuid().optional().allow("", null),
  lang: localeParam,
});

const getArticleStatsParamType = joi.object({
  author_id: joi.string().uuid().optional().allow(null),
});

module.exports = {
  getArticlesParamType,
  getArticleByIdParamType,
  getArticleBySlugParamType,
  getMyArticlesParamType,
  getSavedArticlesParamType,
  getPersonalizedArticlesParamType,
  getManageArticlesParamType,
  getArticleStatsParamType,
};
