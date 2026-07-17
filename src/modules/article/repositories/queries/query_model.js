const joi = require("joi");

// ─── Get All Published Articles ───────────────────────────────────────────────
const getArticlesParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().optional().allow("", null),
  category_id: joi.string().uuid().optional().allow("", null),
  topic_id: joi.string().uuid().optional().allow("", null),
  tag_id: joi.string().uuid().optional().allow("", null),
  author_id: joi.string().uuid().optional().allow("", null),
  series_id: joi.string().uuid().optional().allow("", null),
  sort: joi.string().valid("latest", "oldest", "popular").default("latest"),
});

// ─── Get Article By ID ────────────────────────────────────────────────────────
const getArticleByIdParamType = joi.object({
  id: joi.string().uuid().required(),
});

// ─── Get Article By Slug ──────────────────────────────────────────────────────
const getArticleBySlugParamType = joi.object({
  slug: joi.string().trim().min(1).max(255).required(),
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
});

// ─── Get Saved Articles ───────────────────────────────────────────────────────
const getSavedArticlesParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getArticlesParamType,
  getArticleByIdParamType,
  getArticleBySlugParamType,
  getMyArticlesParamType,
  getSavedArticlesParamType,
};
