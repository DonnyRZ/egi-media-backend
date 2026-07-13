const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listTopics = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listTopicParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listTopics(payload.data), res);
};

const getTopic = async (req, res) => {
  const payload = validator.isValidPayload(req.params, queryModel.topicIdParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getTopic(payload.data), res);
};

const createTopic = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createTopicParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createTopic(payload.data), res, SUCCESS.CREATED);
};

const updateTopic = async (req, res) => {
  const payload = validator.isValidPayload({ ...req.body, id: req.params.id }, commandModel.updateTopicParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateTopic(payload.data), res);
};

const deleteTopic = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.topicIdParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteTopic(payload.data), res);
};

const followTopic = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.params, user_id: req.userMeta?.id || req.userMeta?.user_id },
    commandModel.followTopicParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.followTopic(payload.data), res);
};

const unfollowTopic = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.params, user_id: req.userMeta?.id || req.userMeta?.user_id },
    commandModel.followTopicParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.unfollowTopic(payload.data), res);
};

module.exports = {
  listTopics,
  getTopic,
  createTopic,
  updateTopic,
  deleteTopic,
  followTopic,
  unfollowTopic,
};
