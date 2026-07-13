const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");

// ─── Register ──────────────────────────────────────────────────────────────────
const register = async (req, res) => {
  const payload = {
    email: req.body.email,
    password: req.body.password,
    full_name: req.body.full_name,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.registerParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.register(validatePayload.data);
  return sendResponse(result, res, 201);
};

// ─── Login ─────────────────────────────────────────────────────────────────────
const login = async (req, res) => {
  const payload = {
    email: req.body.email,
    password: req.body.password,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.loginParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.login(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Refresh Token ─────────────────────────────────────────────────────────────
const refreshToken = async (req, res) => {
  const payload = {
    refresh_token: req.body.refresh_token,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.refreshTokenParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.refreshToken(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Logout ────────────────────────────────────────────────────────────────────
const logout = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
  };
  const result = await commandHandler.logout(payload);
  return sendResponse(result, res);
};

// ─── Verify Email ──────────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  const payload = {
    token: req.query.token,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.verifyEmailParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.verifyEmail(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Forgot Password ───────────────────────────────────────────────────────────
const forgotPassword = async (req, res) => {
  const payload = {
    email: req.body.email,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.forgotPasswordParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.forgotPassword(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Reset Password ────────────────────────────────────────────────────────────
const resetPassword = async (req, res) => {
  const payload = {
    token: req.body.token,
    new_password: req.body.new_password,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.resetPasswordParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.resetPassword(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Change Password ───────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
    old_password: req.body.old_password,
    new_password: req.body.new_password,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.changePasswordParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.changePassword(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Google OAuth Callback ─────────────────────────────────────────────────────
const googleCallback = async (req, res) => {
  // req.user diisi oleh passport via authGoogleCallback middleware
  const payload = {
    id: req.user?.id,
    name: req.user?.name,
    email: req.user?.email,
    picture: req.user?.picture,
    role_id: req.user?.role_id,
    origin: req.user?.origin,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.googleLoginParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.googleLogin(validatePayload.data);
  return sendResponse(result, res);
};

// ─── Get Me ────────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const payload = {
    user_id: req.userMeta?.id,
  };
  const validatePayload = validator.isValidPayload(payload, queryModel.getMeParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await queryHandler.getMe(validatePayload.data);
  return sendResponse(result, res);
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  verifyEmail,
  forgotPassword,
  resetPassword,
  changePassword,
  googleCallback,
  getMe,
};
