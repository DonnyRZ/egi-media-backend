const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// ─── GET /api/v1/users ─────────────────────────────────────────────────────────
const getUsers = async (req, res) => {
  const payload = {
    page: req.query.page,
    limit: req.query.limit,
    search: req.query.search,
    role: req.query.role,
    sort: req.query.sort,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUsersParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getUsers(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/users/:id ─────────────────────────────────────────────────────
const getUserById = async (req, res) => {
  const payload = {
    id: req.params.id,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getUserByIdParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getUserById(validatePayload.data);
  return sendResponse(result, res);
};

// ─── PATCH /api/v1/users/:id ───────────────────────────────────────────────────
const updateUser = async (req, res) => {
  const payload = {
    id: req.params.id,
    full_name: req.body.full_name,
    role: req.body.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.updateUserParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.updateUser(validatePayload.data);
  return sendResponse(result, res);
};

// ─── DELETE /api/v1/users/:id ─────────────────────────────────────────────────
const deleteUser = async (req, res) => {
  const payload = {
    id: req.params.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.deleteUserParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.deleteUser(validatePayload.data);
  return sendResponse(result, res);
};

// ─── GET /api/v1/users/:id/followers ──────────────────────────────────────────
const getFollowers = async (req, res) => {
  const payload = {
    id: req.params.id,
    page: req.query.page,
    limit: req.query.limit,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getFollowersParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getFollowers(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/users/:id/follow ────────────────────────────────────────────
const followAuthor = async (req, res) => {
  const payload = {
    id: req.params.id,
    follower_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.followParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.followAuthor(validatePayload.data);
  return sendResponse(result, res);
};

// ─── DELETE /api/v1/users/:id/follow ──────────────────────────────────────────
const unfollowAuthor = async (req, res) => {
  const payload = {
    id: req.params.id,
    follower_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.followParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.unfollowAuthor(validatePayload.data);
  return sendResponse(result, res);
};

// ─── POST /api/v1/admin/users (superadmin: add author) ────────────────────────
const addAuthor = async (req, res) => {
  const payload = {
    email: req.body.email,
    password: req.body.password,
    full_name: req.body.full_name,
    role: req.body.role,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.addAuthorParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.addAuthor(validatePayload.data);
  return sendResponse(result, res, 201);
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getFollowers,
  followAuthor,
  unfollowAuthor,
  addAuthor,
};
