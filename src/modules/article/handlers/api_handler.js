const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const requestAuditMeta = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const rawIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded || req.socket?.remoteAddress || null;

  return {
    ip_address: rawIp,
    user_agent: req.headers["user-agent"] || null,
  };
};

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
    placement: req.query.placement,
    sort: req.query.sort,
    lang: req.query.lang,
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
    translations: req.body.translations,
    status: req.body.status,
    published_at: req.body.published_at,
    topic_ids: req.body.topic_ids,
    tag_ids: req.body.tag_ids,
    placements: req.body.placements,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.createArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.createArticle({
    ...validatePayload.data,
    ...requestAuditMeta(req),
  });
  return sendResponse(result, res, SUCCESS.CREATED);
};

// ─── GET /api/v1/articles/me ───────────────────────────────────────────────────
const getMyArticles = async (req, res) => {
  const payload = {
    author_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getMyArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getMyArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/stats ────────────────────────────────────────────────
// Editorial CMS dashboard: superadmin = newsroom-wide; author = own articles only.
const getArticleStats = async (req, res) => {
  const role = req.userMeta?.role;
  const payload = {
    author_id: role === "superadmin" ? null : req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getArticleStatsParamType,
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getArticleStats(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/manage ───────────────────────────────────────────────
// Editorial CMS: list semua artikel (semua author & status) untuk author/superadmin.
const getManageArticles = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    status: req.query.status,
    author_id: req.query.author_id,
    category_id: req.query.category_id,
    topic_id: req.query.topic_id,
    tag_id: req.query.tag_id,
    series_id: req.query.series_id,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getManageArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getManageArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/saved ───────────────────────────────────────────────
const getSavedArticles = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getSavedArticlesParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getSavedArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/personalized ────────────────────────────────────────
const getPersonalizedArticles = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getPersonalizedArticlesParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getPersonalizedArticles(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/:id ─────────────────────────────────────────────────
const getArticleById = async (req, res) => {
  const payload = {
    id: req.params.id,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getArticleByIdParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getArticleById(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/articles/slug/:slug ──────────────────────────────────────────
const getArticleBySlug = async (req, res) => {
  const payload = {
    slug: req.params.slug,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getArticleBySlugParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getArticleBySlug(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/articles/:id/view ───────────────────────────────────────────
const recordArticleView = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id || null,
    ip_address: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.recordArticleViewParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.recordArticleView(validatePayload.data);
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
    translations: req.body.translations,
    status: req.body.status,
    published_at: req.body.published_at,
    topic_ids: req.body.topic_ids,
    tag_ids: req.body.tag_ids,
    placements: req.body.placements,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateArticleParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateArticle({
    ...validatePayload.data,
    ...requestAuditMeta(req),
  });
  return sendResponse(result, res);
};

// ─── PATCH /api/v1/articles/:id/placements ───────────────────────────────────
const updateArticlePlacements = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
    placements: req.body.placements,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updatePlacementsParamType,
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updatePlacements({
    ...validatePayload.data,
    ...requestAuditMeta(req),
  });
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
  const result = await commandHandler.deleteArticle({
    ...validatePayload.data,
    ...requestAuditMeta(req),
  });
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
  const result = await commandHandler.changeStatus({
    ...validatePayload.data,
    ...requestAuditMeta(req),
  });
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
    user_id: req.userMeta?.id || null,
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
  getArticleStats,
  getManageArticles,
  getSavedArticles,
  getPersonalizedArticles,
  getArticleById,
  getArticleBySlug,
  updateArticle,
  updateArticlePlacements,
  deleteArticle,
  changeArticleStatus,
  saveArticle,
  unsaveArticle,
  shareArticle,
  recordArticleView,
};
