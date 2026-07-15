const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listActivePlans = async (req, res) => {
  return sendResponse(await queryHandler.listActivePlans(), res);
};

const createPlan = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createSubscriptionPlanParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createPlan(payload.data), res, SUCCESS.CREATED);
};

const updatePlan = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateSubscriptionPlanParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updatePlan(payload.data), res);
};

const deactivatePlan = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deactivateSubscriptionPlanParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deactivatePlan(payload.data), res);
};

const getSubscriptionHistory = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.query, user_id: req.userMeta?.id },
    queryModel.subscriptionHistoryParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.getSubscriptionHistory(payload.data), res);
};

const createSubscription = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, user_id: req.userMeta?.id },
    commandModel.createUserSubscriptionParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createSubscription(payload.data), res, SUCCESS.CREATED);
};

const getActiveSubscription = async (req, res) => {
  const payload = validator.isValidPayload(
    { user_id: req.userMeta?.id },
    queryModel.activeSubscriptionParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getActiveSubscription(payload.data), res);
};

const cancelSubscription = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, user_id: req.userMeta?.id },
    commandModel.cancelUserSubscriptionParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.cancelSubscription(payload.data), res);
};

module.exports = {
  listActivePlans,
  createPlan,
  updatePlan,
  deactivatePlan,
  getSubscriptionHistory,
  createSubscription,
  getActiveSubscription,
  cancelSubscription,
};
