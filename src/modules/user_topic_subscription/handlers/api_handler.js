const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listMyTopics = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id || req.userMeta?.user_id,
    lang: req.query.lang,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.listMyTopicsParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  return sendResponse(await queryHandler.listMyTopics(validatePayload.data), res);
};

const listTopicCatalog = async (req, res) => {
  const payload = { lang: req.query.lang };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.listTopicCatalogParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  return sendResponse(await queryHandler.listTopicCatalog(validatePayload.data), res);
};

const getSubscriptionStats = async (_req, res) => {
  return sendResponse(await queryHandler.getSubscriptionStats(), res);
};

const getTopicSubscribers = async (req, res) => {
  const payload = { topic_id: req.params.topicId };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.topicSubscribersParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  return sendResponse(await queryHandler.getTopicSubscribers(validatePayload.data), res);
};

const subscribeTopic = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id || req.userMeta?.user_id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.subscribeTopicParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  return sendResponse(
    await commandHandler.subscribeTopic(validatePayload.data),
    res,
    SUCCESS.CREATED
  );
};

const unsubscribeTopic = async (req, res) => {
  const payload = {
    id: req.params.id,
    user_id: req.userMeta?.id || req.userMeta?.user_id,
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.subscribeTopicParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  return sendResponse(await commandHandler.unsubscribeTopic(validatePayload.data), res);
};

module.exports = {
  listMyTopics,
  listTopicCatalog,
  getSubscriptionStats,
  getTopicSubscribers,
  subscribeTopic,
  unsubscribeTopic,
};
