const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// ─── GET /api/v1/articles ──────────────────────────────────────────────────────
const getArticles = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    category_id: req.query.category_id,
    topic_id: req.query.topic_id,
    tag_id: req.query.tag_id,
    author_id: req.query.author_id,
    series_id: req.query.series_id,
    sort: req.query.sort,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/articles ─────────────────────────────────────────────────────
const createArticle = async (req, res) => {
  const payload = {
    author_id: req.userMeta?.id,
    category_id: req.body.category_id,
    series_id: req.body.series_id,
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    featured_image: req.body.featured_image,
    status: req.body.status,
    published_at: req.body.published_at,
    topic_ids: req.body.topic_ids,
    tag_ids: req.body.tag_ids,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.createArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createArticle(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/me ───────────────────────────────────────────────────
const getMyArticles = async (req, res) => {
  const payload = {
    author_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getMyArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getMyArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/saved ───────────────────────────────────────────────
const getSavedArticles = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getSavedArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/:id ─────────────────────────────────────────────────
const getArticleById = async (req, res) => {
  const payload = {
    id: req.params.id,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getArticleByIdParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getArticleById(validatePayload.data);
  return sendResponse(result, res);
};

// ─── PUT /api/v1/articles/:id ─────────────────────────────────────────────────
const updateArticle = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
    category_id: req.body.category_id,
    series_id: req.body.series_id,
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    featured_image: req.body.featured_image,
    status: req.body.status,
    published_at: req.body.published_at,
    topic_ids: req.body.topic_ids,
    tag_ids: req.body.tag_ids,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateArticle(validatePayload.data);
  return sendResponse(result, res);
};

// ─── DELETE /api/v1/articles/:id ─────────────────────────────────────────────
const deleteArticle = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteArticle(validatePayload.data);
  return sendResponse(result, res);
};

// ─── PATCH /api/v1/articles/:id/status ───────────────────────────────────────
const changeArticleStatus = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
    status: req.body.status,
    published_at: req.body.published_at,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.changeStatusParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.changeStatus(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/articles/:id/save ──────────────────────────────────────────
const saveArticle = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.saveArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.saveArticle(validatePayload.data);
  return sendResponse(result, res);
};

// ─── DELETE /api/v1/articles/:id/save ────────────────────────────────────────
const unsaveArticle = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.saveArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.unsaveArticle(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/articles/:id/share ─────────────────────────────────────────
const shareArticle = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id,
    platform: req.body.platform,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.shareArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.shareArticle(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getArticles,
  createArticle,
  getMyArticles,
  getSavedArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  changeArticleStatus,
  saveArticle,
  unsaveArticle,
  shareArticle,
};
