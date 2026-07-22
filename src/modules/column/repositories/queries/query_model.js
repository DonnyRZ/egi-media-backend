const joi = require("joi");

const localeParam = joi.string().valid("id", "en", "uz").default("id");

const COLUMN_STATUSES = ["draft", "pending_approval", "rejected", "published", "archived"];

const getColumnsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  search: joi.string().optional().allow("", null),
  author_id: joi.string().uuid().optional().allow("", null),
  sort: joi.string().valid("latest", "oldest", "popular").default("latest"),
  lang: localeParam,
});

const getColumnByIdParamType = joi.object({
  id: joi.string().uuid().required(),
  lang: localeParam,
});

const getColumnBySlugParamType = joi.object({
  slug: joi.string().trim().min(1).max(255).required(),
  lang: localeParam,
});

const getMyColumnsParamType = joi.object({
  author_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  status: joi.string().valid(...COLUMN_STATUSES).optional().allow("", null),
  lang: localeParam,
});

const getMyColumnByIdParamType = joi.object({
  id: joi.string().uuid().required(),
  author_id: joi.string().uuid().required(),
  actor_role: joi.string().required(),
  lang: localeParam,
});

const getPendingColumnsParamType = joi.object({
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  lang: localeParam,
});

const getSavedColumnsParamType = joi.object({
  user_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
  lang: localeParam,
});

const getCommentsParamType = joi.object({
  column_id: joi.string().uuid().required(),
  page: joi.number().integer().min(1).default(1),
  limit: joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  getColumnsParamType,
  getColumnByIdParamType,
  getColumnBySlugParamType,
  getMyColumnsParamType,
  getMyColumnByIdParamType,
  getPendingColumnsParamType,
  getSavedColumnsParamType,
  getCommentsParamType,
};
