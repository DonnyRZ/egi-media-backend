const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listTags = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listTagParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listTags(payload.data), res);
};
const createTag = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createTagParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createTag(payload.data), res, SUCCESS.CREATED);
};
const deleteTag = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteTagParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteTag(payload.data), res);
};
module.exports = { listTags, createTag, deleteTag };
