const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listNewsletters = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listNewslettersParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listNewsletters(payload.data), res);
};

const getNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(req.params, queryModel.getNewsletterParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getNewsletter(payload.data), res);
};

const createNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createNewsletterParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createNewsletter(payload.data), res, SUCCESS.CREATED);
};

const updateNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateNewsletterParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateNewsletter(payload.data), res);
};

const deleteNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteNewsletterParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteNewsletter(payload.data), res);
};

const addArticleToNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.addArticleParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.addArticleToNewsletter(payload.data), res);
};

const removeArticleFromNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, article_id: req.query.article_id },
    commandModel.removeArticleParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.removeArticleFromNewsletter(payload.data), res);
};

const subscribeToNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, user_id: req.userMeta?.id },
    commandModel.subscribeNewsletterParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.subscribeToNewsletter(payload.data), res);
};

const unsubscribeFromNewsletter = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, user_id: req.userMeta?.id },
    commandModel.subscribeNewsletterParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.unsubscribeFromNewsletter(payload.data), res);
};

module.exports = {
  listNewsletters,
  getNewsletter,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  addArticleToNewsletter,
  removeArticleFromNewsletter,
  subscribeToNewsletter,
  unsubscribeFromNewsletter,
};
