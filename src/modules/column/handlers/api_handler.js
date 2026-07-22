const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const getColumns = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    author_id: req.query.author_id,
    sort: req.query.sort,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getColumnsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getColumns(validatePayload.data);
  return sendResponse(result, res);
};

const createColumn = async (req, res) => {
  const payload = {
    author_id: req.userMeta?.id,
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    featured_image: req.body.featured_image,
    translations: req.body.translations,
    status: req.body.status,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.createColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.createColumn(validatePayload.data);
  return sendResponse(result, res, SUCCESS.CREATED);
};

const getMyColumns = async (req, res) => {
  const payload = {
    author_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    status: req.query.status,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getMyColumnsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getMyColumns(validatePayload.data);
  return sendResponse(result, res);
};

const getPendingColumns = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getPendingColumnsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getPendingColumns(validatePayload.data);
  return sendResponse(result, res);
};

const getSavedColumns = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
    page: req.query.page,
    limit: req.query.limit,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getSavedColumnsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getSavedColumns(validatePayload.data);
  return sendResponse(result, res);
};

const getColumnById = async (req, res) => {
  const payload = {
    id: req.params.id,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getColumnByIdParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getColumnById(validatePayload.data);
  return sendResponse(result, res);
};

const getColumnBySlug = async (req, res) => {
  const payload = {
    slug: req.params.slug,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getColumnBySlugParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getColumnBySlug(validatePayload.data);
  return sendResponse(result, res);
};

const updateColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
    title: req.body.title,
    summary: req.body.summary,
    content: req.body.content,
    featured_image: req.body.featured_image,
    translations: req.body.translations,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.updateColumn(validatePayload.data);
  return sendResponse(result, res);
};

const deleteColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.deleteColumn(validatePayload.data);
  return sendResponse(result, res);
};

const submitColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.submitColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.submitColumn(validatePayload.data);
  return sendResponse(result, res);
};

const approveColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.approveColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.approveColumn(validatePayload.data);
  return sendResponse(result, res);
};

const rejectColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
    rejection_reason: req.body.rejection_reason,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.rejectColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.rejectColumn(validatePayload.data);
  return sendResponse(result, res);
};

const recordColumnView = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id || null,
    ip_address: req.headers["x-forwarded-for"] || req.socket?.remoteAddress || null,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.recordColumnViewParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.recordColumnView(validatePayload.data);
  return sendResponse(result, res);
};

const shareColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id || null,
    platform: req.body.platform,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.shareColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.shareColumn(validatePayload.data);
  return sendResponse(result, res);
};

const saveColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.saveColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.saveColumn(validatePayload.data);
  return sendResponse(result, res);
};

const unsaveColumn = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.saveColumnParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.unsaveColumn(validatePayload.data);
  return sendResponse(result, res);
};

const getComments = async (req, res) => {
  const payload = {
    column_id: req.params.id,
    page: req.query.page,
    limit: req.query.limit,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getCommentsParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await queryHandler.getComments(validatePayload.data);
  return sendResponse(result, res);
};

const createComment = async (req, res) => {
  const payload = {
    column_id: req.params.id,
    user_id: req.userMeta?.id,
    content: req.body.content,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.createCommentParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.createComment(validatePayload.data);
  return sendResponse(result, res, SUCCESS.CREATED);
};

const deleteComment = async (req, res) => {
  const payload = {
    column_id: req.params.id,
    comment_id: req.params.commentId,
    actor_id: req.userMeta?.id,
    actor_role: req.userMeta?.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteCommentParamType);
  if (validatePayload.err) return sendResponse(validatePayload, res);
  const result = await commandHandler.deleteComment(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getColumns,
  createColumn,
  getMyColumns,
  getPendingColumns,
  getSavedColumns,
  getColumnById,
  getColumnBySlug,
  updateColumn,
  deleteColumn,
  submitColumn,
  approveColumn,
  rejectColumn,
  recordColumnView,
  shareColumn,
  saveColumn,
  unsaveColumn,
  getComments,
  createComment,
  deleteComment,
};
