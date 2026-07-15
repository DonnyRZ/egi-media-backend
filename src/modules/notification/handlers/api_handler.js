const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

const getMyNotifications = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.query, user_id: req.userMeta?.id },
    queryModel.listNotificationParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.listMyNotifications(payload.data), res);
};

const markAsRead = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, user_id: req.userMeta?.id },
    commandModel.markReadParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.markNotificationAsRead(payload.data), res);
};

const markAllAsRead = async (req, res) => {
  const payload = validator.isValidPayload(
    { user_id: req.userMeta?.id },
    commandModel.markAllReadParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.markAllNotificationsAsRead(payload.data), res);
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
};
