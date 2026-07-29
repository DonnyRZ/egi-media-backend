const { ForbiddenError } = require("../errors");
const jwt = require("jsonwebtoken");
const wrapper = require("../utils/wrapper");
const config = require("../../config/global_config");

const parseJsonOption = (val) => {
  if (!val) return {};
  try {
    return JSON.parse(val.replace(/^'|'$/g, ""));
  } catch {
    return {};
  }
};

/**
 * Convert jwt `expiresIn` (seconds number or zeit/ms string) to seconds.
 * Falls back to 7 days when missing/invalid.
 */
const expiresInToSeconds = (expiresIn, fallbackSeconds = 7 * 24 * 60 * 60) => {
  if (typeof expiresIn === "number" && Number.isFinite(expiresIn) && expiresIn > 0) {
    return Math.floor(expiresIn);
  }

  if (typeof expiresIn !== "string") {
    return fallbackSeconds;
  }

  const trimmed = expiresIn.trim();
  if (!trimmed) return fallbackSeconds;

  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }

  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return fallbackSeconds;

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1, m: 60, h: 60 * 60, d: 24 * 60 * 60 };
  return amount * (multipliers[unit] || 1);
};

const signOptions = parseJsonOption(config.get("/jwt/accessSign"));
const refreshOptions = parseJsonOption(config.get("/jwt/refreshSign"));
const accessSecret = config.get("/jwt/accessTokenSecret");
const refreshSecret = config.get("/jwt/refreshTokenSecret");

const getAccessTokenExpiresInSeconds = () =>
  expiresInToSeconds(signOptions.expiresIn, 7 * 24 * 60 * 60);

const getToken = (authHeader) => {
  const token = authHeader && authHeader.split(" ")[1];
  return token;
};

const generateAccessToken = async (payload) => {
  return jwt.sign(payload, accessSecret, signOptions);
};

const generateRefreshToken = async (payload) => {
  return jwt.sign(payload, refreshSecret, refreshOptions);
};

const verifyAccessToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, accessSecret, signOptions);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.error(new ForbiddenError("Token Expired"));
    }
    return wrapper.error(new ForbiddenError("Token is not valid"));
  }

  return wrapper.data(decodedToken);
};

const verifyRefreshToken = async (token) => {
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, refreshSecret, refreshOptions);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return wrapper.error(new ForbiddenError("Refresh Token Expired"));
    }
    return wrapper.error(new ForbiddenError("Refresh Token is not valid"));
  }

  return wrapper.data(decodedToken);
};

module.exports = {
  getToken,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  getAccessTokenExpiresInSeconds,
  expiresInToSeconds,
};
