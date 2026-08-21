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
  const payload = validator.isValidPayload(
    { id: req.params.id, lang: req.query.lang },
    queryModel.getVideoParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getYoutubeVideo(payload.data), res);
};

const withActor = (req, data) => ({
  ...data,
  actor_id: req.userMeta?.id,
  actor_role: req.userMeta?.role,
  actor_name: req.userMeta?.full_name,
});

const addYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(req.body, commandModel.createVideoParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.addYoutubeVideo(withActor(req, payload.data)),
    res,
    SUCCESS.CREATED
  );
};

const updateYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, id: req.params.id },
    commandModel.updateVideoParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.updateYoutubeVideo(withActor(req, payload.data)),
    res
  );
};

const deleteYoutubeVideo = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteVideoParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(
    await commandHandler.deleteYoutubeVideo(withActor(req, payload.data)),
    res
  );
};

module.exports = {
  listYoutubeVideos,
  getYoutubeVideo,
  addYoutubeVideo,
  updateYoutubeVideo,
  deleteYoutubeVideo,
};
