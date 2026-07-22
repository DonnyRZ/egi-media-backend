const joi = require("joi");

const ARTICLE_PLACEMENTS = [
  "latest_news",
  "homepage_hero",
  "headline",
  "trending",
];

const placementsSchema = joi
  .array()
  .items(joi.string().valid(...ARTICLE_PLACEMENTS))
  .unique();

// ─── Translations ─────────────────────────────────────────────────────────────
// Indonesian (id) is the primary language and lives in the top-level fields.
// English (en) and Uzbek (uz) are optional. A translation is only meaningful when
// it has both a title and content, so both are required together when a locale is
// provided on create.
const createTranslationEntry = joi.object({
  title: joi.string().max(255).required(),
  summary: joi.string().optional().allow(null, ""),
  content: joi.string().required(),
});

// On update every field is optional so callers can patch a single translated field.
const updateTranslationEntry = joi
  .object({
    title: joi.string().max(255).optional(),
    summary: joi.string().optional().allow(null, ""),
    content: joi.string().optional(),
  })
  .min(1);

// ─── Create Article ───────────────────────────────────────────────────────────
const createArticleParamType = joi.object({
  author_id: joi.string().uuid().required(),
  category_id: joi.string().uuid().optional().allow(null),
  series_id: joi.string().uuid().optional().allow(null),
  title: joi.string().max(255).required(),
  summary: joi.string().optional().allow(null, ""),
  content: joi.string().required(),
  featured_image: joi.string().uri().optional().allow(null, ""),
  translations: joi
    .object({
      en: createTranslationEntry.optional(),
      uz: createTranslationEntry.optional(),
    })
    .optional(),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .default("draft"),
  published_at: joi.date().iso().optional().allow(null),
  topic_ids: joi.array().items(joi.string().uuid()).optional().default([]),
  tag_ids: joi.array().items(joi.string().uuid()).optional().default([]),
  placements: placementsSchema.default(["latest_news"]),
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
  translations: joi
    .object({
      en: updateTranslationEntry.optional(),
      uz: updateTranslationEntry.optional(),
    })
    .optional(),
  status: joi
    .string()
    .valid("draft", "review", "scheduled", "published", "archived")
    .optional(),
  published_at: joi.date().iso().optional().allow(null),
  topic_ids: joi.array().items(joi.string().uuid()).optional(),
  tag_ids: joi.array().items(joi.string().uuid()).optional(),
  placements: placementsSchema.optional(),
});

// ─── Update Article Placements (quick edit) ───────────────────────────────────
const updatePlacementsParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  placements: placementsSchema.required(),
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
  ARTICLE_PLACEMENTS,
  createArticleParamType,
  updateArticleParamType,
  updatePlacementsParamType,
  deleteArticleParamType,
  changeStatusParamType,
  saveArticleParamType,
  shareArticleParamType,
  recordArticleViewParamType,
};
