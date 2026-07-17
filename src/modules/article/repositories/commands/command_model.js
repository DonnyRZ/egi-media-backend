const joi = require("joi");

// ─── Create Article ───────────────────────────────────────────────────────────
const createArticleParamType = joi.object({
  author_id: joi.string().uuid().required(),
  category_id: joi.string().uuid().optional().allow(null),
  series_id: joi.string().uuid().optional().allow(null),
  title: joi.string().max(255).required(),
  summary: joi.string().optional().allow(null, ""),
  content: joi.string().required(),
  featured_image: joi.string().uri().optional().allow(null, ""),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .default("draft"),
  published_at: joi.date().iso().optional().allow(null),
  topic_ids: joi.array().items(joi.string().uuid()).optional().default([]),
  tag_ids: joi.array().items(joi.string().uuid()).optional().default([]),
});

// ─── Update Article ───────────────────────────────────────────────────────────
const updateArticleParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  category_id: joi.string().uuid().optional().allow(null),
  series_id: joi.string().uuid().optional().allow(null),
  title: joi.string().max(255).optional(),
  summary: joi.string().optional().allow(null, ""),
  content: joi.string().optional(),
  featured_image: joi.string().uri().optional().allow(null, ""),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .optional(),
  published_at: joi.date().iso().optional().allow(null),
  topic_ids: joi.array().items(joi.string().uuid()).optional(),
  tag_ids: joi.array().items(joi.string().uuid()).optional(),
});

// ─── Delete Article ───────────────────────────────────────────────────────────
const deleteArticleParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
});

// ─── Change Article Status ────────────────────────────────────────────────────
const changeStatusParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .required(),
  published_at: joi.date().iso().optional().allow(null),
});

// ─── Save / Unsave Article ────────────────────────────────────────────────────
const saveArticleParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

// ─── Share Article ────────────────────────────────────────────────────────────
const shareArticleParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().optional().allow(null),
  platform: joi
    .string()
    .valid("twitter", "facebook", "linkedin", "whatsapp", "telegram", "copy_link")
    .required(),
});

// ─── Record Article View ──────────────────────────────────────────────────────
const recordArticleViewParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().optional().allow(null),
  ip_address: joi.string().max(64).optional().allow(null, ""),
});

module.exports = {
  createArticleParamType,
  updateArticleParamType,
  deleteArticleParamType,
  changeStatusParamType,
  saveArticleParamType,
  shareArticleParamType,
  recordArticleViewParamType,
};
