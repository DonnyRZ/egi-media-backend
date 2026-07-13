const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

const getUserProfile = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id || req.userMeta?.user_id
  };
  const validatePayload = validator.isValidPayload(
    payload,
    queryModel.getUserProfileParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getUserProfile(validatePayload.data);
  return sendResponse(result, res);
};

const updateUserProfile = async (req, res) => {
  const payload = {
    ...req.body,
    user_id: req.userMeta?.id || req.userMeta?.user_id
  };
  const validatePayload = validator.isValidPayload(
    payload,
    commandModel.updateUserProfileParamType
  );
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateUserProfile(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
};
