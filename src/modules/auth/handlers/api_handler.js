const commandHandler = require("../repositories/commands/command_handler");
const commandModel = require("../repositories/commands/command_model");
const queryHandler = require("../repositories/queries/query_handler");
const queryModel = require("../repositories/queries/query_model");
const validator = require("../../../helpers/utils/validator");
const { sendResponse } = require("../../../helpers/utils/response");
const config = require("../../../config/global_config");

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

// Helper to render email verification result page
const renderVerificationResultPage = (isSuccess, message) => {
  const title = isSuccess ? "Email Verified" : "Verification Failed";
  const iconColor = isSuccess ? "#10b981" : "#ef4444";
  const iconSvg = isSuccess
    ? `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path></svg>`
    : `<svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  const frontendUrl = config.get("/frontendUrl") || "http://localhost:5173";

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Egi Media</title>
  <style>
    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
      background: radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
    }
    .card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 24px;
      padding: 48px 32px;
      width: 90%;
      max-width: 440px;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
      transform: translateY(0);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      animation: fadeIn 0.6s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
      border: 2px solid ${iconColor};
      box-shadow: 0 0 15px ${iconColor}20;
    }
    .icon {
      width: 36px;
      height: 36px;
      color: ${iconColor};
    }
    h1 {
      font-size: 26px;
      font-weight: 700;
      margin: 0 0 16px;
      letter-spacing: -0.5px;
      color: #ffffff;
    }
    p {
      color: #94a3b8;
      font-size: 16px;
      line-height: 1.5;
      margin: 0 0 32px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      box-sizing: border-box;
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2);
      transition: all 0.2s ease-in-out;
    }
    .btn:hover {
      background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      box-shadow: 0 6px 12px rgba(37, 99, 235, 0.3);
      transform: translateY(-1px);
    }
    .btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon-container">
      ${iconSvg}
    </div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="${frontendUrl}/login" class="btn">Continue to Login</a>
  </div>
</body>
</html>
  `;
};

// ─── Verify Email ──────────────────────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  const payload = {
    token: req.query.token,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.verifyEmailParamType);

  const acceptHeader = req.headers.accept || "";
  const wantsHtml = acceptHeader.includes("text/html");

  if (validatePayload.err) {
    if (wantsHtml) {
      res.setHeader("Content-Type", "text/html");
      return res.status(400).send(renderVerificationResultPage(false, "Invalid verification request. The validation token is missing or malformed."));
    }
    return sendResponse(validatePayload, res);
  }

  const result = await commandHandler.verifyEmail(validatePayload.data);

  if (wantsHtml) {
    res.setHeader("Content-Type", "text/html");
    if (result.err) {
      const errorMsg = result.err.message || "Email verification failed.";
      return res.status(400).send(renderVerificationResultPage(false, errorMsg));
    }
    return res.status(200).send(renderVerificationResultPage(true, "Your email has been verified successfully! You can now log in to your account."));
  }

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

// ─── Resend Verification ─────────────────────────────────────────────────────
const resendVerification = async (req, res) => {
  const payload = {
    email: req.body.email,
  };
  const validatePayload = validator.isValidPayload(payload, commandModel.resendVerificationParamType);
  if (validatePayload.err) {
    return sendResponse(validatePayload, res);
  }
  const result = await commandHandler.resendVerification(validatePayload.data);
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
  resendVerification,
};
