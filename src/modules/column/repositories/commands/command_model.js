const joi = require("joi");

const COLUMN_STATUSES = ["draft", "pending_approval", "rejected", "published", "archived"];
const WRITER_CREATE_STATUSES = ["draft", "pending_approval"];

const createTranslationEntry = joi.object({
  title: joi.string().max(255).required(),
  summary: joi.string().optional().allow(null, ""),
  content: joi.string().required(),
});

const updateTranslationEntry = joi
  .object({
    title: joi.string().max(255).optional(),
    summary: joi.string().optional().allow(null, ""),
    content: joi.string().optional(),
  })
  .min(1);

const createColumnParamType = joi.object({
  author_id: joi.string().uuid().required(),
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
  status: joi.string().valid(...WRITER_CREATE_STATUSES).default("draft"),
});

const updateColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
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
});

const deleteColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
});

const submitColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
});

const approveColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  ip_address: joi.string().optional().allow(null, ""),
  user_agent: joi.string().optional().allow(null, ""),
});

const rejectColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  rejection_reason: joi.string().trim().min(3).max(1000).required(),
  ip_address: joi.string().optional().allow(null, ""),
  user_agent: joi.string().optional().allow(null, ""),
});

const saveColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
});

const shareColumnParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().optional().allow(null),
  platform: joi
    .string()
    .valid("twitter", "facebook", "linkedin", "whatsapp", "telegram", "copy_link")
    .required(),
});

const recordColumnViewParamType = joi.object({
  id: joi.string().uuid().required(),
  user_id: joi.string().uuid().optional().allow(null),
  ip_address: joi.string().max(64).optional().allow(null, ""),
});

const createCommentParamType = joi.object({
  column_id: joi.string().uuid().required(),
  user_id: joi.string().uuid().required(),
  content: joi.string().trim().min(1).max(2000).required(),
  parent_id: joi.string().uuid().optional().allow(null, ""),
});

const deleteCommentParamType = joi.object({
  column_id: joi.string().uuid().required(),
  comment_id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
});

const retryTranslateParamType = joi.object({
  id: joi.string().uuid().required(),
  actor_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
});

module.exports = {
  createColumnParamType,
  updateColumnParamType,
  deleteColumnParamType,
  submitColumnParamType,
  approveColumnParamType,
  rejectColumnParamType,
  retryTranslateParamType,
  saveColumnParamType,
  shareColumnParamType,
  recordColumnViewParamType,
  createCommentParamType,
  deleteCommentParamType,
  COLUMN_STATUSES,
};
