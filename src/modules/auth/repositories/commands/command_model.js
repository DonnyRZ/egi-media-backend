const joi = require("joi");

const registerParamType = joi.object({
  email: joi.string().trim().lowercase().email().required(),
  password: joi.string().min(8).required(),
  full_name: joi.string().max(150).required(),
});

const loginParamType = joi.object({
  email: joi.string().trim().lowercase().email().required(),
  password: joi.string().required(),
});

const refreshTokenParamType = joi.object({
  refresh_token: joi.string().required(),
});

const changePasswordParamType = joi.object({
  user_id: joi.string().required(),
  old_password: joi.string().required(),
  new_password: joi.string().min(8).required(),
});

const updateMeParamType = joi.object({
  user_id: joi.string().required(),
  full_name: joi.string().min(1).max(150).required(),
});

const forgotPasswordParamType = joi.object({
  email: joi.string().trim().lowercase().email().required(),
});

const resetPasswordParamType = joi.object({
  token: joi.string().required(),
  new_password: joi.string().min(8).required(),
});

const verifyEmailParamType = joi.object({
  token: joi.string().required(),
});

const googleLoginParamType = joi.object({
  id: joi.string().required(),
  name: joi.string().required(),
  email: joi.string().trim().lowercase().email().required(),
  picture: joi.string().allow("", null).optional(),
  role_id: joi.string().allow("", null).optional(),
  origin: joi.string().allow("", null).optional(),
});

const resendVerificationParamType = joi.object({
  email: joi.string().trim().lowercase().email().required(),
});

module.exports = {
  registerParamType,
  loginParamType,
  refreshTokenParamType,
  changePasswordParamType,
  updateMeParamType,
  forgotPasswordParamType,
  resetPasswordParamType,
  verifyEmailParamType,
  googleLoginParamType,
  resendVerificationParamType,
};
