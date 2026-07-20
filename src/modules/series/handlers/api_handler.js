const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const validator = require("../../../helpers/utils/validator");
const { paginationResponse, sendResponse } = require("../../../helpers/utils/response");
const { SUCCESS } = require("../../../helpers/http-status/status_code");

const listSeries = async (req, res) => {
  const payload = validator.isValidPayload(req.query, queryModel.listSeriesParamType);
  if (payload.err) return sendResponse(payload, res);
  return paginationResponse(await queryHandler.listSeries(payload.data), res);
};

const getSeries = async (req, res) => {
  const payload = validator.isValidPayload(
    { id: req.params.id, lang: req.query.lang },
    queryModel.seriesIdParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await queryHandler.getSeries(payload.data), res);
};

const createSeries = async (req, res) => {
  const payload = validator.isValidPayload(
    { ...req.body, author_id: req.userMeta?.id },
    commandModel.createSeriesParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.createSeries(payload.data), res, SUCCESS.CREATED);
};

const updateSeries = async (req, res) => {
  const payload = validator.isValidPayload(
    {
      ...req.body,
      id: req.params.id,
      actor_id: req.userMeta?.id,
      actor_role: req.userMeta?.role,
    },
    commandModel.updateSeriesParamType
  );
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.updateSeries(payload.data), res);
};

const deleteSeries = async (req, res) => {
  const payload = validator.isValidPayload(req.params, commandModel.deleteSeriesParamType);
  if (payload.err) return sendResponse(payload, res);
  return sendResponse(await commandHandler.deleteSeries(payload.data), res);
};

module.exports = {
  listSeries,
  getSeries,
  createSeries,
  updateSeries,
  deleteSeries,
};
