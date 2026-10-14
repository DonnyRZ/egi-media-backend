const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listCategories = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listCategoryParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listCategories(payload.data), res);
};

const getCategory = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, lang: req.query.lang },
    queryModel.categoryIdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getCategory(payload.data), res);
};

const getCategoryTranslationState = async (req, res) => {
  const payload = validator.isValidPayload({ id: req.params.id }, commandModel.deleteCategoryParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getCategoryTranslationState(payload.data), res);
};

const createCategory = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createCategoryParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createCategory(payload.data), res, SUCCESS.CREATED);
};

const updateCategory = async (req, res) => {
  const payload = validator.isValidPayload({ ...req.body, id: req.params.id }, commandModel.updateCategoryParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateCategory(payload.data), res);
};

const deleteCategory = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteCategoryParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteCategory(payload.data), res);
};

const retryCategoryTranslation = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, locale: req.body?.locale },
    commandModel.categoryTranslationRetryParamType,
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.retryCategoryTranslation(payload.data), res);
};

module.exports = {
  listCategories,
  getCategory,
  getCategoryTranslationState,
  createCategory,
  updateCategory,
  deleteCategory,
  retryCategoryTranslation,
};
