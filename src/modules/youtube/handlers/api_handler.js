const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listYoutubeVideos = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listVideosParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listYoutubeVideos(payload.data), res);
};

const getYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(req.params, queryModel.getVideoParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getYoutubeVideo(payload.data), res);
};

const addYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createVideoParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.addYoutubeVideo(payload.data), res, SUCCESS.CREATED);
};

const updateYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateVideoParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateYoutubeVideo(payload.data), res);
};

const deleteYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteVideoParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteYoutubeVideo(payload.data), res);
};

module.exports = {
  listYoutubeVideos,
  getYoutubeVideo,
  addYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
};
